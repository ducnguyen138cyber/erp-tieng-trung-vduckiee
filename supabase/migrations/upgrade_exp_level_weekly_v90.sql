-- VDuckie EXP + Level + weekly missions v90.0
-- Run in Supabase SQL Editor as project owner/admin.
-- This migration is self-contained and safely upgrades the v89 EXP schema.

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
  activity_code text not null,
  source_id text not null check (char_length(source_id) between 1 and 160),
  exp_amount integer not null,
  dedupe_key text not null check (char_length(dedupe_key) between 1 and 240),
  created_at timestamptz not null default now(),
  constraint exp_transactions_user_dedupe_unique unique (user_id, dedupe_key)
);

alter table public.exp_transactions drop constraint if exists exp_transactions_activity_code_check;
alter table public.exp_transactions add constraint exp_transactions_activity_code_check check (activity_code in ('lesson_complete','quiz_pass','dictation_complete','daily_goal','lesson_review','weekly_mission'));
alter table public.exp_transactions drop constraint if exists exp_transactions_exp_amount_check;
alter table public.exp_transactions add constraint exp_transactions_exp_amount_check check (exp_amount > 0 and exp_amount <= 100);

create table if not exists public.learning_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_code text not null check (event_code in ('study_day','word_review','quiz_complete')),
  source_id text not null check (char_length(source_id) between 1 and 160),
  dedupe_key text not null check (char_length(dedupe_key) between 1 and 240),
  created_at timestamptz not null default now(),
  constraint learning_events_user_dedupe_unique unique (user_id, dedupe_key)
);

create index if not exists exp_transactions_user_created_idx on public.exp_transactions(user_id, created_at desc);
create index if not exists exp_transactions_created_user_idx on public.exp_transactions(created_at desc, user_id);
create index if not exists exp_transactions_activity_created_idx on public.exp_transactions(activity_code, created_at desc);
create index if not exists learning_events_user_created_idx on public.learning_events(user_id, created_at desc);
create index if not exists learning_events_code_created_idx on public.learning_events(event_code, created_at desc);

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_updated_at();

create or replace function public.profile_values_from_metadata(p_user_id uuid)
returns table(display_name text, avatar_url text)
language sql security definer set search_path = public, auth, pg_temp as $$
  select left(coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'), ''),nullif(trim(u.raw_user_meta_data->>'name'), ''),nullif(trim(u.raw_user_meta_data->>'display_name'), ''),'Người học'),120),
         nullif(trim(coalesce(u.raw_user_meta_data->>'avatar_url',u.raw_user_meta_data->>'picture','')), '')
  from auth.users u where u.id = p_user_id;
$$;

create or replace function public.sync_my_profile()
returns public.profiles language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare v_uid uuid := auth.uid(); v_name text; v_avatar text; v_row public.profiles;
begin
  if v_uid is null then raise exception 'authentication required' using errcode = '28000'; end if;
  select p.display_name,p.avatar_url into v_name,v_avatar from public.profile_values_from_metadata(v_uid) p;
  insert into public.profiles(user_id,display_name,avatar_url)
  values(v_uid,coalesce(v_name,'Người học'),v_avatar)
  on conflict(user_id) do update set display_name=excluded.display_name,avatar_url=excluded.avatar_url,updated_at=now()
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.handle_new_auth_user_profile()
returns trigger language plpgsql security definer set search_path = public, auth, pg_temp as $$
begin
  insert into public.profiles(user_id,display_name,avatar_url)
  values(new.id,left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''),nullif(trim(new.raw_user_meta_data->>'name'), ''),nullif(trim(new.raw_user_meta_data->>'display_name'), ''),'Người học'),120),nullif(trim(coalesce(new.raw_user_meta_data->>'avatar_url',new.raw_user_meta_data->>'picture','')), ''))
  on conflict(user_id) do update set display_name=excluded.display_name,avatar_url=excluded.avatar_url,updated_at=now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_sync_profile on auth.users;
