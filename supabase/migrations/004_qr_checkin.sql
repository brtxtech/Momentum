-- QR authorization protocol for registered event guests. Deploy to staging first.
-- The QR contains a 256-bit random bearer token; only a SHA-256 hash is stored.
-- Redeeming also requires an authenticated, accepted member matching the token guest.
create table if not exists public.event_checkin_tokens (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.events(id) on delete cascade,
 guest_id uuid not null references public.profiles(id) on delete cascade,
 token_hash text not null unique check(length(token_hash) = 64),
 created_by uuid not null references public.profiles(id),
 expires_at timestamptz not null,
 redeemed_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists checkins_guest_event on public.event_checkin_tokens(guest_id,event_id);
create index if not exists checkins_expiry on public.event_checkin_tokens(expires_at);
alter table public.event_checkin_tokens enable row level security;
-- No client table policies: access exclusively through narrow security-definer functions.
revoke all on public.event_checkin_tokens from anon, authenticated;

create or replace function public.issue_event_checkin_token(
 p_event_id uuid, p_guest_id uuid, p_hash text, p_expires_at timestamptz
) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid := (select auth.uid()); v_id uuid;
begin
 if actor is null then raise exception 'Authentication required'; end if;
 if not exists(select 1 from public.events e where e.id=p_event_id and e.owner_id=actor)
 then raise exception 'Only the event owner may issue a QR'; end if;
 if not exists(select 1 from public.event_members m where m.event_id=p_event_id and m.user_id=p_guest_id)
 then raise exception 'Guest must be invited first'; end if;
 if p_hash is null or p_hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid token hash'; end if;
 if p_expires_at <= now() or p_expires_at > now() + interval '7 days'
 then raise exception 'Expiry must be within 7 days'; end if;
 insert into public.event_checkin_tokens(event_id,guest_id,token_hash,created_by,expires_at)
 values(p_event_id,p_guest_id,p_hash,actor,p_expires_at) returning id into v_id;
 return v_id;
end $$;

create or replace function public.redeem_event_checkin_token(p_token text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid := (select auth.uid()); v_hash text; v_event uuid;
begin
 if actor is null then raise exception 'Authentication required'; end if;
 if p_token is null or length(p_token) < 40 or length(p_token) > 200
 then raise exception 'Invalid QR token'; end if;
 v_hash := encode(extensions.digest(convert_to(p_token,'UTF8'),'sha256'),'hex');
 update public.event_checkin_tokens t set redeemed_at=now()
 where token_hash=v_hash and guest_id=actor and redeemed_at is null
   and expires_at>now()
   and exists(select 1 from public.event_members m where m.event_id=t.event_id
      and m.user_id=actor and m.status='accepted')
 returning event_id into v_event;
 if v_event is null then raise exception 'Token invalid, already redeemed, expired, or not authorized'; end if;
 return v_event;
end $$;

revoke all on function public.issue_event_checkin_token(uuid,uuid,text,timestamptz) from public;
revoke all on function public.redeem_event_checkin_token(text) from public;
grant execute on function public.issue_event_checkin_token(uuid,uuid,text,timestamptz) to authenticated;
grant execute on function public.redeem_event_checkin_token(text) to authenticated;

-- Additional RLS omission repaired: a sender may remove only their own message.
create policy messages_delete on public.messages for delete to authenticated
 using(sender_id=(select auth.uid()) and public.in_chat(conversation_id));
