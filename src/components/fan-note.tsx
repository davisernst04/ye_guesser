import { cn } from "@/lib/utils";

export function FanNote({ className }: { className?: string }) {
  return (
    <footer className={cn("py-4 text-center text-xs text-muted-foreground", className)}>
      Fan project. No affiliation with Ye or YEEZY. Album art © its respective owners. Audio previews from Deezer.
    </footer>
  );
}
