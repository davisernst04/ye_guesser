"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Track } from "@/lib/getData";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type TrackOption = {
  id: number;
  title: string;
  preview: string;
  md5_image: string;
  label: string;
  value: string;
};

type Props = {
  onGuess: (guess: string) => void;
};

export function ComboboxDemo({ onGuess }: Props) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [input, setInput] = React.useState("");
  const [tracks, setTracks] = React.useState<TrackOption[]>([]);

  React.useEffect(() => {
    fetch("/api/random-track")
      .then((res) => res.json())
      .then((data: Track[]) => {
        const mapped = data.map((track) => ({
          id: track.id,
          title: track.title,
          preview: track.preview,
          md5_image: track.md5_image,
          label: track.title,
          value: track.title.toLowerCase(),
        }));
        setTracks(mapped);
      })
      .catch((err) => console.error("Failed to fetch tracks:", err));
  }, []);

  const filteredTracks = input
    ? tracks.filter((t) => t.title.toLowerCase().includes(input.toLowerCase()))
    : tracks;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value || "Select a track"}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput
            placeholder="Search for a track"
            value={input}
            onValueChange={setInput}
          />
          <CommandList>
            <CommandEmpty>No track found.</CommandEmpty>
            <CommandGroup>
              {filteredTracks.map((track) => (
                <CommandItem
                  key={track.id}
                  value={track.value}
                  onSelect={() => {
                    setValue(track.title);
                    setOpen(false);
                    onGuess(track.title); // Pass back the actual title
                  }}
                >
                  {track.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === track.title ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
