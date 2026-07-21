-- V94 stores only cosmetic choices. Existing XP, Level and Streak systems remain unchanged.
create table if not exists public.user_duck_customization (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_skin text not null default 'default',
  selected_outfit text not null default 'stage-default',
  selected_glasses text not null default 'none',
  selected_accessory text not null default 'none',
  selected_background text not null default 'default',
  selected_effect text not null default 'none',
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.user_duck_customization enable row level security;
revoke all on public.user_duck_customization from anon;
grant select, insert, update, delete on public.user_duck_customization to authenticated;
drop policy if exists "duck customization select own" on public.user_duck_customization;
create policy "duck customization select own" on public.user_duck_customization for select to authenticated using (auth.uid() = user_id);
drop policy if exists "duck customization insert own" on public.user_duck_customization;
create policy "duck customization insert own" on public.user_duck_customization for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "duck customization update own" on public.user_duck_customization;
create policy "duck customization update own" on public.user_duck_customization for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "duck customization delete own" on public.user_duck_customization;
create policy "duck customization delete own" on public.user_duck_customization for delete to authenticated using (auth.uid() = user_id);