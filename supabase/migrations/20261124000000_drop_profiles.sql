-- Usernames are gone. The account shows the Google or Discord profile from the
-- login token instead, so the profiles table is no longer used.
-- Run this only after the code that stops reading profiles is live.
drop table if exists public.profiles;
