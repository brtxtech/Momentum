-- Apply after 001_social.sql in a disposable staging Supabase project first.
-- Changes existing access behavior; review and test before production deployment.
create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  theme text not null default 'system' check (theme in ('system','light','dark')),
  reduced_motion boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.user_preferences enable row level security;
create policy preferences_read on public.user_preferences for select to authenticated using (user_id=(select auth.uid()));
create policy preferences_insert on public.user_preferences for insert to authenticated with check (user_id=(select auth.uid()));
create policy preferences_update on public.user_preferences for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

-- A follow request does not grant private-profile visibility until approved.
alter table public.follows add column if not exists status text not null default 'pending' check (status in ('pending','approved'));
update public.follows f set status='approved' where exists(select 1 from public.profiles p where p.id=f.following_id and p.is_private=false);
create or replace function public.can_view_post(p uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.posts x join public.profiles a on a.id=x.user_id
 where x.id=p and (x.user_id=(select auth.uid())
 or (x.event_id is not null and public.can_view_event(x.event_id))
 or (x.event_id is null and (not a.is_private or exists(select 1 from public.follows f
 where f.follower_id=(select auth.uid()) and f.following_id=a.id and f.status='approved')))))
$$;
drop policy if exists stories_read on public.stories;
create policy stories_read on public.stories for select to authenticated using (
 expires_at>now() and (user_id=(select auth.uid()) or exists(select 1 from public.profiles p where p.id=user_id and not p.is_private)
 or exists(select 1 from public.follows f where f.following_id=user_id and f.follower_id=(select auth.uid()) and f.status='approved'))
);
drop policy if exists follows_insert on public.follows;
create policy follows_insert on public.follows for insert to authenticated with check (
 follower_id=(select auth.uid()) and status='pending'
);
-- Owners may approve followers; requesters may cancel. No arbitrary status edits.
create policy follows_approve on public.follows for update to authenticated
 using (following_id=(select auth.uid())) with check (following_id=(select auth.uid()) and status='approved');
-- Prevent users from editing event roles and member identity during RSVP.
drop policy if exists members_update on public.event_members;
create policy members_update_owner on public.event_members for update to authenticated
 using (exists(select 1 from public.events e where e.id=event_id and e.owner_id=(select auth.uid())))
 with check (exists(select 1 from public.events e where e.id=event_id and e.owner_id=(select auth.uid())));
-- Restrict updates to member status through a narrow RPC instead of direct member update.
create or replace function public.accept_event_invite(p_event_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 update public.event_members set status='accepted' where event_id=p_event_id and user_id=(select auth.uid()) and status='invited';
 if not found then raise exception 'No pending invitation'; end if;
end$$;
revoke all on function public.accept_event_invite(uuid) from public;
grant execute on function public.accept_event_invite(uuid) to authenticated;
-- Restrict notification updates to read flag only, avoiding forged content.
revoke update on public.notifications from authenticated;
grant update(read) on public.notifications to authenticated;
-- Remove unsafe broad social-storage story check and use the same visibility as story RLS.
drop policy if exists social_storage_read on storage.objects;
create policy social_storage_read on storage.objects for select to authenticated using (
 bucket_id='social-media' and (
 exists(select 1 from public.posts p where p.media_path=name and public.can_view_post(p.id))
 or exists(select 1 from public.stories s where s.media_path=name and s.expires_at>now() and (
 s.user_id=(select auth.uid()) or exists(select 1 from public.profiles p where p.id=s.user_id and not p.is_private)
 or exists(select 1 from public.follows f where f.following_id=s.user_id and f.follower_id=(select auth.uid()) and f.status='approved')))
 or exists(select 1 from public.profiles p where p.avatar_path=name and (p.id=(select auth.uid()) or not p.is_private))
 ));
create index if not exists follows_status_idx on public.follows(following_id,status);
