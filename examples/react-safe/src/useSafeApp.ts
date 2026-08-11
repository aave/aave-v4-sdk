import SafeAppsSDK, { type SafeInfoExtended } from '@safe-global/safe-apps-sdk';
import { useEffect, useMemo, useState } from 'react';

export type SafeAppState = {
  sdk: SafeAppsSDK;
  safe: SafeInfoExtended | null;
  connected: boolean;
  loading: boolean;
};

const SAFE_INFO_TIMEOUT_MS = 5000;

function isInIframe(): boolean {
  try {
    if (typeof globalThis === 'undefined') return false;

    return globalThis.self !== globalThis.top;
  } catch {
    return true;
  }
}

export function useSafeApp(): SafeAppState {
  const sdk = useMemo(() => new SafeAppsSDK(), []);
  const [safe, setSafe] = useState<SafeInfoExtended | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!isInIframe()) {
      setLoading(false);
      setSafe(null);
      setConnected(false);
      return;
    }

    Promise.race([
      sdk.safe.getInfo(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), SAFE_INFO_TIMEOUT_MS),
      ),
    ])
      .then((info) => {
        if (cancelled) return;

        setSafe(info as SafeInfoExtended);
        setConnected(true);
      })
      .catch(() => {
        if (cancelled) return;

        setSafe(null);
        setConnected(false);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sdk]);

  return { sdk, safe, connected, loading };
}
