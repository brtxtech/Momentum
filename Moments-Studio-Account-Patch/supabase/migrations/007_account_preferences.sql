-- Apply after migrations 001–006 to a STAGING Supabase database and verify RLS with two user accounts.
-- These fields persist preferences; external email/push delivery is NOT implemented by this migration.
alter table public.user_preferences
  add column if not exists language text not null default 'en',
  add column if not exists email_notifications boolean not null default true,
  add column if not exists message_notifications boolean not null default true;
-- Make these constraints idempotent on previously migrated databases.
do $$begin
 if not exists (select 1 from pg_constraint where conname='user_preferences_language_allowed') then
  alter table public.user_preferences add constraint user_preferences_language_allowed check(language in ('en','es','fr'));
 end if;
end$$;
-- Profile fields remain public metadata. Never add secrets to the profiles table.
-- RLS user_preferences read/update/insert policies from 002 remain in force.
-- The actor can upsert only the row with their auth.uid().
create index if not exists saved_posts_user_recent_idx on public.saved_posts(user_id,created_at desc);
create index if not exists posts_owner_recent_idx on public.posts(user_id,created_at desc,id desc);
create index if not exists support_tickets_user_recent_idx on public.support_tickets(user_id,created_at desc);
