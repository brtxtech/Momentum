-- OPTIONAL STARTER SCHEMA. REVIEW BEFORE EXECUTION.
-- Assumes a new Supabase project. Do not run blindly on an existing schema.
create extension if not exists pgcrypto;
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(title) between 1 and 120),
  created_at timestamptz not null default now()
);
create table if not exists public.event_members (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'guest' check (role in ('guest','editor','owner')),
  primary key(event_id,user_id)
);
create table if not exists public.event_media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  uploader_id uuid not null default auth.uid() references auth.users(id),
  storage_path text not null unique,
  caption text not null default '' check (length(caption)<=500),
  created_at timestamptz not null default now(),
  check (storage_path like event_id::text || '/%')
);
create index if not exists idx_members_user on public.event_members(user_id);
create index if not exists idx_media_event on public.event_media(event_id,created_at desc);
-- SECURITY DEFINER avoids RLS policy recursion in membership checks.
create or replace function public.is_event_member(eid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.event_members m where m.event_id=eid and m.user_id=(select auth.uid()))
 or exists(select 1 from public.events e where e.id=eid and e.owner_id=(select auth.uid()));
$$;
revoke all on function public.is_event_member(uuid) from public;
grant execute on function public.is_event_member(uuid) to authenticated;
alter table public.events enable row level security;
alter table public.event_members enable row level security;
alter table public.event_media enable row level security;
create policy "events select member" on public.events for select to authenticated using (public.is_event_member(id));
create policy "events create own" on public.events for insert to authenticated with check (owner_id=(select auth.uid()));
create policy "events owner update" on public.events for update to authenticated using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
create policy "members read event" on public.event_members for select to authenticated using (public.is_event_member(event_id));
create policy "members owner add" on public.event_members for insert to authenticated with check (exists(select 1 from public.events e where e.id=event_id and e.owner_id=(select auth.uid())) and role<>'owner');
create policy "members owner delete" on public.event_members for delete to authenticated using (exists(select 1 from public.events e where e.id=event_id and e.owner_id=(select auth.uid())));
create policy "media read member" on public.event_media for select to authenticated using (public.is_event_member(event_id));
create policy "media add member" on public.event_media for insert to authenticated with check (uploader_id=(select auth.uid()) and public.is_event_member(event_id));
create policy "media delete own" on public.event_media for delete to authenticated using (uploader_id=(select auth.uid()) or exists(select 1 from public.events e where e.id=event_id and e.owner_id=(select auth.uid())));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('event-private','event-private',false,10485760,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;
create policy "event objects select" on storage.objects for select to authenticated using (bucket_id='event-private' and public.is_event_member((split_part(name,'/',1))::uuid));
create policy "event objects insert" on storage.objects for insert to authenticated with check (bucket_id='event-private' and public.is_event_member((split_part(name,'/',1))::uuid));
-- Deletion deliberately omitted until DB/storage cleanup strategy is designed.
-- NOTE: Cast from path segment to UUID may raise an error for malformed paths.
-- NOTE: Policies need negative multi-user integration tests before production.
