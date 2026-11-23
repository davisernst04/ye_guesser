export function FanNote({ className = "" }: { className?: string }) {
  return (
    <footer className={`py-4 text-center text-xs text-muted-foreground ${className}`}>
      Fan project. Not affiliated with Ye. Audio previews from Deezer.
    </footer>
  );
}
