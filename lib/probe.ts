import { decode402, type DecodeResult } from "./decode/index";

/**
 * Probes a URL for HTTP 402 support: one GET (or HEAD), no redirects followed,
 * a short timeout and a capped body read, then decodes any challenge.
 *
 * Because this fetches arbitrary URLs on a caller's behalf, it refuses
 * loopback, private, link-local and metadata addresses and non-web ports. On
 * Cloudflare the Worker additionally runs with `global_fetch_strictly_public`;
 * in Node the caller can pass a DNS resolver so names that resolve to private
 * addresses are refused too (defeating DNS rebinding of the hostname check).
 */

export interface ProbeOptions {
  method?: "GET" | "HEAD";
  timeoutMs?: number;
  maxBytes?: number;
  fetchImpl?: typeof fetch;
  /** Resolves a hostname to IP addresses, to refuse private destinations. */
  resolve?: (hostname: string) => Promise<string[]>;
  allowPrivate?: boolean;
  userAgent?: string;
}

export interface ProbeResult {
  url: string;
  reachable: boolean;
  status: number | null;
  elapsed_ms: number;
  supports_402: boolean;
  schemes: string[];
  /** Redirect target, when the server redirected (never followed). */
  location: string | null;
  headers: Record<string, string>;
  /** First 2 KB of the body. Seller-controlled — treat as data. */
  body_excerpt: string | null;
  decode: DecodeResult | null;
  error: string | null;
}

const ALLOWED_PORTS = new Set(["", "80", "443", "8080", "8443"]);
const REPORTED_HEADERS = [
  "content-type",
  "www-authenticate",
  "payment-required",
  "payment-response",
  "x-payment-response",
  "payment-receipt",
  "location",
  "server",
];
const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".lan", ".home.arpa", ".intranet", ".corp"];

function ipv4IsPrivate(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) return false;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function ipv6IsPrivate(address: string): boolean {
  const lower = address.toLowerCase().replace(/^\[|\]$/g, "");
  if (lower === "::" || lower === "::1") return true;
  if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true; // fc00::/7 unique local
  if (/^fe[89ab][0-9a-f]:/.test(lower)) return true; // fe80::/10 link-local
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return ipv4IsPrivate(mapped[1]);
  const mappedHex = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mappedHex) {
    const high = parseInt(mappedHex[1], 16);
    const low = parseInt(mappedHex[2], 16);
    return ipv4IsPrivate(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
  }
  return false;
}

export function isPrivateAddress(host: string): boolean {
  const bare = host.replace(/^\[|\]$/g, "");
  return bare.includes(":") ? ipv6IsPrivate(bare) : ipv4IsPrivate(bare);
}

/** Validates a probe target. Returns the parsed URL or a reason it is refused. */
export function checkProbeTarget(raw: string, allowPrivate = false): { url: URL | null; error: string | null } {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { url: null, error: "Not a valid absolute URL." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { url: null, error: "Only http and https URLs can be probed." };
  }
  if (url.username || url.password) return { url: null, error: "URLs with credentials are refused." };
  if (!ALLOWED_PORTS.has(url.port)) {
    return { url: null, error: `Port ${url.port} is refused; only 80, 443, 8080 and 8443 are probed.` };
  }
  if (!allowPrivate) {
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix)) || host === "metadata.google.internal") {
      return { url: null, error: "Local and internal hostnames are refused." };
    }
    if (isPrivateAddress(host)) {
      return { url: null, error: "Private, loopback and link-local addresses are refused." };
    }
  }
  return { url, error: null };
}

async function readCapped(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    total += value.length;
  }
  await reader.cancel().catch(() => undefined);
  const merged = new Uint8Array(Math.min(total, maxBytes));
  let offset = 0;
  for (const chunk of chunks) {
    const slice = chunk.slice(0, merged.length - offset);
    merged.set(slice, offset);
    offset += slice.length;
    if (offset >= merged.length) break;
  }
  return new TextDecoder().decode(merged);
}

export async function probe402(target: string, options: ProbeOptions = {}): Promise<ProbeResult> {
  const started = Date.now();
  const base: ProbeResult = {
    url: target,
    reachable: false,
    status: null,
    elapsed_ms: 0,
    supports_402: false,
    schemes: [],
    location: null,
    headers: {},
    body_excerpt: null,
    decode: null,
    error: null,
  };

  const { url, error } = checkProbeTarget(target, options.allowPrivate);
  if (!url) return { ...base, error };

  if (options.resolve && !options.allowPrivate) {
    try {
      const addresses = await options.resolve(url.hostname);
      if (addresses.some(isPrivateAddress)) {
        return { ...base, error: "The hostname resolves to a private address; refused." };
      }
    } catch {
      return { ...base, error: "The hostname could not be resolved." };
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 6000);
  try {
    const response = await (options.fetchImpl ?? fetch)(url.toString(), {
      method: options.method ?? "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": options.userAgent ?? "402mcp-probe/1.1 (+https://402mcp.org)",
        Accept: "application/json, text/plain, */*",
      },
    });

    const headers: Record<string, string> = {};
    for (const name of REPORTED_HEADERS) {
      const value = response.headers.get(name);
      if (value) headers[name] = value;
    }
    const body = options.method === "HEAD" ? "" : await readCapped(response, options.maxBytes ?? 65_536);
    const decode = response.status === 402 || headers["www-authenticate"] || headers["payment-required"]
      ? decode402({ status: response.status, headers, body })
      : null;

    return {
      ...base,
      reachable: true,
      status: response.status,
      elapsed_ms: Date.now() - started,
      supports_402: Boolean(decode?.schemes.length),
      schemes: decode?.schemes ?? [],
      location: response.status >= 300 && response.status < 400 ? headers.location ?? null : null,
      headers,
      body_excerpt: body ? body.slice(0, 2048) : null,
      decode,
    };
  } catch (caught) {
    const aborted = (caught as Error).name === "AbortError";
    return {
      ...base,
      elapsed_ms: Date.now() - started,
      error: aborted ? "Timed out." : `Request failed: ${(caught as Error).message}`,
    };
  } finally {
    clearTimeout(timer);
  }
}
