// Simplified encryption utilities for HealthVault
// Keys are now managed by the backend - frontend only handles encryption/decryption

/**
 * Generates a cryptographically secure encryption key
 * @returns Promise containing the generated key as an ArrayBuffer
 */
export const generateEncryptionKey = async (): Promise<ArrayBuffer> => {
  const key = crypto.getRandomValues(new Uint8Array(32)); // 256-bit key
  return key.buffer;
};

/**
 * Imports a key from raw bytes for use with Web Crypto API
 * @param keyBytes - The raw key bytes
 * @returns Promise containing the imported CryptoKey
 */
export const importKey = async (keyBytes: ArrayBuffer): Promise<CryptoKey> => {
  return await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypts a file using AES-GCM
 * @param file - The File object to encrypt
 * @param key - The CryptoKey to use for encryption
 * @returns Promise containing the encrypted data and IV
 */
export const encryptFile = async (file: File, key: CryptoKey): Promise<{ encryptedData: ArrayBuffer, iv: Uint8Array }> => {
  const fileBuffer = await file.arrayBuffer();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits for AES-GCM

  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv, tagLength: 128 },
    key,
    fileBuffer
  );

  return { encryptedData, iv };
};

/**
 * Decrypts data using AES-GCM
 * @param encryptedData - The encrypted data as an ArrayBuffer
 * @param key - The CryptoKey to use for decryption
 * @param iv - The initialization vector used during encryption
 * @returns Promise containing the decrypted data
 */
export const decryptData = async (encryptedData: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<ArrayBuffer> => {
  return await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encryptedData
  );
};

/**
 * Creates an encrypted file from raw file data
 * @param file - The original file to encrypt
 * @param encryptionKey - The key to use for encryption (as ArrayBuffer)
 * @returns Promise containing the encrypted file and metadata
 */
export const createEncryptedFile = async (file: File, encryptionKey: ArrayBuffer): Promise<{ encryptedFile: File, encryptionMetadata: any }> => {
  const cryptoKey = await importKey(encryptionKey);
  const { encryptedData, iv } = await encryptFile(file, cryptoKey);

  const encryptedBlob = new Blob([encryptedData]);
  // Keep original filename - server will add timestamp prefix
  const encryptedFile = new File([encryptedBlob], file.name, { type: file.type });

  return {
    encryptedFile,
    encryptionMetadata: {
      iv: Array.from(iv),
      originalName: file.name,
      originalType: file.type
    }
  };
};

/**
 * Decrypts a file using provided metadata
 * @param encryptedFile - The encrypted File object
 * @param encryptionKey - The key to use for decryption (as ArrayBuffer)
 * @param encryptionMetadata - Metadata containing IV and other info
 * @returns Promise containing the decrypted File object
 */
export const decryptFile = async (encryptedFile: File, encryptionKey: ArrayBuffer, encryptionMetadata: any): Promise<File> => {
  const cryptoKey = await importKey(encryptionKey);
  const iv = new Uint8Array(encryptionMetadata.iv);
  const encryptedArrayBuffer = await encryptedFile.arrayBuffer();
  const decryptedArrayBuffer = await decryptData(encryptedArrayBuffer, cryptoKey, iv);

  return new File([decryptedArrayBuffer], encryptionMetadata.originalName, {
    type: encryptionMetadata.originalType
  });
};

/**
 * Stores encryption key in sessionStorage for current session only
 * Keys are automatically cleared when the browser tab is closed
 * @param key - The encryption key as hex string
 * @param recordId - The record ID
 */
export const storeKeyInSession = (key: string, recordId: string): void => {
  sessionStorage.setItem(`enc_key_${recordId}`, key);
  console.log(`Stored encryption key in session for record: ${recordId}`);
};

/**
 * Retrieves encryption key from sessionStorage
 * @param recordId - The record ID
 * @returns The encryption key as ArrayBuffer, or null if not found
 */
export const getKeyFromSession = (recordId: string): ArrayBuffer | null => {
  const keyStr = sessionStorage.getItem(`enc_key_${recordId}`);
  if (!keyStr) {
    return null;
  }

  try {
    const keyBytes = new Uint8Array(keyStr.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    return keyBytes.buffer;
  } catch (error) {
    console.error('Error parsing encryption key from session:', error);
    return null;
  }
};

/**
 * Converts ArrayBuffer key to hex string for storage
 * @param key - The encryption key as ArrayBuffer
 * @returns Hex string representation
 */
export const keyToHexString = (key: ArrayBuffer): string => {
  return Array.from(new Uint8Array(key))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Converts hex string back to ArrayBuffer
 * @param hexString - The hex string
 * @returns ArrayBuffer representation
 */
export const hexStringToKey = (hexString: string): ArrayBuffer => {
  const keyBytes = new Uint8Array(hexString.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  return keyBytes.buffer;
};

/**
 * Clears all encryption keys from sessionStorage
 * Useful for logout or session cleanup
 */
export const clearSessionKeys = (): void => {
  const keysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith('enc_key_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => sessionStorage.removeItem(key));
  console.log(`Cleared ${keysToRemove.length} encryption keys from session`);
};
