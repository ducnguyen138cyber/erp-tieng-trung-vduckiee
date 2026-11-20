-- Separate, additive game ledger. No game operation writes learning EXP/events.
-- Session ownership, replay idempotency, bounded metrics and server-side scoring
-- prevent accidental duplicates and arbitrary score amounts. Browser evidence is
-- still client supplied: this is not a cryptographic anti-cheat/replay verifier.
create schema if not exists game_private;
revoke all on schema game_private from public;
grant usage on schema game_private to anon, authenticated;

create table game_private.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game text not null check (game in ('typing','sentences')),
  category text not null check (char_length(category) between 1 and 50),
  started_at timestamptz not null default clock_timestamp(),
  finished_at timestamptz,
  score integer check (score between 100 and 150000),
  accuracy integer check (accuracy between 0 and 100),
  completed integer check (completed between 1 and 300),
  active_ms integer check (active_ms between 0 and 7200000),
  check ((finished_at is null and score is null) or (finished_at is not null and score is not null))
);
alter table game_private.runs enable row level security;
revoke all on game_private.runs from public,anon,authenticated;
create index game_runs_owner_started on game_private.runs(user_id,started_at desc);
create index game_runs_board on game_private.runs(game,category,finished_at desc) where finished_at is not null;

create function game_private.valid_category(p_game text,p_category text) returns boolean
language sql immutable security invoker set search_path='' as $$
 select coalesce((p_game='typing' and p_category ~ '^[1-4]:(easy|medium|hard):(guided|hanzi|vietnamese)$')
   or (p_game='sentences' and p_category in ('basic','daily','factory')),false)
$$;

create function game_private.start_run(p_game text,p_category text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_id uuid;
begin
 if v_user is null then raise exception 'authentication required' using errcode='28000'; end if;
 if not game_private.valid_category(p_game,p_category) then raise exception 'invalid game category'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text||':game-run-start',0));
 if (select count(*) from game_private.runs where user_id=v_user and started_at>clock_timestamp()-interval '1 hour')>=60 then
   raise exception 'too many runs; try again later';
 end if;
 perform public.sync_my_profile();
 insert into game_private.runs(user_id,game,category) values(v_user,p_game,p_category) returning id into v_id;
 return jsonb_build_object('run_id',v_id);
end $$;

