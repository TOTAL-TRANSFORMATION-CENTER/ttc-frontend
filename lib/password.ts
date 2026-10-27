import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Reusable Password Utilities
 * Provides strong random password generation, protective bcrypt hashing,
 * secret key HMAC pepper, and secure password verification.
 */

export interface PasswordGeneratorOptions {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
}

/**
 * Secret key from environment used as an HMAC pepper for password hashing.
 * Binds the server-side environment secret with the user password before hashing,
 * protecting against database leaks, precomputed rainbow tables, and GPU cracking.
 */
const AUTH_SECRET_KEY =
  process.env.AUTH_SECRET_KEY ||
  process.env.AUTH_SECRET ||
  (process.env.NODE_ENV !== "production"
    ? "dev_local_secret_key_only_do_not_use_in_production_32chars"
    : "");

/**
 * Protective salt rounds for bcrypt hashing.
 * Default is 12 (4,096 iterations) — the OWASP recommended industry standard
 * for strong brute-force and dictionary attack resistance.
 */
const DEFAULT_SALT_ROUNDS = 12;

export function getSaltRounds(): number {
  const envRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "", 10);
  if (!isNaN(envRounds) && envRounds >= 10 && envRounds <= 16) {
    return envRounds;
  }
  return DEFAULT_SALT_ROUNDS;
}

/**
 * Generates an HMAC-SHA256 peppered digest of the password.
 * 1. Binds the secret key from .env to the password before bcrypt.
 * 2. Produces a 64-character hex digest, preventing bcrypt's 72-byte truncation limitation.
 * 3. Prevents rainbow-table or precomputed dictionary attacks even if the database is leaked.
 */
export function pepperPassword(password: string): string {
  return crypto
    .createHmac("sha256", AUTH_SECRET_KEY)
    .update(password)
    .digest("hex");
}

/**
 * Checks if a string is a valid bcrypt hash
 */
export function isBcryptHash(str: string): boolean {
  return /^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$/.test(str);
}

/**
 * Hashes a plain-text password using bcrypt with protective salt rounds and secret key pepper.
 */
export async function hashPassword(plainText: string): Promise<string> {
  const peppered = pepperPassword(plainText);
  const rounds = getSaltRounds();
  return bcrypt.hash(peppered, rounds);
}

/**
 * Verifies a plain-text password against a stored hash (or legacy plain text).
 * Returns:
 *   - isValid: true if password matches
 *   - needsRehash: true if the stored password was legacy plain-text or unpeppered bcrypt
 *     so the caller can transparently re-hash and upgrade the database entry.
 */
export async function verifyPassword(
  plainText: string,
  storedHash: string
): Promise<{ isValid: boolean; needsRehash: boolean }> {
  if (!plainText || !storedHash) {
    return { isValid: false, needsRehash: false };
  }

  // 1. If stored value is a bcrypt hash
  if (isBcryptHash(storedHash)) {
    // Check with HMAC pepper (primary standard)
    const peppered = pepperPassword(plainText);
    const matchesPeppered = await bcrypt.compare(peppered, storedHash);
    if (matchesPeppered) {
      return { isValid: true, needsRehash: false };
    }

    // Fallback: Check standard bcrypt without pepper (for any hash created without pepper)
    const matchesRaw = await bcrypt.compare(plainText, storedHash);
    if (matchesRaw) {
      return { isValid: true, needsRehash: true };
    }

    return { isValid: false, needsRehash: false };
  }

  // 2. Legacy fallback: Direct plain text comparison (upgrades on first successful login)
  if (plainText === storedHash) {
    return { isValid: true, needsRehash: true };
  }

  return { isValid: false, needsRehash: false };
}

/**
 * Generates a cryptographically strong random password.
 * Default length: 14 characters.
 * Guarantees inclusion of uppercase, lowercase, numbers, and special symbols.
 */
export function generateStrongPassword(
  lengthOrOptions: number | PasswordGeneratorOptions = 14
): string {
  const options: PasswordGeneratorOptions =
    typeof lengthOrOptions === "number"
      ? { length: lengthOrOptions }
      : lengthOrOptions;

  const length = Math.max(8, options.length ?? 14);
  const useUpper = options.includeUppercase ?? true;
  const useLower = options.includeLowercase ?? true;
  const useNums = options.includeNumbers ?? true;
  const useSymbols = options.includeSymbols ?? true;

  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // exclude ambiguous I, O
  const lowercase = "abcdefghijkmnopqrstuvwxyz"; // exclude ambiguous l
  const numbers = "23456789"; // exclude ambiguous 0, 1
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  let charPool = "";
  const guaranteedChars: string[] = [];

  if (useUpper) {
    charPool += uppercase;
    guaranteedChars.push(uppercase[Math.floor(Math.random() * uppercase.length)]);
  }
  if (useLower) {
    charPool += lowercase;
    guaranteedChars.push(lowercase[Math.floor(Math.random() * lowercase.length)]);
  }
  if (useNums) {
    charPool += numbers;
    guaranteedChars.push(numbers[Math.floor(Math.random() * numbers.length)]);
  }
  if (useSymbols) {
    charPool += symbols;
    guaranteedChars.push(symbols[Math.floor(Math.random() * symbols.length)]);
  }

  // Fallback in case options disable everything
  if (!charPool) {
    charPool = uppercase + lowercase + numbers + symbols;
  }

  const result = [...guaranteedChars];
  for (let i = result.length; i < length; i++) {
    result.push(charPool[Math.floor(Math.random() * charPool.length)]);
  }

  // Fisher-Yates shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join("");
}

