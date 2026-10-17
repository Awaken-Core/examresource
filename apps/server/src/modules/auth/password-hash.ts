const ALGORITHM = 'PBKDF2';
const DIGEST = 'SHA-256';
const ITERATIONS = 600_000;
const KEY_LENGTH_BITS = 256;
const PREFIX = 'pbkdf2-sha256';

const encoder = new TextEncoder();

function encodeBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const saltBuffer = Uint8Array.from(salt).buffer;
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    ALGORITHM,
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: ALGORITHM, hash: DIGEST, salt: saltBuffer, iterations },
    key,
    KEY_LENGTH_BITS,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `${PREFIX}$${ITERATIONS}$${encodeBase64Url(salt)}$${encodeBase64Url(hash)}`;
}

export async function verifyPassword(storedHash: string, password: string) {
  const [prefix, iterationsValue, saltValue, hashValue] = storedHash.split('$');
  if (prefix !== PREFIX || !iterationsValue || !saltValue || !hashValue) return false;

  const iterations = Number(iterationsValue);
  if (!Number.isSafeInteger(iterations) || iterations < 1 || iterations > ITERATIONS) return false;

  try {
    const expected = decodeBase64Url(hashValue);
    const actual = await derive(password, decodeBase64Url(saltValue), iterations);
    if (actual.length !== expected.length) return false;
    let difference = 0;
    for (let index = 0; index < actual.length; index += 1) {
      difference |= actual[index]! ^ expected[index]!;
    }
    return difference === 0;
  } catch {
    return false;
  }
}
