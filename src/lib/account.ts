// The player's optional account, as the browser sees it.
import { useCallback, useEffect, useState } from "react";
import { clearGuestResults, guestProofs, type Results } from "@/lib/stats";

export type Account = {
  /** False when the server has no Supabase setup: guest play only. */
  enabled: boolean;
  user: { username: string | null; results: Results } | null;
};

async function fetchAccount(): Promise<Account> {
  const res = await fetch("/api/account", { cache: "no-store" });
  if (!res.ok) throw new Error("Couldn't load account");
  return (await res.json()) as Account;
}

/** Loads the account. On login, moves guest results into it, then drops them from the browser. */
export function useAccount() {
  const [account, setAccount] = useState<Account | null>(null);

  const refresh = useCallback(async () => {
    try {
      let next = await fetchAccount();
      if (next.user) {
        const proofs = guestProofs();
        if (proofs.length) {
          const res = await fetch("/api/account/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tokens: proofs }),
          });
          if (!res.ok) throw new Error("Couldn't move guest results");
          next = await fetchAccount();
        }
        clearGuestResults();
      }
      setAccount(next);
    } catch {
      // Treat as a guest. The game still works without an account.
      setAccount(null);
    }
  }, []);

  useEffect(() => {
    // Loading external data on mount is what this effect is for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  return { account, refresh };
}
