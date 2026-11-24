-- Each player's favourite albums (up to 4, by title), shown on their account card.
-- Like results, only the server (secret key) reads or writes it, and deleting the
-- auth user deletes it.

create table public.favorites (
  user_id uuid primary key references auth.users (id) on delete cascade,
  albums text[] not null check (cardinality(albums) <= 4)
);

alter table public.favorites enable row level security;

revoke all on public.favorites from anon, authenticated;
