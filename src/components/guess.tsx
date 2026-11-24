"use client";

import { useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SONGS, coverUrl } from "@/lib/game";
import { songScore } from "@/lib/search";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type Props = {
  onGuess: (songId: number) => void;
  /** Songs already guessed; they are hidden from the list. */
  exclude: readonly (number | null)[];
  disabled?: boolean;
  className?: string;
};

/** A search field that opens a full song search sheet. */
export function SongPicker({ onGuess, exclude, disabled = false, className }: Props) {
  const [open, setOpen] = useState(false);
  const options = SONGS.filter((song) => !exclude.includes(song.id));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        aria-haspopup="dialog"
        className={cn(
          "flex h-12 w-full items-center gap-3 rounded-full border border-glass-edge bg-glass px-4 text-left text-label-2 backdrop-blur-xl transition-[transform,background-color] duration-200 ease-spring outline-none hover:bg-glass-strong focus-visible:ring-[3px] focus-visible:ring-ye/60 active:scale-[0.98] disabled:opacity-40",
          className,
        )}
      >
        <Search className="size-[18px] shrink-0" />
        <span className="truncate">Guess the song</span>
      </button>

      <Dialog open={open && !disabled} onOpenChange={setOpen}>
        <DialogContent className="flex h-[88dvh] flex-col gap-3 px-3 sm:h-[70dvh] sm:px-3">
          <DialogTitle className="px-2 pr-12">Guess the song</DialogTitle>
          <DialogDescription className="sr-only">Search by song title or album.</DialogDescription>
          <Command
            className="min-h-0 flex-1 bg-transparent"
            filter={(_value, search, keywords = []) => songScore(search, keywords[0] ?? "", keywords[1] ?? "")}
          >
            <CommandInput
              placeholder="Song or album"
              wrapperClassName="mx-1 h-11 rounded-xl border-none bg-glass-strong"
              className="text-base"
            />
            <CommandList className="mt-2 max-h-none flex-1 overscroll-contain">
              <CommandEmpty className="py-10 text-center text-sm text-label-2">No song by that name.</CommandEmpty>
              {options.map((song) => (
                <CommandItem
                  key={song.id}
                  value={String(song.id)}
                  keywords={[song.title, song.album]}
                  onSelect={() => {
                    setOpen(false);
                    onGuess(song.id);
                  }}
                  className="gap-3 rounded-xl px-2 py-2 data-[selected=true]:bg-glass-strong"
                >
                  <Image
                    src={coverUrl(song.cover, 120)}
                    alt=""
                    width={44}
                    height={44}
                    unoptimized
                    className="size-11 shrink-0 rounded-md bg-glass object-cover"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-[15px]">{song.title}</div>
                    <div className="truncate text-xs text-label-2">{song.album}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