create trigger on_auth_user_created_sync_profile after insert or update of raw_user_meta_data on auth.users for each row execute function public.handle_new_auth_user_profile();

create or replace function public.exp_period_start(p_period text)
returns timestamptz language plpgsql stable set search_path = public, pg_temp as $$
begin
  case lower(coalesce(p_period,'week'))
    when 'week' then return date_trunc('week',now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh';
    when 'month' then return date_trunc('month',now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh';
    when 'total' then return null;
    else raise exception 'invalid leaderboard period';
  end case;
end;
$$;

create or replace function public.record_learning_event(p_event_code text,p_source_id text)
returns table(recorded boolean,reason text)
language plpgsql security definer set search_path = public,auth,pg_temp as $$
declare v_uid uuid:=auth.uid(); v_code text:=lower(trim(coalesce(p_event_code,''))); v_source text:=trim(coalesce(p_source_id,'')); v_local_date date:=(now() at time zone 'Asia/Ho_Chi_Minh')::date; v_dedupe text; v_inserted integer;
begin
  if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
  if v_source !~ '^[A-Za-z0-9:_./-]{1,160}$' then raise exception 'invalid source id'; end if;
  case v_code
    when 'study_day' then v_source:='web'; v_dedupe:='study_day:'||v_local_date::text;
    when 'word_review' then if v_source !~ '^word:[a-z0-9]+:[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'invalid word review source'; end if; v_dedupe:='word_review:'||v_source;
    when 'quiz_complete' then if v_source !~ '^(hsk|erp):[A-Za-z0-9_-]+:quiz$' then raise exception 'invalid quiz source'; end if; v_dedupe:='quiz_complete:'||v_source;
    else raise exception 'unsupported learning event';
  end case;
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text||':'||v_dedupe,0));
  perform public.sync_my_profile();
  insert into public.learning_events(user_id,event_code,source_id,dedupe_key) values(v_uid,v_code,v_source,v_dedupe) on conflict(user_id,dedupe_key) do nothing;
  get diagnostics v_inserted=row_count;
  if v_code<>'study_day' then insert into public.learning_events(user_id,event_code,source_id,dedupe_key) values(v_uid,'study_day','web','study_day:'||v_local_date::text) on conflict(user_id,dedupe_key) do nothing; end if;
  recorded:=v_inserted=1; reason:=case when recorded then 'recorded' else 'duplicate' end; return next;
end;
$$;

