-- VDuckiee personal learning data for Supabase.
-- Run this entire file once in Supabase Dashboard > SQL Editor.

create table if not exists public.user_words (
  user_id uuid not null references auth.users (id) on delete cascade,
  word_key text not null,
  hanzi text not null default '',
  pinyin text not null default '',
  near_vi text not null default '',
  meaning_vi text not null default '',
  category text not null default '',
  note text not null default '',
  example_zh text not null default '',
  example_vi text not null default '',
  is_known boolean not null default false,
  is_saved boolean not null default false,
  known_updated_at timestamptz,
  saved_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, word_key),
  constraint user_words_word_key_not_blank check (length(trim(word_key)) > 0)
);

comment on table public.user_words is
  'Per-user learned and saved Chinese words. False rows are retained as sync tombstones.';

create or replace function public.set_user_words_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_words_updated_at on public.user_words;
create trigger set_user_words_updated_at
before update on public.user_words
for each row execute function public.set_user_words_updated_at();

alter table public.user_words enable row level security;

revoke all on table public.user_words from anon;
grant select, insert, update, delete on table public.user_words to authenticated;

drop policy if exists "Users can read their own words" on public.user_words;
create policy "Users can read their own words"
on public.user_words
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own words" on public.user_words;
create policy "Users can insert their own words"
on public.user_words
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own words" on public.user_words;
create policy "Users can update their own words"
on public.user_words
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own words" on public.user_words;
create policy "Users can delete their own words"
on public.user_words
for delete
to authenticated
using ((select auth.uid()) = user_id);
