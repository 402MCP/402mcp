/** Base64 / base64url helpers that work identically in Workers, browsers and Node. */

export function base64ToBytes(input: string): Uint8Array {
  const normalized = input.trim().replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, "");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function base64ToText(input: string): string {
  return new TextDecoder().decode(base64ToBytes(input));
}

/** Parses base64 (or base64url) JSON; also accepts raw JSON for lenient callers. */
export function decodeJsonPayload(input: string): unknown {
  const trimmed = input.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return JSON.parse(trimmed);
  return JSON.parse(base64ToText(trimmed));
}

export function isPrintableText(bytes: Uint8Array): boolean {
  if (bytes.length === 0) return false;
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text);
  } catch {
    return false;
  }
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