create or replace function public.award_exp(p_activity_code text,p_source_id text)
returns table(awarded boolean,exp_awarded integer,total_exp bigint,reason text)
language plpgsql security definer set search_path = public,auth,pg_temp as $$
declare v_uid uuid:=auth.uid(); v_code text:=lower(trim(coalesce(p_activity_code,''))); v_source text:=trim(coalesce(p_source_id,'')); v_amount integer; v_daily_cap integer; v_dedupe text; v_local_date date:=(now() at time zone 'Asia/Ho_Chi_Minh')::date; v_day_start timestamptz:=((now() at time zone 'Asia/Ho_Chi_Minh')::date::timestamp at time zone 'Asia/Ho_Chi_Minh'); v_day_end timestamptz; v_today_exp integer; v_inserted integer;
begin
  if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
  if v_source !~ '^[A-Za-z0-9:_./-]{1,160}$' then raise exception 'invalid source id'; end if;
  case v_code
    when 'lesson_complete' then v_amount:=20;v_daily_cap:=100;v_dedupe:=v_code||':'||v_source;
    when 'quiz_pass' then v_amount:=15;v_daily_cap:=75;v_dedupe:=v_code||':'||v_source;
    when 'dictation_complete' then v_amount:=10;v_daily_cap:=50;v_dedupe:=v_code||':'||v_source;
    when 'daily_goal' then v_amount:=10;v_daily_cap:=10;v_dedupe:=v_code||':'||v_local_date::text;
    when 'lesson_review' then v_amount:=2;v_daily_cap:=10;v_dedupe:=v_code||':'||v_source||':'||v_local_date::text;
    else raise exception 'unsupported activity code';
  end case;
  if v_code in('lesson_complete','lesson_review') and v_source !~ '^(hsk|erp):[A-Za-z0-9_-]+:lesson$' then raise exception 'invalid lesson source';
  elsif v_code='quiz_pass' and v_source !~ '^(hsk|erp):[A-Za-z0-9_-]+:quiz$' then raise exception 'invalid quiz source';
  elsif v_code='dictation_complete' and v_source !~ '^hsk:[A-Za-z0-9_-]+:dictation$' then raise exception 'invalid dictation source';
  elsif v_code='daily_goal' and v_source<>'daily-words' then raise exception 'invalid daily goal source'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text||':'||v_code||':'||v_source,0));
  perform public.sync_my_profile();
  insert into public.learning_events(user_id,event_code,source_id,dedupe_key) values(v_uid,'study_day','web','study_day:'||v_local_date::text) on conflict(user_id,dedupe_key) do nothing;
  if v_code='quiz_pass' then insert into public.learning_events(user_id,event_code,source_id,dedupe_key) values(v_uid,'quiz_complete',v_source,'quiz_complete:'||v_source) on conflict(user_id,dedupe_key) do nothing; end if;
  v_day_end:=v_day_start+interval '1 day';
  select coalesce(sum(t.exp_amount),0)::integer into v_today_exp from public.exp_transactions t where t.user_id=v_uid and t.activity_code=v_code and t.created_at>=v_day_start and t.created_at<v_day_end;
  if v_today_exp+v_amount>v_daily_cap then select coalesce(sum(t.exp_amount),0) into total_exp from public.exp_transactions t where t.user_id=v_uid; awarded:=false;exp_awarded:=0;reason:='daily_cap';return next;return; end if;
  insert into public.exp_transactions(user_id,activity_code,source_id,exp_amount,dedupe_key) values(v_uid,v_code,v_source,v_amount,v_dedupe) on conflict(user_id,dedupe_key) do nothing;
  get diagnostics v_inserted=row_count;
  select coalesce(sum(t.exp_amount),0) into total_exp from public.exp_transactions t where t.user_id=v_uid;
  awarded:=v_inserted=1;exp_awarded:=case when awarded then v_amount else 0 end;reason:=case when awarded then 'awarded' else 'duplicate' end;return next;
end;
$$;

create or replace function public.get_my_exp() returns bigint language sql stable security definer set search_path=public,pg_temp as $$ select coalesce(sum(t.exp_amount),0)::bigint from public.exp_transactions t where t.user_id=auth.uid(); $$;

drop function if exists public.get_leaderboard(text,integer);
create function public.get_leaderboard(p_period text default 'week',p_limit integer default 100)
returns table(rank bigint,display_name text,avatar_url text,period_exp bigint,total_exp bigint)
language sql stable security definer set search_path=public,pg_temp as $$
  with bounds as(select public.exp_period_start(p_period) starts_at),
  all_totals as(select t.user_id,sum(t.exp_amount)::bigint total_exp from public.exp_transactions t group by t.user_id),
  period_totals as(select t.user_id,sum(t.exp_amount)::bigint period_exp,max(t.created_at) achieved_at from public.exp_transactions t cross join bounds b where b.starts_at is null or t.created_at>=b.starts_at group by t.user_id),
  ranked as(select row_number() over(order by pt.period_exp desc,pt.achieved_at asc,pt.user_id asc)::bigint rank,pt.user_id,pt.period_exp,at.total_exp from period_totals pt join all_totals at on at.user_id=pt.user_id)
  select r.rank,p.display_name,p.avatar_url,r.period_exp,r.total_exp from ranked r join public.profiles p on p.user_id=r.user_id order by r.rank limit least(greatest(coalesce(p_limit,100),1),100);
