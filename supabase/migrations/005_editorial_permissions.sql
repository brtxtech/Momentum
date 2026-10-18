-- Apply ONLY after 001–004, to a disposable Supabase staging project.
-- Conversation membership must only be created through reviewed SECURITY DEFINER RPCs.
-- 003 start_conversation inserts two members atomically, so ordinary clients do not
-- need INSERT access to the membership table.
drop policy if exists chat_members_insert on public.conversation_members;
revoke insert, update, delete on public.conversation_members from authenticated;

-- Users may edit their own posts/comments but cannot swap author IDs via updates.
create policy posts_update_own on public.posts for update to authenticated
 using (user_id = (select auth.uid()))
 with check (user_id = (select auth.uid()));
create policy comments_update_own on public.post_comments for update to authenticated
 using (user_id = (select auth.uid()) and public.can_view_post(post_id))
 with check (user_id = (select auth.uid()) and public.can_view_post(post_id));

-- Column grants prevent changing ownership, event visibility, or media path via UPDATE.
revoke update on public.posts from authenticated;
revoke update on public.post_comments from authenticated;
grant update(caption) on public.posts to authenticated;
grant update(body) on public.post_comments to authenticated;

-- Notifications may only be marked read by their owners; privilege already restricted
-- to the read column in 002_hardening.sql.

-- Important: do NOT apply unreviewed migrations against an existing database.
-- No elevated client keys. Verify the policies in two-account integration tests.
