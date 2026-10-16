import type { AuthChallenge } from "./auth-header";
import { base64ToText } from "./encoding";

/**
 * Machine Payments Protocol — the "Payment" HTTP authentication scheme
 * (draft-ryan-httpauth-payment).
 *
 * Challenge: WWW-Authenticate: Payment id, realm, method, intent, request
 * (required) plus optional expires, digest, description, opaque. `request` is
 * base64url-encoded JSON. The client pays through the named method and retries
 * with Authorization: Payment <base64url JSON {challenge, source?, payload}>,
 * echoing the challenge parameters unchanged. Success may carry Payment-Receipt.
 */

export interface DecodedMpp {
  id: string | null;
  realm: string | null;
  method: string | null;
  intent: string | null;
  expires: string | null;
  expired: boolean | null;
  digest: string | null;
  /** Display-only, seller-controlled. The draft forbids relying on it for verification. */
  description: string | null;
  /** Method-specific payment request, decoded from base64url JSON. */
  request: unknown;
  request_error: string | null;
  opaque: unknown;
  missing_required: string[];
  /** Echo these back unchanged in the credential's `challenge` object. */
  echo_parameters: Record<string, string>;
}

const REQUIRED = ["id", "realm", "method", "intent", "request"] as const;

function decodeBase64urlJson(value: string): { value: unknown; error: string | null } {
  try {
    return { value: JSON.parse(base64ToText(value)), error: null };
  } catch (error) {
    return { value: null, error: (error as Error).message };
  }
}

export function decodeMpp(challenge: AuthChallenge, now: number = Date.now()): DecodedMpp {
  const p = challenge.params;
  const request = p.request ? decodeBase64urlJson(p.request) : { value: null, error: null };
  const opaque = p.opaque ? decodeBase64urlJson(p.opaque).value : null;

  let expired: boolean | null = null;
  if (p.expires) {
    const at = Date.parse(p.expires);
    expired = Number.isFinite(at) ? now > at : null;
  }

  return {
    id: p.id ?? null,
    realm: p.realm ?? null,
    method: p.method ? p.method.toLowerCase() : null,
    intent: p.intent ? p.intent.toLowerCase() : null,
    expires: p.expires ?? null,
    expired,
    digest: p.digest ?? null,
    description: p.description ?? null,
    request: request.value,
    request_error: request.error,
    opaque,
    missing_required: REQUIRED.filter((name) => !p[name]),
    echo_parameters: { ...p },
  };
}