$$;

drop function if exists public.get_my_rank(text);
create function public.get_my_rank(p_period text default 'week')
returns table(rank bigint,period_exp bigint,total_exp bigint)
language sql stable security definer set search_path=public,pg_temp as $$
  with bounds as(select public.exp_period_start(p_period) starts_at),
  all_totals as(select t.user_id,sum(t.exp_amount)::bigint total_exp from public.exp_transactions t group by t.user_id),
  period_totals as(select t.user_id,sum(t.exp_amount)::bigint period_exp,max(t.created_at) achieved_at from public.exp_transactions t cross join bounds b where b.starts_at is null or t.created_at>=b.starts_at group by t.user_id),
  ranked as(select row_number() over(order by coalesce(pt.period_exp,0) desc,coalesce(pt.achieved_at,'infinity'::timestamptz) asc,at.user_id asc)::bigint rank,at.user_id,coalesce(pt.period_exp,0)::bigint period_exp,at.total_exp from all_totals at left join period_totals pt on pt.user_id=at.user_id)
  select r.rank,r.period_exp,r.total_exp from ranked r where r.user_id=auth.uid();
$$;

create or replace function public.get_weekly_missions()
returns table(mission_code text,title text,reward_exp integer,current_value integer,target_value integer,completed boolean,claimed boolean)
language sql stable security definer set search_path=public,pg_temp as $$
  with bounds as(select public.exp_period_start('week') starts_at),
  counts as(select count(distinct(le.created_at at time zone 'Asia/Ho_Chi_Minh')::date) filter(where le.event_code='study_day')::integer study_days,count(*) filter(where le.event_code='word_review')::integer word_reviews,count(*) filter(where le.event_code='quiz_complete')::integer quizzes from public.learning_events le cross join bounds b where le.user_id=auth.uid() and le.created_at>=b.starts_at),
  claims as(select array_agg(t.source_id)::text[] codes from public.exp_transactions t cross join bounds b where t.user_id=auth.uid() and t.activity_code='weekly_mission' and t.created_at>=b.starts_at)
  select 'study_5_days','Học đủ 5 ngày',100,least(coalesce(c.study_days,0),5),5,coalesce(c.study_days,0)>=5,'study_5_days'=any(coalesce(cl.codes,array[]::text[])) from counts c cross join claims cl
  union all select 'review_10_words','Ôn 10 từ vựng',50,least(coalesce(c.word_reviews,0),10),10,coalesce(c.word_reviews,0)>=10,'review_10_words'=any(coalesce(cl.codes,array[]::text[])) from counts c cross join claims cl
  union all select 'complete_quiz','Làm 1 bài kiểm tra',50,least(coalesce(c.quizzes,0),1),1,coalesce(c.quizzes,0)>=1,'complete_quiz'=any(coalesce(cl.codes,array[]::text[])) from counts c cross join claims cl;
$$;

