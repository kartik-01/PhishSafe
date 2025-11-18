// IndexedDB utilities for storing encrypted key material locally

const DB_NAME = 'SecureBeaconEncryption';
const DB_VERSION = 1;
const STORE_NAME = 'encryptionKeys';

/**
 * Initialize IndexedDB database
 */
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'userSub' });
        objectStore.createIndex('userSub', 'userSub', { unique: true });
      }
    };
  });
}

/**
 * Store encrypted key material for a user
 */
export async function storeEncryptedKey(
  userSub: string,
  encryptedKeyMaterial: string
): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({
      userSub,
      encryptedKeyMaterial,
      createdAt: new Date().toISOString(),
    });

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to store encrypted key'));
    };
  });
}

/**
 * Retrieve encrypted key material for a user
 */
export async function getEncryptedKey(
  userSub: string
): Promise<string | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(userSub);

    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.encryptedKeyMaterial : null);
    };

    request.onerror = () => {
      reject(new Error('Failed to retrieve encrypted key'));
    };
  });
}

/**
 * Clear encrypted key material for a user (on logout)
 * Note: This preserves the salt in IndexedDB for cross-device sync
 */
export async function clearEncryptedKey(userSub: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(userSub);

    request.onsuccess = () => {
      const existing = request.result;
      if (existing) {
        // Preserve salt but clear encrypted key material
        const updateRequest = store.put({
          userSub,
          encryptedKeyMaterial: '',
          salt: existing.salt || '',
          createdAt: existing.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        updateRequest.onsuccess = () => {
          resolve();
        };

        updateRequest.onerror = () => {
          reject(new Error('Failed to clear encrypted key'));
        };
      } else {
        // No existing record, nothing to clear
        resolve();
      }
    };

    request.onerror = () => {
      reject(new Error('Failed to retrieve user data for clearing'));
    };
  });
}

/**
 * Check if encrypted key exists for a user
 */
export async function hasEncryptedKey(userSub: string): Promise<boolean> {
  const key = await getEncryptedKey(userSub);
  return key !== null;
}

/**
 * Store salt for a user
 */
export async function storeSalt(
  userSub: string,
  salt: string
): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(userSub);

    request.onsuccess = () => {
      const existing = request.result;
      const updateRequest = store.put({
        userSub,
        encryptedKeyMaterial: existing?.encryptedKeyMaterial || '',
        salt,
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      updateRequest.onsuccess = () => {
        resolve();
      };

      updateRequest.onerror = () => {
        reject(new Error('Failed to store salt'));
      };
    };

    request.onerror = () => {
      reject(new Error('Failed to retrieve user data for salt storage'));
    };
  });
}

/**
 * Retrieve salt for a user
 */
export async function getSalt(userSub: string): Promise<string | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(userSub);

    request.onsuccess = () => {
      const result = request.result;
      resolve(result?.salt || null);
    };

    request.onerror = () => {
      reject(new Error('Failed to retrieve salt'));
    };
  });
}

