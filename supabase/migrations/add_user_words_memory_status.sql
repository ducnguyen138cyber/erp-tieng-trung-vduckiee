-- Applied to the vduckie-chinese Supabase project on 2026-11-02.
-- Existing user_words ownership RLS policies remain unchanged.
alter table public.user_words
  add column if not exists memory_status text not null default 'new';
alter table public.user_words
  drop constraint if exists user_words_memory_status_check;
alter table public.user_words
  add constraint user_words_memory_status_check
  check (memory_status in ('new', 'learning', 'review', 'known'));