create function game_private.submit_run(p_run_id uuid,p_result jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_run game_private.runs%rowtype; v_n integer; v_attempts integer; v_correct integer;
 v_ms integer; v_score integer:=0; v_accuracy integer; v_combo integer; v_previous integer:=0; v_item jsonb;
begin
 if v_user is null then raise exception 'authentication required' using errcode='28000'; end if;
 select * into v_run from game_private.runs where id=p_run_id and user_id=v_user for update;
 if not found then raise exception 'run not found'; end if;
 -- Return the already accepted result on retries, even when the caller changes its payload.
 if v_run.finished_at is not null then return jsonb_build_object('score',v_run.score,'accuracy',v_run.accuracy,'duplicate',true); end if;
 if clock_timestamp()-v_run.started_at>interval '2 hours' then raise exception 'run expired'; end if;
 if p_result is null or jsonb_typeof(p_result)<>'object' or octet_length(p_result::text)>12000 then raise exception 'invalid result'; end if;
 if coalesce(p_result->>'completed','') !~ '^[0-9]{1,3}$'
    or coalesce(p_result->>'attempts','') !~ '^[0-9]{1,5}$'
    or coalesce(p_result->>'correct','') !~ '^[0-9]{1,5}$'
    or coalesce(p_result->>'active_ms','') !~ '^[0-9]{1,7}$' then raise exception 'invalid metrics'; end if;
 v_n:=(p_result->>'completed')::integer; v_attempts:=(p_result->>'attempts')::integer;
 v_correct:=(p_result->>'correct')::integer; v_ms:=(p_result->>'active_ms')::integer;
 if v_n not between 1 and 300 or v_correct<v_n or v_attempts<v_correct or v_attempts>20000 or v_ms<0
   or v_ms>7200000 or v_ms>extract(epoch from clock_timestamp()-v_run.started_at)*1000+2500 then raise exception 'implausible metrics'; end if;
 if v_run.game='typing' then
   if v_ms>180000 or v_ms<greatest(0,(v_n-2)*500) or jsonb_typeof(p_result->'combos') is distinct from 'array' then raise exception 'invalid typing result'; end if;
   if jsonb_array_length(p_result->'combos')<>v_n then raise exception 'invalid combo count'; end if;
   for v_item in select value from jsonb_array_elements(p_result->'combos') loop
     if v_item::text !~ '^[0-9]{1,3}$' then raise exception 'invalid combo'; end if;
     v_combo:=v_item::text::integer;
     if v_combo<>1 and v_combo<>v_previous+1 then raise exception 'invalid combo sequence'; end if;
     if v_combo<1 then raise exception 'invalid combo'; end if;
     v_score:=v_score+100*least(5,1+(v_combo-1)/5); v_previous:=v_combo;
   end loop;
 else
   if v_n>10 then raise exception 'invalid sentence count'; end if;
   v_score:=v_n*100;
 end if;
 v_accuracy:=round(100.0*v_correct/v_attempts)::integer;
 update game_private.runs set finished_at=clock_timestamp(),score=v_score,accuracy=v_accuracy,completed=v_n,active_ms=v_ms where id=v_run.id;
 return jsonb_build_object('score',v_score,'accuracy',v_accuracy,'duplicate',false);
end $$;

-- Public reading is intentional. Only display names and score summaries leave
-- the private ledger; run IDs, account UUIDs, emails and auth metadata do not.
create function game_private.board(p_game text,p_category text,p_period text,p_limit integer) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v_start timestamptz; v_result jsonb;
begin
 if not game_private.valid_category(p_game,p_category) or p_period is null or p_period not in ('week','total') then raise exception 'invalid board'; end if;
 v_start:=case when p_period='week' then date_trunc('week',now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh' else null end;
 with best as (
   select distinct on(r.user_id) r.user_id,r.score,r.accuracy,r.completed,r.finished_at
   from game_private.runs r where r.game=p_game and r.category=p_category and r.finished_at is not null and (v_start is null or r.finished_at>=v_start)
   order by r.user_id,r.score desc,r.accuracy desc,r.finished_at,r.id
 ), ranked as (
   select row_number() over(order by b.score desc,b.accuracy desc,b.finished_at,b.user_id) rank,
     p.display_name,b.score,b.accuracy,b.completed,coalesce(b.user_id=auth.uid(),false) is_me
   from best b join public.profiles p on p.user_id=b.user_id
 )
 select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(x) order by x.rank) from (select * from ranked order by rank limit least(100,greatest(1,coalesce(p_limit,50)))) x),'[]'::jsonb),
   'mine',(select to_jsonb(x) from ranked x where is_me)) into v_result;
 return v_result;
end $$;

-- Exposed wrappers are invoker functions; privileged work stays unexposed.
create function public.start_game_run(p_game text,p_category text) returns jsonb
language sql security invoker set search_path='' as $$ select game_private.start_run(p_game,p_category) $$;
create function public.submit_game_run(p_run_id uuid,p_result jsonb) returns jsonb
language sql security invoker set search_path='' as $$ select game_private.submit_run(p_run_id,p_result) $$;
create function public.get_game_leaderboard(p_game text,p_category text,p_period text default 'week',p_limit integer default 50) returns jsonb
language sql stable security invoker set search_path='' as $$ select game_private.board(p_game,p_category,p_period,p_limit) $$;

revoke all on all functions in schema game_private from public,anon,authenticated;
grant execute on function game_private.start_run(text,text),game_private.submit_run(uuid,jsonb) to authenticated;
grant execute on function game_private.board(text,text,text,integer) to anon,authenticated;
revoke all on function public.start_game_run(text,text),public.submit_game_run(uuid,jsonb),public.get_game_leaderboard(text,text,text,integer) from public,anon,authenticated;
grant execute on function public.start_game_run(text,text),public.submit_game_run(uuid,jsonb) to authenticated;
grant execute on function public.get_game_leaderboard(text,text,text,integer) to anon,authenticated;


-- Serialize the shared daily budget across different source IDs.
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
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text||':daily-exp:'||v_code||':'||v_local_date::text,0));
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
