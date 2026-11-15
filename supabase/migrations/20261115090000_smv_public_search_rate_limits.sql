create table if not exists public.smv_public_search_rate_limits (id bigint generated always as identity primary key, ip_hash text not null, created_at timestamptz not null default now());
create index if not exists smv_public_search_rate_limits_ip_created_idx on public.smv_public_search_rate_limits(ip_hash,created_at desc);
alter table public.smv_public_search_rate_limits enable row level security;
revoke all on public.smv_public_search_rate_limits from anon, authenticated;