create or replace function public.claim_weekly_mission(p_mission_code text)
returns table(awarded boolean,exp_awarded integer,total_exp bigint,reason text)
language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_uid uuid:=auth.uid();v_code text:=lower(trim(coalesce(p_mission_code,'')));v_reward integer;v_target integer;v_current integer;v_week_start timestamptz:=public.exp_period_start('week');v_week_key text:=to_char((public.exp_period_start('week') at time zone 'Asia/Ho_Chi_Minh')::date,'YYYY-MM-DD');v_dedupe text;v_inserted integer;
begin
  if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
  case v_code
    when 'study_5_days' then v_reward:=100;v_target:=5;select count(distinct(le.created_at at time zone 'Asia/Ho_Chi_Minh')::date)::integer into v_current from public.learning_events le where le.user_id=v_uid and le.event_code='study_day' and le.created_at>=v_week_start;
    when 'review_10_words' then v_reward:=50;v_target:=10;select count(*)::integer into v_current from public.learning_events le where le.user_id=v_uid and le.event_code='word_review' and le.created_at>=v_week_start;
    when 'complete_quiz' then v_reward:=50;v_target:=1;select count(*)::integer into v_current from public.learning_events le where le.user_id=v_uid and le.event_code='quiz_complete' and le.created_at>=v_week_start;
    else raise exception 'unsupported weekly mission';
  end case;
  if coalesce(v_current,0)<v_target then select coalesce(sum(t.exp_amount),0) into total_exp from public.exp_transactions t where t.user_id=v_uid;awarded:=false;exp_awarded:=0;reason:='not_complete';return next;return;end if;
  v_dedupe:='weekly:'||v_week_key||':'||v_code;
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text||':'||v_dedupe,0));perform public.sync_my_profile();
  insert into public.exp_transactions(user_id,activity_code,source_id,exp_amount,dedupe_key) values(v_uid,'weekly_mission',v_code,v_reward,v_dedupe) on conflict(user_id,dedupe_key) do nothing;
  get diagnostics v_inserted=row_count;select coalesce(sum(t.exp_amount),0) into total_exp from public.exp_transactions t where t.user_id=v_uid;
  awarded:=v_inserted=1;exp_awarded:=case when awarded then v_reward else 0 end;reason:=case when awarded then 'awarded' else 'duplicate' end;return next;
end;
$$;

alter table public.profiles enable row level security;
alter table public.exp_transactions enable row level security;
alter table public.learning_events enable row level security;
revoke all on table public.profiles from anon,authenticated;
revoke all on table public.exp_transactions from anon,authenticated;
revoke all on table public.learning_events from anon,authenticated;
grant select,insert,update on table public.profiles to authenticated;
grant select on table public.exp_transactions to authenticated;
grant select on table public.learning_events to authenticated;
drop policy if exists profiles_select_own on public.profiles;create policy profiles_select_own on public.profiles for select to authenticated using(user_id=auth.uid());
drop policy if exists profiles_insert_own on public.profiles;create policy profiles_insert_own on public.profiles for insert to authenticated with check(user_id=auth.uid());
drop policy if exists profiles_update_own on public.profiles;create policy profiles_update_own on public.profiles for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists exp_transactions_select_own on public.exp_transactions;create policy exp_transactions_select_own on public.exp_transactions for select to authenticated using(user_id=auth.uid());
drop policy if exists learning_events_select_own on public.learning_events;create policy learning_events_select_own on public.learning_events for select to authenticated using(user_id=auth.uid());

revoke all on function public.touch_updated_at() from public;
revoke all on function public.profile_values_from_metadata(uuid) from public;
revoke all on function public.handle_new_auth_user_profile() from public;
revoke all on function public.exp_period_start(text) from public;
revoke all on function public.sync_my_profile() from public;
revoke all on function public.record_learning_event(text,text) from public;
revoke all on function public.award_exp(text,text) from public;
revoke all on function public.get_my_exp() from public;
revoke all on function public.get_leaderboard(text,integer) from public;
revoke all on function public.get_my_rank(text) from public;
revoke all on function public.get_weekly_missions() from public;
revoke all on function public.claim_weekly_mission(text) from public;
grant execute on function public.sync_my_profile() to authenticated;
grant execute on function public.record_learning_event(text,text) to authenticated;
grant execute on function public.award_exp(text,text) to authenticated;
grant execute on function public.get_my_exp() to authenticated;
grant execute on function public.get_leaderboard(text,integer) to anon,authenticated;
grant execute on function public.get_my_rank(text) to authenticated;
grant execute on function public.get_weekly_missions() to authenticated;
grant execute on function public.claim_weekly_mission(text) to authenticated;

comment on function public.award_exp(text,text) is 'Awards fixed server-side EXP. The browser never supplies exp_amount.';
comment on function public.claim_weekly_mission(text) is 'Awards fixed weekly mission EXP once per Asia/Ho_Chi_Minh week after server-side evidence checks.';
