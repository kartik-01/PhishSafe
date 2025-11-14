import { createContext, useContext, ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  deriveKey,
  generateSalt,
  encryptAnalysisData,
  decryptAnalysisData,
  encryptKeyMaterial,
  decryptKeyMaterial,
} from '@/utils/crypto';
import {
  storeEncryptedKey,
  getEncryptedKey,
  hasEncryptedKey,
} from '@/utils/indexedDB';
import type { Analysis, EncryptedAnalysis } from '@/types/api';

interface EncryptionContextType {
  isSetup: boolean;
  isUnlocked: boolean;
  isLoading: boolean;
  setupEncryption: (passphrase: string) => Promise<void>;
  unlockEncryption: (passphrase: string) => Promise<void>;
  lockEncryption: () => void;
  encryptData: (data: Partial<Analysis>) => Promise<Partial<EncryptedAnalysis>>;
  decryptData: (encrypted: EncryptedAnalysis) => Promise<Analysis>;
  getSalt: () => Promise<string | null>;
  saveSalt: (salt: string) => Promise<void>;
  getEncryptionStatus: () => Promise<{ hasSalt: boolean; hasAnalyses: boolean; salt: string | null }>;
}

const EncryptionContext = createContext<EncryptionContextType | undefined>(undefined);

export function EncryptionProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth();
  const [isSetup, setIsSetup] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [userSalt, setUserSalt] = useState<string | null>(null);
  const hasCheckedSetupRef = useRef(false);

  const userSub = user?.sub;

  const getEncryptionStatus = useCallback(async (): Promise<{ hasSalt: boolean; hasAnalyses: boolean; salt: string | null }> => {
    if (!userSub) {
      return { hasSalt: false, hasAnalyses: false, salt: null };
    }

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/encryption/status`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.salt) {
          setUserSalt(data.salt);
        }
        return {
          hasSalt: data.hasSalt || false,
          hasAnalyses: data.hasAnalyses || false,
          salt: data.salt || null,
        };
      }
    } catch (error) {
      console.error('Failed to fetch encryption status:', error);
    }

    return { hasSalt: false, hasAnalyses: false, salt: null };
  }, [userSub, getAccessTokenSilently]);

  // Check if encryption is setup for current user
  useEffect(() => {
    const checkSetup = async () => {
      if (!isAuthenticated || !userSub) {
        setIsSetup(false);
        setIsUnlocked(false);
        setIsLoading(false);
        hasCheckedSetupRef.current = false;
        return;
      }

      // Don't re-check if already unlocked (prevents resetting state after unlock)
      if (isUnlocked && encryptionKey) {
        return;
      }

      // Don't re-check if we've already checked and setup is true
      if (hasCheckedSetupRef.current && isSetup) {
        return;
      }

      try {
        // First check IndexedDB for local key material
        const hasLocalKey = await hasEncryptedKey(userSub);
        
        if (hasLocalKey) {
          // Key exists locally - encryption is setup
          setIsSetup(true);
          hasCheckedSetupRef.current = true;
          // Only set unlocked to false if we don't have key in memory
          if (!encryptionKey) {
            setIsUnlocked(false);
          }
          if (!encryptionKey) {
            setEncryptionKey(null);
          }
        } else {
          // No local key - check encryption status (salt + analyses) from backend
          try {
            const status = await getEncryptionStatus();
            
            if (status.hasSalt) {
              // Salt exists - encryption is setup, just need to unlock
              if (status.salt) {
                setUserSalt(status.salt);
              }
              setIsSetup(true);
              hasCheckedSetupRef.current = true;
              // Only set unlocked to false if we don't have key in memory
              if (!encryptionKey) {
                setIsUnlocked(false);
              }
            } else if (status.hasAnalyses) {
              // User has analyses but no salt - error state (shouldn't happen)
              console.error('User has analyses but no salt found - data inconsistency');
              setIsSetup(false);
              setIsUnlocked(false);
            } else {
              // No salt and no analyses - new user, encryption not setup
              setIsSetup(false);
              setIsUnlocked(false);
            }
          } catch (error) {
            // Failed to check backend - assume not setup
            console.error('Failed to check encryption status:', error);
            setIsSetup(false);
            setIsUnlocked(false);
          }
        }
      } catch (error) {
        console.error('Failed to check encryption setup:', error);
        // Don't reset setup if we're already unlocked
        if (!isUnlocked) {
          setIsSetup(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkSetup();
  }, [isAuthenticated, userSub, getAccessTokenSilently, getEncryptionStatus, encryptionKey, isUnlocked, isSetup]);

  // Lock encryption on logout
  useEffect(() => {
    if (!isAuthenticated) {
      lockEncryption();
    }
  }, [isAuthenticated]);

  const getSalt = useCallback(async (): Promise<string | null> => {
    if (userSalt) return userSalt;

    if (!userSub) return null;

    try {
      const status = await getEncryptionStatus();
      return status.salt;
    } catch (error) {
      console.error('Failed to fetch salt:', error);
    }

    return null;
  }, [userSub, userSalt, getEncryptionStatus]);

  const saveSalt = useCallback(async (salt: string): Promise<void> => {
    if (!userSub) throw new Error('User not authenticated');

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/encryption/salt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ salt }),
      });

      if (!response.ok) {
        throw new Error('Failed to save salt');
      }

      setUserSalt(salt);
    } catch (error) {
      console.error('Failed to save salt:', error);
      throw error;
    }
  }, [userSub]);

  const setupEncryption = useCallback(async (passphrase: string): Promise<void> => {
    if (!userSub) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      // Generate salt
      const salt = generateSalt();
      const saltBase64 = btoa(String.fromCharCode(...salt));

      // Derive encryption key from passphrase + salt
      const key = await deriveKey(passphrase, salt);

      // Create verification data encrypted with the key
      // This encrypted data will be stored in IndexedDB to verify passphrase later
      const verificationData = JSON.stringify({
        timestamp: Date.now(),
        userSub: userSub,
      });
      const encryptedKeyMaterial = await encryptKeyMaterial(verificationData, key);

      // Store encrypted key material in IndexedDB (this proves encryption is setup)
      await storeEncryptedKey(userSub, encryptedKeyMaterial);

      // Save salt to backend for cross-device recovery
      await saveSalt(saltBase64);

      // Store key in memory (will be cleared on logout)
      setEncryptionKey(key);
      setUserSalt(saltBase64);
      setIsSetup(true);
      setIsUnlocked(true);
      hasCheckedSetupRef.current = true;
    } catch (error) {
      console.error('Failed to setup encryption:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userSub, saveSalt, getAccessTokenSilently]);

  const unlockEncryption = useCallback(async (passphrase: string): Promise<void> => {
    if (!userSub) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      // Get salt (from backend if not in memory)
      let saltBase64 = userSalt;
      if (!saltBase64) {
        saltBase64 = await getSalt();
        if (!saltBase64) {
          throw new Error('Salt not found. Please set up encryption first.');
        }
      }

      // Convert salt from base64 to Uint8Array
      const salt = Uint8Array.from(atob(saltBase64), (c) => c.charCodeAt(0));

      // Derive encryption key from passphrase + salt (same process as setup)
      const key = await deriveKey(passphrase, salt);

      // Verify key by trying to decrypt stored key material OR existing encrypted data
      const encryptedKeyMaterial = await getEncryptedKey(userSub);
      if (!encryptedKeyMaterial) {
        // No key material stored locally - this is first unlock on new device
        // CRITICAL: We MUST verify passphrase by decrypting existing encrypted data from backend
        // This prevents accepting wrong passphrases on new devices
        try {
          const token = await getAccessTokenSilently();
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analyses?limit=1`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.items && data.items.length > 0) {
              // Try to decrypt the first encrypted record to verify passphrase
              const encryptedRecord = data.items[0] as EncryptedAnalysis;
              try {
                await decryptAnalysisData(
                  {
                    userEmail: encryptedRecord.userEmail,
                    inputContent: encryptedRecord.inputContent,
                    analysisContext: encryptedRecord.analysisContext,
                    mlResult: encryptedRecord.mlResult,
                  },
                  key
                );
                // Decryption succeeded - passphrase is correct!
                // Now store encrypted key material for future unlocks
                const verificationData = JSON.stringify({
                  timestamp: Date.now(),
                  userSub: userSub,
                });
                const encrypted = await encryptKeyMaterial(verificationData, key);
                await storeEncryptedKey(userSub, encrypted);
              } catch (decryptError) {
                // Decryption failed - wrong passphrase
                throw new Error('Invalid passphrase. Please try again.');
              }
            } else {
              // No existing records - can't verify, but this shouldn't happen if encryption is setup
              // If user has no records yet, we can't verify, so allow it (edge case)
              // Store encrypted key material for future verification
              const verificationData = JSON.stringify({
                timestamp: Date.now(),
                userSub: userSub,
              });
              const encrypted = await encryptKeyMaterial(verificationData, key);
              await storeEncryptedKey(userSub, encrypted);
            }
          } else {
            throw new Error('Failed to fetch encrypted data for verification');
          }
        } catch (error: any) {
          if (error.message.includes('Invalid passphrase')) {
            throw error;
          }
          throw new Error('Failed to verify passphrase. Please try again.');
        }
      } else {
        // Verify key works by decrypting stored material
        try {
          const decrypted = await decryptKeyMaterial(encryptedKeyMaterial, key);
          // Verify the decrypted data contains expected structure
          const data = JSON.parse(decrypted);
          if (!data.userSub || data.userSub !== userSub) {
            throw new Error('Invalid key material');
          }
        } catch (error) {
          throw new Error('Invalid passphrase. Please try again.');
        }
      }

      // Store key in memory (will be cleared on logout, but encrypted material stays in IndexedDB)
      setEncryptionKey(key);
      setUserSalt(saltBase64);
      setIsSetup(true);
      setIsUnlocked(true);
      hasCheckedSetupRef.current = true;
    } catch (error) {
      console.error('Failed to unlock encryption:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userSub, userSalt, getSalt, getAccessTokenSilently]);

  const lockEncryption = useCallback(() => {
    // Only clear in-memory key, NOT the encrypted key material in IndexedDB
    // This allows us to detect encryption is setup on next login
    setEncryptionKey(null);
    setIsUnlocked(false);
    // Reset the check flag so we can check again on next login
    hasCheckedSetupRef.current = false;
    // Don't clear userSalt - it helps with cross-device detection
    // setUserSalt(null);
  }, []);

  const encryptData = useCallback(async (
    data: Partial<Analysis>
  ): Promise<Partial<EncryptedAnalysis>> => {
    if (!encryptionKey) {
      throw new Error('Encryption not unlocked');
    }

    if (!data.userEmail || !data.inputContent || !data.mlResult) {
      throw new Error('Missing required fields for encryption');
    }

    const encrypted = await encryptAnalysisData(
      {
        userEmail: data.userEmail,
        inputContent: data.inputContent,
        analysisContext: data.analysisContext,
        mlResult: data.mlResult,
      },
      encryptionKey
    );

    return {
      ...data,
      ...encrypted,
    } as Partial<EncryptedAnalysis>;
  }, [encryptionKey]);

  const decryptData = useCallback(async (
    encrypted: EncryptedAnalysis
  ): Promise<Analysis> => {
    if (!encryptionKey) {
      throw new Error('Encryption not unlocked');
    }

    const decrypted = await decryptAnalysisData(
      {
        userEmail: encrypted.userEmail,
        inputContent: encrypted.inputContent,
        analysisContext: encrypted.analysisContext,
        mlResult: encrypted.mlResult,
      },
      encryptionKey
    );

    return {
      id: encrypted.id,
      userSub: encrypted.userSub,
      ...decrypted,
      inputType: encrypted.inputType,
      createdAt: encrypted.createdAt,
      updatedAt: encrypted.updatedAt,
    };
  }, [encryptionKey]);

  return (
    <EncryptionContext.Provider
      value={{
        isSetup,
        isUnlocked,
        isLoading,
        setupEncryption,
        unlockEncryption,
        lockEncryption,
        encryptData,
        decryptData,
        getSalt,
        saveSalt,
        getEncryptionStatus,
      }}
    >
      {children}
    </EncryptionContext.Provider>
  );
}

export function useEncryption() {
  const context = useContext(EncryptionContext);
  if (context === undefined) {
    throw new Error('useEncryption must be used within an EncryptionProvider');
  }
  return context;
}

