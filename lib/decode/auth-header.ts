/**
 * Lenient parser for WWW-Authenticate challenge lists (RFC 9110 §11.6.1).
 *
 * Handles several challenges in one header value, quoted strings with escapes,
 * token68, comma- or space-separated auth-params (some L402 servers omit the
 * commas), and folded multi-line headers.
 */

export interface AuthChallenge {
  /** As sent; compare case-insensitively. */
  scheme: string;
  /** Parameter names lower-cased. */
  params: Record<string, string>;
  token68: string | null;
}

const TOKEN_CHAR = /[!#$%&'*+\-.^_`|~0-9A-Za-z/]/;

export function parseAuthChallenges(header: string): AuthChallenge[] {
  const input = header.replace(/\r?\n[ \t]*/g, " ");
  const challenges: AuthChallenge[] = [];
  let i = 0;

  const skipWhitespace = () => {
    while (i < input.length && /\s/.test(input[i])) i += 1;
  };
  /** Skips whitespace and commas; reports whether a comma was crossed. */
  const skipSeparators = (): boolean => {
    let sawComma = false;
    while (i < input.length && (/\s/.test(input[i]) || input[i] === ",")) {
      if (input[i] === ",") sawComma = true;
      i += 1;
    }
    return sawComma;
  };
  const readToken = (): string => {
    const start = i;
    while (i < input.length && TOKEN_CHAR.test(input[i])) i += 1;
    return input.slice(start, i);
  };
  const readQuoted = (): string => {
    i += 1; // opening quote
    let value = "";
    while (i < input.length && input[i] !== '"') {
      if (input[i] === "\\" && i + 1 < input.length) i += 1;
      value += input[i];
      i += 1;
    }
    i += 1; // closing quote
    return value;
  };
  const readBare = (): string => {
    const start = i;
    while (i < input.length && !/[\s,]/.test(input[i])) i += 1;
    return input.slice(start, i);
  };

  skipSeparators();
  while (i < input.length) {
    const scheme = readToken();
    if (!scheme) {
      i += 1; // unparseable character — skip and resync
      skipSeparators();
      continue;
    }
    const challenge: AuthChallenge = { scheme, params: {}, token68: null };
    challenges.push(challenge);

    for (;;) {
      const crossedComma = skipSeparators();
      if (i >= input.length) break;

      const start = i;
      const name = readToken();
      skipWhitespace();

      if (name && input[i] === "=") {
        // Either name=value, or a token68 ending in "=" padding.
        let equals = 0;
        while (input[i + equals] === "=") equals += 1;
        const after = input[i + equals];
        const isToken68 =
          equals >= 1 &&
          Object.keys(challenge.params).length === 0 &&
          challenge.token68 === null &&
          (after === undefined || after === "," || /\s/.test(after)) &&
          (equals > 1 || after === undefined || after === ",");
        if (isToken68) {
          challenge.token68 = name + "=".repeat(equals);
          i += equals;
          continue;
        }
        i += 1;
        skipWhitespace();
        const value = input[i] === '"' ? readQuoted() : readBare();
        challenge.params[name.toLowerCase()] = value;
        continue;
      }

      if (
        name &&
        !crossedComma &&
        Object.keys(challenge.params).length === 0 &&
        challenge.token68 === null
      ) {
        // A bare value straight after the scheme is token68 (e.g. "Bearer abc").
        challenge.token68 = name;
        continue;
      }

      // A bare token after parameters begins the next challenge.
      i = start;
      break;
    }
    skipSeparators();
  }

  return challenges;
}
