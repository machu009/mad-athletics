-- 0015_event_type.sql

alter table events add column if not exists event_type text not null default 'other'
  check (event_type in ('practice', 'tournament', 'pickup', 'social', 'other'));

create index if not exists idx_events_type on events (event_type);
