import { base64ToBytes, bytesToHex, isPrintableText } from "./encoding";

/**
 * Best-effort macaroon decoder (v2 binary and legacy v1 packet formats).
 *
 * Surfaces what an agent can usefully inspect before paying: the location,
 * the identifier, and the first-party caveats that restrict what the token
 * will grant. For L402 tokens minted by Aperture, the identifier also commits
 * to the invoice's payment hash, which lets a client check the two belong
 * together. The signature is reported but cannot be verified without the
 * root key, which only the issuer holds.
 */

export interface MacaroonCaveat {
  condition: string;
  third_party: boolean;
  location: string | null;
}

export interface DecodedMacaroon {
  format: "v2" | "v1";
  location: string | null;
  identifier_hex: string;
  identifier_text: string | null;
  /** Present when the identifier has the L402 layout used by Aperture. */
  l402_identifier: { version: number; payment_hash: string; token_id: string } | null;
  caveats: MacaroonCaveat[];
  signature_hex: string | null;
}

const FIELD_EOS = 0;
const FIELD_LOCATION = 1;
const FIELD_IDENTIFIER = 2;
const FIELD_VID = 4;
const FIELD_SIGNATURE = 6;

/** Aperture's identifier: uint16 version, 32-byte payment hash, 32-byte token id. */
function parseL402Identifier(identifier: Uint8Array): DecodedMacaroon["l402_identifier"] {
  if (identifier.length !== 66) return null;
  const version = (identifier[0] << 8) | identifier[1];
  if (version !== 0) return null;
  return {
    version,
    payment_hash: bytesToHex(identifier.slice(2, 34)),
    token_id: bytesToHex(identifier.slice(34, 66)),
  };
}

function text(bytes: Uint8Array): string | null {
  return isPrintableText(bytes) ? new TextDecoder().decode(bytes) : null;
}

class Reader {
  position = 0;
  constructor(private readonly bytes: Uint8Array) {}

  get done(): boolean {
    return this.position >= this.bytes.length;
  }

  peek(): number {
    return this.bytes[this.position];
  }

  uvarint(): number {
    let result = 0;
    let shift = 0;
    for (;;) {
      if (this.done) throw new Error("Truncated varint.");
      const byte = this.bytes[this.position];
      this.position += 1;
      result += (byte & 0x7f) * 2 ** shift;
      if ((byte & 0x80) === 0) return result;
      shift += 7;
      if (shift > 49) throw new Error("Varint too long.");
    }
  }

  /** Reads one field, or returns null at an end-of-section marker. */
  field(): { type: number; data: Uint8Array } | null {
    const type = this.uvarint();
    if (type === FIELD_EOS) return null;
    const length = this.uvarint();
    if (this.position + length > this.bytes.length) throw new Error("Truncated field.");
    const data = this.bytes.slice(this.position, this.position + length);
    this.position += length;
    return { type, data };
  }
}

function decodeV2(bytes: Uint8Array): DecodedMacaroon {
  const reader = new Reader(bytes);
  reader.position = 1; // version byte

  let location: Uint8Array | null = null;
  let identifier: Uint8Array | null = null;
  for (let field = reader.field(); field; field = reader.field()) {
    if (field.type === FIELD_LOCATION) location = field.data;
    else if (field.type === FIELD_IDENTIFIER) identifier = field.data;
  }
  if (!identifier) throw new Error("Macaroon has no identifier.");

  const caveats: MacaroonCaveat[] = [];
  while (!reader.done && reader.peek() !== FIELD_EOS) {
    let caveatLocation: Uint8Array | null = null;
    let caveatId: Uint8Array | null = null;
    let hasVid = false;
    for (let field = reader.field(); field; field = reader.field()) {
      if (field.type === FIELD_LOCATION) caveatLocation = field.data;
      else if (field.type === FIELD_IDENTIFIER) caveatId = field.data;
      else if (field.type === FIELD_VID) hasVid = true;
    }
    if (caveatId) {
      caveats.push({
        condition: text(caveatId) ?? `0x${bytesToHex(caveatId)}`,
        third_party: hasVid,
        location: caveatLocation ? text(caveatLocation) : null,
      });
    }
  }
  if (!reader.done) reader.position += 1; // end-of-caveats marker

  let signature: Uint8Array | null = null;
  if (!reader.done) {
    const field = reader.field();
    if (field?.type === FIELD_SIGNATURE) signature = field.data;
  }

  return {
    format: "v2",
    location: location ? text(location) : null,
    identifier_hex: bytesToHex(identifier),
    identifier_text: text(identifier),
    l402_identifier: parseL402Identifier(identifier),
    caveats,
    signature_hex: signature ? bytesToHex(signature) : null,
  };
}

/** Legacy v1: a sequence of "LLLLkey value\n" packets, LLLL being hex length. */
function decodeV1(bytes: Uint8Array): DecodedMacaroon {
  const raw = new TextDecoder().decode(bytes);
  let position = 0;
  let location: string | null = null;
  let identifier = "";
  let signature: string | null = null;
  const caveats: MacaroonCaveat[] = [];
  let pendingThirdParty = false;

  while (position + 4 <= raw.length) {
    const size = Number.parseInt(raw.slice(position, position + 4), 16);
    if (!Number.isFinite(size) || size < 5) throw new Error("Malformed v1 packet.");
    const packet = raw.slice(position + 4, position + size).replace(/\n$/, "");
    position += size;
    const space = packet.indexOf(" ");
    const key = packet.slice(0, space);
    const value = packet.slice(space + 1);
    if (key === "location") location = value;
    else if (key === "identifier") identifier = value;
    else if (key === "cid") caveats.push({ condition: value, third_party: false, location: null });
    else if (key === "vid") pendingThirdParty = true;
    else if (key === "cl" && caveats.length) {
      caveats[caveats.length - 1].location = value;
      caveats[caveats.length - 1].third_party = pendingThirdParty;
      pendingThirdParty = false;
    } else if (key === "signature") signature = bytesToHex(new TextEncoder().encode(value));
  }
  if (!identifier) throw new Error("Macaroon has no identifier.");

  const identifierBytes = new TextEncoder().encode(identifier);
  return {
    format: "v1",
    location,
    identifier_hex: bytesToHex(identifierBytes),
    identifier_text: identifier,
    l402_identifier: null,
    caveats,
    signature_hex: signature,
  };
}

export function decodeMacaroon(value: string): DecodedMacaroon {
  const bytes = base64ToBytes(value);
  if (bytes.length === 0) throw new Error("Empty macaroon.");
  if (bytes[0] === 2) return decodeV2(bytes);
  return decodeV1(bytes);
}
