"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { LogOut, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Account, Profile } from "@/lib/account";
import { cn } from "@/lib/utils";

type Props = {
  account: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Reload the account after a change. */
  onChange: () => Promise<void>;
  /** Page to come back to after login. */
  next: string;
};

function PrivacyNote() {
  return (
    <p className="px-1 text-xs leading-relaxed text-label-3">
      Privacy: we keep your Google or Discord user ID and your daily results. Supabase, our login service, also
      keeps the name, email and picture your provider sends. The game shows them only to you. Deleting your account
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

/** The provider picture, else the first letter of the name or email, else a person icon. */
export function Avatar({ profile, className = "" }: { profile: Profile | null; className?: string }) {
  const [broken, setBroken] = useState(false);
  const initial = (profile?.name ?? profile?.email)?.[0];
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full bg-ye font-bold text-black uppercase",
        className,
      )}
    >
      {profile?.avatarUrl && !broken ? (
        <Image
          src={profile.avatarUrl}
          alt=""
          width={128}
          height={128}
          onError={() => setBroken(true)}
          className="size-full object-cover"
        />
      ) : (
        (initial ?? <UserRound className="size-[55%]" />)
      )}
    </span>
  );
}

const group = "overflow-hidden rounded-2xl bg-glass divide-y divide-white/[0.06]";
const row = "flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left text-[15px]";

function GoogleLogo({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

function DiscordLogo({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.61 1.25a18.27 18.27 0 0 0-5.49 0 12.64 12.64 0 0 0-.62-1.25.08.08 0 0 0-.08-.04 19.74 19.74 0 0 0-4.88 1.52.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .09-.03c.46-.63.87-1.3 1.22-1.99a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.89.08.08 0 0 1 0-.13l.37-.29a.07.07 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.06 0a.07.07 0 0 1 .08.01l.37.29a.08.08 0 0 1 0 .13c-.6.35-1.22.65-1.87.89a.08.08 0 0 0-.04.11c.36.7.77 1.36 1.22 1.99a.08.08 0 0 0 .09.03 19.84 19.84 0 0 0 6-3.03.08.08 0 0 0 .03-.06c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03ZM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.33-.96 2.42-2.16 2.42Zm7.97 0c-1.18 0-2.15-1.08-2.15-2.42 0-1.33.95-2.42 2.15-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.33-.95 2.42-2.16 2.42Z" />
    </svg>
  );
}

/** Google and Discord login. `compact` puts them side by side. */
export function LoginButtons({ next, compact = false }: { next: string; compact?: boolean }) {
  const size = compact ? "default" : "lg";
  return (
    <div className={compact ? "grid grid-cols-2 gap-2" : "space-y-2.5"}>
      <Button asChild size={size} className="w-full">
        <a href={`/auth/login?provider=google&next=${next}`}>
          <GoogleLogo /> {compact ? "Google" : "Continue with Google"}
        </a>
      </Button>
      <Button asChild size={size} className="w-full bg-[#5865F2] text-white hover:bg-[#5865F2]/90">
        <a href={`/auth/login?provider=discord&next=${next}`}>
          <DiscordLogo /> {compact ? "Discord" : "Continue with Discord"}
        </a>
      </Button>
    </div>
  );
}

export function AccountDialog({ account, open, onOpenChange, onChange, next }: Props) {
  const user = account.user;
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
      }}
    >
      <DialogContent className="sm:max-w-sm">
        {!user ? (
          <>
            <div className="flex flex-col items-center pt-2 text-center">
              <Avatar profile={null} className="size-20 bg-glass-strong text-label-2" />
              <DialogHeader className="mt-4 items-center pr-0 text-center">
                <DialogTitle>Keep your streak</DialogTitle>
                <DialogDescription className="max-w-64">
                  Log in to save your stats and play on any device.
                </DialogDescription>
              </DialogHeader>
            </div>
            <LoginButtons next={next} />
            <p className="px-1 text-center text-xs leading-relaxed text-label-2">
              On your first login, your stats from this browser move into the new account. An account that already has
              stats keeps its own.
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4 pt-2">
              <Avatar profile={user} className="size-16 text-3xl" />
              <DialogHeader className="min-w-0 pr-8">
                <DialogTitle className="truncate">{user.name ?? user.email ?? "Your account"}</DialogTitle>
                <DialogDescription className="truncate">
                  {user.handle ? `@${user.handle}` : "Stats saved to your account"}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className={group}>
              {user.email && (
                <div className={row}>
                  <span className="shrink-0">Email</span>
                  <span className="min-w-0 flex-1 truncate text-right text-label-2">{user.email}</span>
                </div>
              )}
              {user.provider && (
                <div className={row}>
                  <span className="flex-1">Signed in with</span>
                  <span className="flex items-center gap-2 text-label-2">
                    {user.provider === "google" ? (
                      <>
                        <GoogleLogo className="size-4" /> Google
                      </>
                    ) : (
                      <>
                        <DiscordLogo className="size-4 text-[#5865F2]" /> Discord
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className={group}>
              <button
                type="button"
                className={`${row} transition-colors hover:bg-glass active:bg-glass-strong disabled:opacity-40`}
                disabled={busy}
                onClick={() => run(() => send("/auth/logout", "POST"))}
              >
                <LogOut className="size-[18px] text-label-2" /> Log out
              </button>
              <button
                type="button"
                className={`${row} text-miss transition-colors hover:bg-glass active:bg-glass-strong disabled:opacity-40`}
                disabled={busy}
                onClick={() => (confirmDelete ? run(() => send("/api/account", "DELETE")) : setConfirmDelete(true))}
              >
                <Trash2 className="size-[18px]" /> {confirmDelete ? "Yes, delete everything" : "Delete account"}
              </button>
            </div>
            <AnimatePresence initial={false}>
              {confirmDelete && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="-mt-3 overflow-hidden px-4 text-sm text-miss"
                >
                  This deletes your account and all your stats. You can&apos;t undo it.
                </motion.p>
              )}
            </AnimatePresence>
          </>
        )}

        {error && (
          <p role="alert" className="px-1 text-sm text-miss">
            {error}
          </p>
        )}
        <PrivacyNote />
      </DialogContent>
    </Dialog>
  );
}
