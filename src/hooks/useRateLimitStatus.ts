import { useState, useEffect, useCallback, useRef } from 'react';

export interface RateLimitStatus {
  isLocked: boolean;
  remainingSeconds: number;
  attempts: number;
  lockedUntil: number | null;
}

export function useRateLimitStatus(
  userSub: string | null,
  getAccessTokenSilently?: () => Promise<string>
) {
  const [status, setStatus] = useState<RateLimitStatus>({
    isLocked: false,
    remainingSeconds: 0,
    attempts: 0,
    lockedUntil: null,
  });
  
  // Use ref to prevent excessive API calls
  const lastCheckTimeRef = useRef(0);
  const MIN_CHECK_INTERVAL = 1000; // Don't check more than once per second

  // Check backend for current status
  const checkStatus = useCallback(async () => {
    if (!userSub || !getAccessTokenSilently) return;

    // Throttle API calls
    const now = Date.now();
    if (now - lastCheckTimeRef.current < MIN_CHECK_INTERVAL) {
      return;
    }
    lastCheckTimeRef.current = now;

    // First check localStorage
    const stored = localStorage.getItem(`lockout_${userSub}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        const remaining = data.lockedUntil ? Math.max(0, data.lockedUntil - Date.now()) : 0;
        setStatus({
          isLocked: remaining > 0,
          remainingSeconds: Math.ceil(remaining / 1000),
          attempts: data.attempts || 0,
          lockedUntil: data.lockedUntil || null,
        });
        return; // Use localStorage data, don't call backend
      } catch (e) {
        // Invalid localStorage data, fall through to backend
        localStorage.removeItem(`lockout_${userSub}`);
      }
    }

    // No localStorage data, check backend
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/encryption/unlock-attempts`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const isLocked = data.lockedUntil && Date.now() < data.lockedUntil;
        const remainingSeconds = data.lockedUntil ? Math.ceil((data.lockedUntil - Date.now()) / 1000) : 0;
        
        setStatus({
          isLocked,
          remainingSeconds,
          attempts: data.attempts || 0,
          lockedUntil: data.lockedUntil || null,
        });

        // Also persist to localStorage
        if (isLocked || (data.attempts && data.attempts > 0)) {
          localStorage.setItem(
            `lockout_${userSub}`,
            JSON.stringify({
              lockedUntil: data.lockedUntil,
              attempts: data.attempts,
              timestamp: Date.now(),
            })
          );
          // Notify other components of the change
          window.dispatchEvent(new CustomEvent('rateLimitUpdate', { detail: { userSub } }));
        } else {
          localStorage.removeItem(`lockout_${userSub}`);
        }
      } else {
        // Backend returned error, use default
        setStatus({
          isLocked: false,
          remainingSeconds: 0,
          attempts: 0,
          lockedUntil: null,
        });
      }
    } catch (error) {
      // Backend failed, use default
      setStatus({
        isLocked: false,
        remainingSeconds: 0,
        attempts: 0,
        lockedUntil: null,
      });
    }
  }, [userSub, getAccessTokenSilently]);

  // Check on mount and when userSub or token function changes
  useEffect(() => {
    if (userSub) {
      checkStatus();
    }
  }, [userSub, getAccessTokenSilently]);

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('lockout_') && e.key.includes(userSub || '')) {
        checkStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [userSub]);

  return { status, checkStatus };
}
