"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Account } from "@/lib/account";

type Props = {
  account: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Reload the account after a change. */
  onChange: () => Promise<void>;
  /** Page to come back to after login. */
  next: string;
  shareName: boolean;
  onShareNameChange: (value: boolean) => void;
};

function PrivacyNote() {
  return (
    <p className="text-xs text-muted-foreground">
      Privacy: we keep your Google or Discord user ID, your username and your daily results. Supabase, our login
      service, also keeps the email and name your provider sends. The game never uses them. Deleting your account
      removes all of it.
    </p>
  );
}

async function send(path: string, method: string, body?: unknown): Promise<string | null> {
  const res = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.ok) return null;
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? "Something went wrong. Try again.";
}

export function AccountDialog({ account, open, onOpenChange, onChange, next, shareName, onShareNameChange }: Props) {
  const user = account.user;
  const [username, setUsername] = useState(user?.username ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function run(action: () => Promise<string | null>) {
    setBusy(true);
    setError(null);
    try {
      const message = await action();
      if (message) setError(message);
      else await onChange();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        setError(null);
        setConfirmDelete(false);
        setUsername(user?.username ?? "");
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ACCOUNT</DialogTitle>
          <DialogDescription>
            {user ? "Your stats are saved to your account." : "Log in to keep your stats on every device."}
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="space-y-2">
            <Button asChild className="w-full">
              <a href={`/auth/login?provider=google&next=${next}`}>CONTINUE WITH GOOGLE</a>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <a href={`/auth/login?provider=discord&next=${next}`}>CONTINUE WITH DISCORD</a>
            </Button>
            <p className="text-xs text-muted-foreground">
              On your first login, your stats from this browser move into the new account. An account that already
              has stats keeps its own.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <form
              className="space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                void run(() => send("/api/account/username", "POST", { username }));
              }}
            >
              <label htmlFor="username" className="text-sm font-semibold">
                USERNAME (OPTIONAL)
              </label>
              <div className="flex gap-2">
                <Input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  maxLength={20}
                  placeholder="3-20 letters, numbers or _"
                  autoComplete="off"
                />
                <Button type="submit" disabled={busy || username.trim() === (user.username ?? "")}>
                  SAVE
                </Button>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={shareName}
                  disabled={!user.username}
                  onChange={(event) => onShareNameChange(event.target.checked)}
                />
                Add my username to the share text
              </label>
            </form>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                disabled={busy}
                onClick={() => run(() => send("/auth/logout", "POST"))}
              >
                LOG OUT
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={busy}
                onClick={() => (confirmDelete ? run(() => send("/api/account", "DELETE")) : setConfirmDelete(true))}
              >
                {confirmDelete ? "YES, DELETE ALL" : "DELETE ACCOUNT"}
              </Button>
            </div>
            {confirmDelete && (
              <p className="text-sm text-red-500">This deletes your username and all your stats. You can&apos;t undo it.</p>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        )}
        <PrivacyNote />
      </DialogContent>
    </Dialog>
  );
}
