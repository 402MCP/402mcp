/**
 * Bech32 decoding (BIP-173) without the 90-character limit, as BOLT 11 requires.
 * Verifies the checksum, so a mistyped invoice is rejected rather than misread.
 */

const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function polymod(values: number[]): number {
  let checksum = 1;
  for (const value of values) {
    const top = checksum >>> 25;
    checksum = ((checksum & 0x1ffffff) << 5) ^ value;
    for (let bit = 0; bit < 5; bit += 1) {
      if ((top >>> bit) & 1) checksum ^= GENERATOR[bit];
    }
  }
  return checksum;
}

function expandHrp(hrp: string): number[] {
  const high: number[] = [];
  const low: number[] = [];
  for (let i = 0; i < hrp.length; i += 1) {
    const code = hrp.charCodeAt(i);
    high.push(code >>> 5);
    low.push(code & 31);
  }
  return [...high, 0, ...low];
}

export interface Bech32Decoded {
  hrp: string;
  /** Data words, checksum removed. */
  words: number[];
}

export function bech32Decode(input: string): Bech32Decoded {
  const trimmed = input.trim();
  if (trimmed !== trimmed.toLowerCase() && trimmed !== trimmed.toUpperCase()) {
    throw new Error("Bech32 string mixes upper and lower case.");
  }
  const value = trimmed.toLowerCase();
  const separator = value.lastIndexOf("1");
  if (separator < 1 || separator + 7 > value.length) {
    throw new Error("Not a bech32 string: missing separator or checksum.");
  }

  const hrp = value.slice(0, separator);
  const words: number[] = [];
  for (const char of value.slice(separator + 1)) {
    const index = CHARSET.indexOf(char);
    if (index === -1) throw new Error(`Invalid bech32 character "${char}".`);
    words.push(index);
  }

  if (polymod([...expandHrp(hrp), ...words]) !== 1) {
    throw new Error("Bech32 checksum does not match — the string is corrupted or truncated.");
  }

  return { hrp, words: words.slice(0, -6) };
}

/** Packs 5-bit words into bytes, discarding trailing padding bits. */
export function wordsToBytes(words: number[]): Uint8Array {
  const bytes: number[] = [];
  let accumulator = 0;
  let bits = 0;
  for (const word of words) {
    accumulator = (accumulator << 5) | word;
    bits += 5;
    while (bits >= 8) {
      bits -= 8;
      bytes.push((accumulator >>> bits) & 0xff);
    }
    accumulator &= (1 << bits) - 1;
  }
  return Uint8Array.from(bytes);
}

/** Reads words as one big-endian unsigned integer. */
export function wordsToInteger(words: number[]): number {
  return words.reduce((total, word) => total * 32 + word, 0);
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
