-- The songs picked in each finished daily game (null = skipped), in order.
-- Lets another device show the game as it ended. Older rows have none.
alter table public.results add column picks integer[];
