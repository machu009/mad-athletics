-- 0013_events_sport_tag.sql
-- Events weren't sport-tagged before, which meant there was no way to
-- connect "people interested in golf" to "golf events near them" — the
-- two systems existed but had no link between them.

alter table events add column if not exists sport text;
create index if not exists idx_events_sport on events (sport);
