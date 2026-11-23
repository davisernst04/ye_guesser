-- Ye Guesser accounts: an optional username and daily results per user.
-- Only the server (secret key) reads or writes these tables. RLS is on with no
-- policies, and the API roles have no grants, so players cannot touch them.
-- Deleting the auth user deletes everything here.

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text check (username ~ '^[A-Za-z0-9_]{3,20}$')
);

create unique index profiles_username_key on public.profiles (lower(username));

create table public.results (
  user_id uuid not null references auth.users (id) on delete cascade,
  puzzle integer not null check (puzzle >= 1),
  -- Guesses used to win (1-6), or 0 for a loss.
  guesses smallint not null check (guesses between 0 and 6),
  primary key (user_id, puzzle)
);

alter table public.profiles enable row level security;
alter table public.results enable row level security;

revoke all on public.profiles, public.results from anon, authenticated;
