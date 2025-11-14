// Web Crypto API utilities for end-to-end encryption
// Uses PBKDF2 for key derivation and AES-GCM for encryption

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM

/**
 * Derive an encryption key from a passphrase using PBKDF2
 */
export async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: KEY_LENGTH,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a random salt
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Encrypt plaintext using AES-GCM
 */
export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv),
  };
}

/**
 * Decrypt ciphertext using AES-GCM
 */
export async function decrypt(
  ciphertext: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  const encryptedData = base64ToArrayBuffer(ciphertext);
  const ivBuffer = base64ToArrayBuffer(iv);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer,
    },
    key,
    encryptedData
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Encrypt all sensitive fields of an analysis record
 */
export async function encryptAnalysisData(
  data: {
    userEmail: string;
    inputContent: string;
    analysisContext?: Record<string, unknown> | null;
    mlResult: {
      is_phishing: boolean;
      phishing_probability: number;
    };
  },
  key: CryptoKey
): Promise<{
  userEmail: string;
  inputContent: string;
  analysisContext: string;
  mlResult: string;
}> {
  const [encryptedEmail, encryptedContent, encryptedContext, encryptedMlResult] =
    await Promise.all([
      encrypt(data.userEmail, key),
      encrypt(data.inputContent, key),
      encrypt(
        data.analysisContext ? JSON.stringify(data.analysisContext) : '',
        key
      ),
      encrypt(JSON.stringify(data.mlResult), key),
    ]);

  return {
    userEmail: JSON.stringify(encryptedEmail),
    inputContent: JSON.stringify(encryptedContent),
    analysisContext: JSON.stringify(encryptedContext),
    mlResult: JSON.stringify(encryptedMlResult),
  };
}

/**
 * Decrypt all sensitive fields of an analysis record
 */
export async function decryptAnalysisData(
  encrypted: {
    userEmail: string;
    inputContent: string;
    analysisContext?: string | null;
    mlResult: string;
  },
  key: CryptoKey
): Promise<{
  userEmail: string;
  inputContent: string;
  analysisContext?: Record<string, unknown> | null;
  mlResult: {
    is_phishing: boolean;
    phishing_probability: number;
  };
}> {
  const emailData = JSON.parse(encrypted.userEmail) as { ciphertext: string; iv: string };
  const contentData = JSON.parse(encrypted.inputContent) as { ciphertext: string; iv: string };
  const contextData = encrypted.analysisContext
    ? (JSON.parse(encrypted.analysisContext) as { ciphertext: string; iv: string })
    : null;
  const mlResultData = JSON.parse(encrypted.mlResult) as { ciphertext: string; iv: string };

  const [userEmail, inputContent, analysisContext, mlResult] = await Promise.all([
    decrypt(emailData.ciphertext, emailData.iv, key),
    decrypt(contentData.ciphertext, contentData.iv, key),
    contextData && contextData.ciphertext
      ? decrypt(contextData.ciphertext, contextData.iv, key).then((text) =>
          text ? JSON.parse(text) : null
        )
      : Promise.resolve(null),
    decrypt(mlResultData.ciphertext, mlResultData.iv, key).then((text) =>
      JSON.parse(text)
    ),
  ]);

  return {
    userEmail,
    inputContent,
    analysisContext,
    mlResult,
  };
}

/**
 * Encrypt a string value (for key material storage)
 */
export async function encryptKeyMaterial(
  plaintext: string,
  key: CryptoKey
): Promise<string> {
  const encrypted = await encrypt(plaintext, key);
  return JSON.stringify(encrypted);
}

/**
 * Decrypt a string value (for key material retrieval)
 */
export async function decryptKeyMaterial(
  encrypted: string,
  key: CryptoKey
): Promise<string> {
  const data = JSON.parse(encrypted) as { ciphertext: string; iv: string };
  return decrypt(data.ciphertext, data.iv, key);
}

// Helper functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

