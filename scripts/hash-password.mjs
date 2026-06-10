// Vygeneruje hash hesla pro tabulku users (stejný algoritmus jako src/server/password.ts).
// Použití: node scripts/hash-password.mjs "TajneHeslo"
import { webcrypto as crypto } from 'node:crypto';

const ITERATIONS = 100_000; // hard limit Workers runtime — držet v synci s src/server/password.ts
const SALT_BYTES = 16;
const HASH_BITS = 256;

const password = process.argv[2];
if (!password) {
  console.error('Použití: node scripts/hash-password.mjs "heslo"');
  process.exit(1);
}

const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, HASH_BITS);

const toB64 = (bytes) => Buffer.from(bytes).toString('base64');
console.log(`pbkdf2-sha256$${ITERATIONS}$${toB64(salt)}$${toB64(new Uint8Array(bits))}`);
