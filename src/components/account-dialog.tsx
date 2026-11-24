"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Check, Pencil, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Account, Profile } from "@/lib/account";
import { GAME_ALBUMS, MAX_FAVORITES } from "@/lib/covers";
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

function PrivacyNote({ className }: { className?: string }) {
  return (
    <p className={cn("px-1 text-xs leading-relaxed text-label-3", className)}>
      Privacy: we keep your Google or Discord user ID, your daily results and your favourite albums. Supabase, our login service, also
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

/** Google and Discord login, side by side. Phones show only the provider name. */
function LoginButtons({ next }: { next: string }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <Button asChild size="lg" className="w-full">
        <a href={`/auth/login?provider=google&next=${next}`}>
          <GoogleLogo />
          <span>
            <span className="max-sm:sr-only">Continue with </span>Google
          </span>
        </a>
      </Button>
      <Button asChild size="lg" className="w-full bg-[#5865F2] text-white hover:bg-[#5865F2]/90">
        <a href={`/auth/login?provider=discord&next=${next}`}>
          <DiscordLogo />
          <span>
            <span className="max-sm:sr-only">Continue with </span>Discord
          </span>
        </a>
      </Button>
    </div>
  );
}

// Twice round the albums the game uses, so the wall has no gaps.
const WALL = [...GAME_ALBUMS, ...GAME_ALBUMS];

/** Album covers tilted into a wall that fades into the sheet, like the home page. */
function AlbumWall() {
  return (
    <div
      aria-hidden
      className="relative -mx-5 -mt-9 h-[clamp(11rem,42dvh,24rem)] overflow-hidden [mask-image:linear-gradient(#000_25%,transparent_85%)] sm:-mx-6"
    >
      <div className="absolute -inset-x-16 -top-12 grid -rotate-12 grid-cols-6 gap-2">
        {WALL.map((cover, i) => (
          <Image
            key={i}
            src={cover.src}
            alt=""
            width={160}
            height={160}
            sizes="128px"
            className="aspect-square w-full rounded-lg object-cover"
          />
        ))}
      </div>
    </div>
  );
}

/** The avatar with the login provider's logo on its corner. */
function ProviderAvatar({ profile }: { profile: Profile }) {
  return (
    <span className="relative">
      <Avatar profile={profile} className="size-16 text-3xl ring-4 ring-neutral-900" />
      {profile.provider && (
        <span
          className={cn(
            "absolute -right-0.5 -bottom-0.5 grid size-6 place-items-center rounded-full ring-[3px] ring-neutral-900",
            profile.provider === "google" ? "bg-white" : "bg-[#5865F2] text-white",
          )}
        >
          {profile.provider === "google" ? <GoogleLogo className="size-3.5" /> : <DiscordLogo className="size-3.5" />}
          <span className="sr-only">Signed in with {profile.provider === "google" ? "Google" : "Discord"}</span>
        </span>
      )}
    </span>
  );
}

const FAN_ANGLES = [-21, -7, 7, 21];

/** The favourite albums fanned out like records, empty sleeves for the rest, the avatar in front. */
function FavoriteFan({ profile, favorites }: { profile: Profile; favorites: string[] }) {
  const covers = favorites.flatMap((title) => GAME_ALBUMS.filter((album) => album.alt === title));
  return (
    <div className="relative h-[164px]">
      <ul aria-label="Favourite albums">
        {FAN_ANGLES.map((angle, i) => {
          const cover = covers[i];
          return (
            <li
              key={i}
              aria-hidden={!cover}
              style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
              className="absolute top-3 left-1/2 w-[100px] origin-[50%_260%]"
            >
              {cover ? (
                <Image
                  src={cover.src}
                  alt={cover.alt}
                  width={200}
                  height={200}
                  sizes="100px"
                  className="aspect-square w-full rounded-md object-cover shadow-[0_14px_28px_-10px_rgb(0_0_0/0.9)]"
                />
              ) : (
                <span className="block aspect-square rounded-md border-2 border-dashed border-white/15 bg-neutral-800" />
              )}
            </li>
          );
        })}
      </ul>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
        <ProviderAvatar profile={profile} />
      </div>
    </div>
  );
}

/** A grid of every album. Tap to pick up to 4, in order. */
function FavoritePicker({
  initial,
  busy,
  onSave,
  onCancel,
}: {
  initial: string[];
  busy: boolean;
  onSave: (albums: string[]) => void;
  onCancel: () => void;
}) {
  const [picked, setPicked] = useState(initial);
  const full = picked.length >= MAX_FAVORITES;

  function toggle(title: string) {
    if (picked.includes(title)) setPicked(picked.filter((album) => album !== title));
    else if (!full) setPicked([...picked, title]);
  }

  return (
    <>
      <DialogHeader className="gap-2">
        <DialogTitle className="font-custom text-[2.75rem] leading-[0.95] font-normal tracking-normal text-ye">
          Your top 4
        </DialogTitle>
        <DialogDescription>
          <span className="text-ye">
            {picked.length} of {MAX_FAVORITES}
          </span>{" "}
          picked. {full ? "Tap a pick to remove it." : "Tap a cover to add or remove it."}
        </DialogDescription>
      </DialogHeader>
      <ul className="grid grid-cols-4 gap-2">
        {GAME_ALBUMS.map((album) => {
          const on = picked.includes(album.alt);
          return (
            <li key={album.alt}>
              <button
                type="button"
                aria-pressed={on}
                aria-disabled={full && !on}
                onClick={() => toggle(album.alt)}
                className={cn(
                  "relative block w-full rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ye/60",
                  full && !on && "opacity-35",
                )}
              >
                <Image
                  src={album.src}
                  alt={album.alt}
                  width={160}
                  height={160}
                  sizes="96px"
                  className="aspect-square w-full rounded-md object-cover"
                />
                {on && (
                  <>
                    <span className="absolute inset-0 rounded-md ring-[3px] ring-ye ring-inset" />
                    <span className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-ye text-black">
                      <Check className="size-3" strokeWidth={4} />
                    </span>
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="grid gap-2">
        <Button size="lg" className="w-full bg-ye text-black hover:bg-ye/90" disabled={busy} onClick={() => onSave(picked)}>
          Save favourites
        </Button>
        <Button variant="ghost" className="w-full text-label-2" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </>
  );
}

export function AccountDialog({ account, open, onOpenChange, onChange, next }: Props) {
  const user = account.user;
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [picking, setPicking] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  /** Runs a request and reloads the account. Returns true if it worked. */
  async function run(action: () => Promise<string | null>): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      const message = await action();
      if (message) setError(message);
      else await onChange();
      return !message;
    } catch {
      setError("Something went wrong. Try again.");
      return false;
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
        setPicking(false);
        setShowPrivacy(false);
      }}
    >
      <DialogContent className={user ? "sm:max-w-sm" : "gap-0 sm:max-w-[35rem]"}>
        {!user ? (
          <>
            <AlbumWall />
            {/* The title overlaps the bottom of the wall. */}
            <div className="relative -mt-24 space-y-6">
              <DialogHeader className="gap-3 pr-0">
                <DialogTitle className="font-custom text-[clamp(3.25rem,15vw,4.75rem)] leading-[0.95] font-normal tracking-normal text-ye">
                  Keep your streak
                </DialogTitle>
                <DialogDescription className="max-w-[28ch] text-base">
                  Log in to save your stats and play on any device.
                </DialogDescription>
              </DialogHeader>
              <LoginButtons next={next} />
              <div className="text-xs leading-relaxed text-label-3">
                <p>Stats from this browser move into a new account. An account that already has stats keeps its own.</p>
                <details className="mt-2">
                  <summary className="w-fit cursor-pointer list-none text-label-2 underline underline-offset-3 hover:text-foreground">
                    What we store
                  </summary>
                  <PrivacyNote className="mt-1.5 px-0" />
                </details>
              </div>
            </div>
          </>
        ) : picking ? (
          <FavoritePicker
            initial={user.favorites}
            busy={busy}
            onCancel={() => setPicking(false)}
            onSave={async (albums) => {
              if (await run(() => send("/api/account/favorites", "PUT", { albums }))) setPicking(false);
            }}
          />
        ) : (
          <>
            <FavoriteFan profile={user} favorites={user.favorites} />
            <DialogHeader className="items-center gap-2 pr-0 text-center">
              <DialogTitle className="max-w-full truncate font-custom text-[2.75rem] leading-[1.05] font-normal tracking-normal text-ye">
                {user.name ?? user.handle ?? user.email ?? "Your account"}
              </DialogTitle>
              <DialogDescription className="max-w-full truncate">
                {user.handle ? `@${user.handle}` : (user.email ?? "Stats saved to your account")}
              </DialogDescription>
              <Button variant="secondary" size="sm" className="mt-1 text-label-2" onClick={() => setPicking(true)}>
                <Pencil /> Edit favourites
              </Button>
            </DialogHeader>

            <Button
              variant="secondary"
              size="lg"
              className="w-full rounded-2xl"
              disabled={busy}
              onClick={() => run(() => send("/auth/logout", "POST"))}
            >
              Log out
            </Button>

            <div className="-mt-1 flex items-center justify-between px-1 text-sm">
              <button
                type="button"
                aria-expanded={showPrivacy}
                onClick={() => setShowPrivacy(!showPrivacy)}
                className="text-xs text-label-2 underline underline-offset-3 hover:text-foreground"
              >
                What we store
              </button>
              <button
                type="button"
                className="text-miss hover:underline disabled:opacity-40"
                disabled={busy}
                onClick={() => (confirmDelete ? run(() => send("/api/account", "DELETE")) : setConfirmDelete(true))}
              >
                {confirmDelete ? "Yes, delete everything" : "Delete account"}
              </button>
            </div>
            <AnimatePresence initial={false}>
              {confirmDelete && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="-mt-3 overflow-hidden px-1 text-right text-sm text-miss"
                >
                  This deletes your account, stats and favourites. You can&apos;t undo it.
                </motion.p>
              )}
            </AnimatePresence>
            {showPrivacy && <PrivacyNote className="-mt-2" />}
          </>
        )}
        {error && (
          <p role="alert" className="px-1 text-sm text-miss">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
