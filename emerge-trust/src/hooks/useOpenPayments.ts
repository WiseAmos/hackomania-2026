import { useState, useCallback } from "react";
import type { GrantRequestPayload, GrantResponse } from "@/types";

interface UseOpenPaymentsReturn {
  isLoading: boolean;
  error: string | null;
  requestGrant: (payload: GrantRequestPayload) => Promise<GrantResponse | null>;
  finalizeTransfer: (uid: string, walletId: string, senderWallet: string) => Promise<boolean>;
}

export function useOpenPayments(): UseOpenPaymentsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestGrant = useCallback(
    async (payload: GrantRequestPayload): Promise<GrantResponse | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          uid: payload.uid,
          senderwalletid: payload.senderWalletId,
          walletid: payload.receiverWalletId,
          amount: payload.amount,
        });

        const res = await fetch(`/api/transaction?${params}`);

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message ?? `HTTP ${res.status}`);
        }

        return (await res.json()) as GrantResponse;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const finalizeTransfer = useCallback(
    async (uid: string, walletId: string, senderWallet: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ uid, walletid: walletId, senderwallet: senderWallet });
        const res = await fetch(`/api/transaction/finaltransfer?${params}`);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const body = await res.json();
        return body.statement === true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Transfer failed";
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { isLoading, error, requestGrant, finalizeTransfer };
}
