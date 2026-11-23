"use client";

import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SONGS } from "@/lib/game";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Props = {
  onGuess: (songId: number) => void;
  /** Songs already guessed; they are hidden from the list. */
  exclude: readonly (number | null)[];
  disabled?: boolean;
  className?: string;
};

export function SongPicker({ onGuess, exclude, disabled = false, className }: Props) {
  const [open, setOpen] = useState(false);
  const options = SONGS.filter((song) => !exclude.includes(song.id));

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <span className="truncate">Search for a song</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" style={{ width: "var(--radix-popover-trigger-width)" }}>
        <Command>
          <CommandInput placeholder="Song title" />
          <CommandList>
            <CommandEmpty>No song found.</CommandEmpty>
            <CommandGroup>
              {options.map((song) => (
                <CommandItem
                  key={song.id}
                  value={`${song.title} ${song.album} ${song.id}`}
                  onSelect={() => {
                    setOpen(false);
                    onGuess(song.id);
                  }}
                >
                  <div className="min-w-0">
                    <div className="truncate">{song.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{song.album}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
