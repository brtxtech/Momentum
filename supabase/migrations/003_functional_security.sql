-- Functional security additions. REVIEW/APPLY TO STAGING, NOT AUTOMATICALLY TO PRODUCTION.
-- Notifications are inserted by triggers, not by clients.
create or replace function public.notify_post_interaction() returns trigger
language plpgsql security definer set search_path='' as $$
declare recipient uuid;
begin
  select user_id into recipient from public.posts where id=new.post_id;
  if recipient is not null and recipient<>new.user_id then
    insert into public.notifications(user_id,actor_id,kind,body)
    values (recipient,new.user_id,case when tg_table_name='post_likes' then 'like' else 'comment' end,
    case when tg_table_name='post_likes' then 'Someone liked your post' else 'Someone commented on your post' end);
  end if;
  return new;
end $$;
drop trigger if exists notify_like on public.post_likes;
create trigger notify_like after insert on public.post_likes
for each row execute function public.notify_post_interaction();
drop trigger if exists notify_comment on public.post_comments;
create trigger notify_comment after insert on public.post_comments
for each row execute function public.notify_post_interaction();

create or replace function public.notify_follow_request() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  insert into public.notifications(user_id,actor_id,kind,body)
  values(new.following_id,new.follower_id,'follow','You have a new follow request');
  return new;
end $$;
drop trigger if exists notify_follow on public.follows;
create trigger notify_follow after insert on public.follows
for each row execute function public.notify_follow_request();

-- Conversation creation must be atomic; direct multi-table creation can leave orphan conversations.
create or replace function public.start_conversation(other_user uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor uuid := (select auth.uid()); chat_id uuid;
begin
 if actor is null or other_user is null or actor=other_user then raise exception 'Invalid participants'; end if;
 if not exists(select 1 from public.profiles where id=other_user) then raise exception 'Recipient not found'; end if;
 insert into public.conversations(created_by) values(actor) returning id into chat_id;
 insert into public.conversation_members(conversation_id,user_id) values(chat_id,actor),(chat_id,other_user);
 return chat_id;
end $$;
revoke all on function public.start_conversation(uuid) from public;
grant execute on function public.start_conversation(uuid) to authenticated;

-- All changes to follow approvals must be performed by the target owner.
-- Guard immutable actor and target on updates to prevent identity tampering.
create or replace function public.prevent_follow_identity_change() returns trigger
language plpgsql set search_path='' as $$
begin
 if (new.follower_id,new.following_id) is distinct from (old.follower_id,old.following_id)
 then raise exception 'Follow identities cannot be changed'; end if;
 return new;
end $$;
drop trigger if exists guard_follow_identity on public.follows;
create trigger guard_follow_identity before update on public.follows
for each row execute function public.prevent_follow_identity_change();

create or replace function public.prevent_event_member_privilege_change() returns trigger
language plpgsql set search_path='' as $$
begin
 if new.event_id<>old.event_id or new.user_id<>old.user_id then
   raise exception 'Membership identity is immutable';
 end if;
 return new;
end $$;
drop trigger if exists guard_event_member_identity on public.event_members;
create trigger guard_event_member_identity before update on public.event_members
for each row execute function public.prevent_event_member_privilege_change();

-- Prevent frontend from forging notifications: only database triggers may insert them.
revoke insert,delete on public.notifications from authenticated;
-- Profile owners may not alter another person's profile identity or IDs.
-- Read access to profiles is broad by design: do not place secret personal data there.
-- Operational prerequisite: enable Realtime for messages using Dashboard publication settings.
