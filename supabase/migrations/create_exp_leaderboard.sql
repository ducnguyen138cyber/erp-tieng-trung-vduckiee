-- VDuckie EXP + leaderboard v89.0
-- Run once in Supabase SQL Editor using a project owner/admin account.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 120),
  avatar_url text check (avatar_url is null or avatar_url ~ '^https://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_code text not null check (activity_code in ('lesson_complete','quiz_pass','dictation_complete','daily_goal','lesson_review')),
  source_id text not null check (char_length(source_id) between 1 and 160),
  exp_amount integer not null check (exp_amount > 0 and exp_amount <= 20),
  dedupe_key text not null check (char_length(dedupe_key) between 1 and 240),
  created_at timestamptz not null default now(),
  constraint exp_transactions_user_dedupe_unique unique (user_id, dedupe_key)
);

create index if not exists exp_transactions_user_created_idx on public.exp_transactions(user_id, created_at desc);
create index if not exists exp_transactions_created_user_idx on public.exp_transactions(created_at desc, user_id);
create index if not exists exp_transactions_activity_created_idx on public.exp_transactions(activity_code, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create or replace function public.profile_values_from_metadata(p_user_id uuid)
returns table(display_name text, avatar_url text)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select
    left(coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'), ''), nullif(trim(u.raw_user_meta_data->>'name'), ''), 'Người học'), 120),
    nullif(trim(coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', '')), '')
  from auth.users u
  where u.id = p_user_id;
$$;

create or replace function public.sync_my_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_name text;
  v_avatar text;
  v_row public.profiles;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select p.display_name, p.avatar_url into v_name, v_avatar
  from public.profile_values_from_metadata(v_uid) p;

  insert into public.profiles(user_id, display_name, avatar_url)
  values (v_uid, coalesce(v_name, 'Người học'), v_avatar)
  on conflict (user_id) do update
  set display_name = excluded.display_name,
      avatar_url = excluded.avatar_url,
      updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.handle_new_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  insert into public.profiles(user_id, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), nullif(trim(new.raw_user_meta_data->>'name'), ''), 'Người học'), 120),
    nullif(trim(coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')), '')
  )
  on conflict (user_id) do update
  set display_name = excluded.display_name,
      avatar_url = excluded.avatar_url,
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_sync_profile on auth.users;
create trigger on_auth_user_created_sync_profile
after insert or update of raw_user_meta_data on auth.users
for each row execute function public.handle_new_auth_user_profile();

create or replace function public.exp_period_start(p_period text)
returns timestamptz
language plpgsql
stable
set search_path = public, pg_temp
as $$
begin
  case lower(coalesce(p_period, 'week'))
    when 'week' then
      return date_trunc('week', now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh';
    when 'month' then
      return date_trunc('month', now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh';
    when 'total' then
      return null;
    else
      raise exception 'invalid leaderboard period';
  end case;
end;
$$;

create or replace function public.award_exp(p_activity_code text, p_source_id text)
returns table(awarded boolean, exp_awarded integer, total_exp bigint, reason text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := lower(trim(coalesce(p_activity_code, '')));
  v_source text := trim(coalesce(p_source_id, ''));
  v_amount integer;
  v_daily_cap integer;
  v_dedupe text;
  v_local_date date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_day_start timestamptz := ((now() at time zone 'Asia/Ho_Chi_Minh')::date::timestamp at time zone 'Asia/Ho_Chi_Minh');
  v_day_end timestamptz;
  v_today_exp integer;
  v_inserted integer;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if v_source !~ '^[A-Za-z0-9:_./-]{1,160}$' then
    raise exception 'invalid source id';
  end if;

  case v_code
    when 'lesson_complete' then v_amount := 20; v_daily_cap := 100; v_dedupe := v_code || ':' || v_source;
    when 'quiz_pass' then v_amount := 15; v_daily_cap := 75; v_dedupe := v_code || ':' || v_source;
    when 'dictation_complete' then v_amount := 10; v_daily_cap := 50; v_dedupe := v_code || ':' || v_source;
    when 'daily_goal' then v_amount := 10; v_daily_cap := 10; v_dedupe := v_code || ':' || v_local_date::text;
    when 'lesson_review' then v_amount := 2; v_daily_cap := 10; v_dedupe := v_code || ':' || v_source || ':' || v_local_date::text;
    else raise exception 'unsupported activity code';
  end case;

  if v_code in ('lesson_complete', 'lesson_review') and v_source !~ '^(hsk|erp):[A-Za-z0-9_-]+:lesson$' then
    raise exception 'invalid lesson source';
  elsif v_code = 'quiz_pass' and v_source !~ '^(hsk|erp):[A-Za-z0-9_-]+:quiz$' then
    raise exception 'invalid quiz source';
  elsif v_code = 'dictation_complete' and v_source !~ '^hsk:[A-Za-z0-9_-]+:dictation$' then
    raise exception 'invalid dictation source';
  elsif v_code = 'daily_goal' and v_source <> 'daily-words' then
    raise exception 'invalid daily goal source';
  end if;

  -- Serializes concurrent clicks for the same user/activity/source.
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text || ':' || v_code || ':' || v_source, 0));
  perform public.sync_my_profile();

  v_day_end := v_day_start + interval '1 day';
  select coalesce(sum(t.exp_amount), 0)::integer into v_today_exp
  from public.exp_transactions t
  where t.user_id = v_uid
    and t.activity_code = v_code
    and t.created_at >= v_day_start
    and t.created_at < v_day_end;

  if v_today_exp + v_amount > v_daily_cap then
    select coalesce(sum(t.exp_amount), 0) into total_exp from public.exp_transactions t where t.user_id = v_uid;
    awarded := false; exp_awarded := 0; reason := 'daily_cap';
    return next; return;
  end if;

  insert into public.exp_transactions(user_id, activity_code, source_id, exp_amount, dedupe_key)
  values (v_uid, v_code, v_source, v_amount, v_dedupe)
  on conflict (user_id, dedupe_key) do nothing;
  get diagnostics v_inserted = row_count;

  select coalesce(sum(t.exp_amount), 0) into total_exp from public.exp_transactions t where t.user_id = v_uid;
  if v_inserted = 1 then
    awarded := true; exp_awarded := v_amount; reason := 'awarded';
  else
    awarded := false; exp_awarded := 0; reason := 'duplicate';
  end if;
  return next;
end;
$$;

create or replace function public.get_my_exp()
returns bigint
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(sum(t.exp_amount), 0)::bigint
  from public.exp_transactions t
  where t.user_id = auth.uid();
$$;

create or replace function public.get_leaderboard(p_period text default 'week', p_limit integer default 100)
returns table(rank bigint, display_name text, avatar_url text, exp bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with bounds as (
    select public.exp_period_start(p_period) as starts_at
  ), totals as (
    select t.user_id,
           sum(t.exp_amount)::bigint as exp,
           max(t.created_at) as achieved_at
    from public.exp_transactions t
    cross join bounds b
    where b.starts_at is null or t.created_at >= b.starts_at
    group by t.user_id
  ), ranked as (
    select row_number() over (order by totals.exp desc, totals.achieved_at asc, totals.user_id asc)::bigint as rank,
           totals.user_id,
           totals.exp
    from totals
  )
  select r.rank, p.display_name, p.avatar_url, r.exp
  from ranked r
  join public.profiles p on p.user_id = r.user_id
  order by r.rank
  limit least(greatest(coalesce(p_limit, 100), 1), 100);
$$;

create or replace function public.get_my_rank(p_period text default 'week')
returns table(rank bigint, exp bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with bounds as (
    select public.exp_period_start(p_period) as starts_at
  ), totals as (
    select t.user_id,
           sum(t.exp_amount)::bigint as exp,
           max(t.created_at) as achieved_at
    from public.exp_transactions t
    cross join bounds b
    where b.starts_at is null or t.created_at >= b.starts_at
    group by t.user_id
  ), ranked as (
    select row_number() over (order by totals.exp desc, totals.achieved_at asc, totals.user_id asc)::bigint as rank,
           totals.user_id,
           totals.exp
    from totals
  )
  select r.rank, r.exp
  from ranked r
  where r.user_id = auth.uid();
$$;

alter table public.profiles enable row level security;
alter table public.exp_transactions enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.exp_transactions from anon, authenticated;
grant select, insert, update on table public.profiles to authenticated;
grant select on table public.exp_transactions to authenticated;

-- Users may only see and edit their own profile row directly.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (user_id = auth.uid());
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert to authenticated with check (user_id = auth.uid());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Transactions are readable only by their owner. There is intentionally no direct insert/update/delete policy.
drop policy if exists exp_transactions_select_own on public.exp_transactions;
create policy exp_transactions_select_own on public.exp_transactions for select to authenticated using (user_id = auth.uid());

revoke all on function public.touch_updated_at() from public;
revoke all on function public.profile_values_from_metadata(uuid) from public;
revoke all on function public.handle_new_auth_user_profile() from public;
revoke all on function public.exp_period_start(text) from public;
revoke all on function public.sync_my_profile() from public;
revoke all on function public.award_exp(text, text) from public;
revoke all on function public.get_my_exp() from public;
revoke all on function public.get_leaderboard(text, integer) from public;
revoke all on function public.get_my_rank(text) from public;

grant execute on function public.sync_my_profile() to authenticated;
grant execute on function public.award_exp(text, text) to authenticated;
grant execute on function public.get_my_exp() to authenticated;
grant execute on function public.get_leaderboard(text, integer) to anon, authenticated;
grant execute on function public.get_my_rank(text) to authenticated;

comment on function public.award_exp(text, text) is 'Awards fixed server-side EXP, applies dedupe and Asia/Ho_Chi_Minh daily caps. The browser never supplies exp_amount.';
