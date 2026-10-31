-- Run against a migrated test/development database with an existing Auth account.
-- Uses the authenticated role and existing RPCs. All writes are rolled back.
begin;
do $setup$
declare v_uid uuid;
begin
  select id into v_uid from auth.users where not exists (select 1 from public.exp_transactions t where t.user_id=auth.users.id) order by created_at limit 1;
  if v_uid is null then raise exception 'No existing account with an empty EXP history is available for this rollback-only test'; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_uid,'role','authenticated')::text,true);
  if has_function_privilege('anon','public.award_exp(text,text)','execute') or has_function_privilege('anon','public.profile_values_from_metadata(uuid)','execute') then raise exception 'Unexpected anonymous privileged RPC access'; end if;
  if has_function_privilege('authenticated','public.profile_values_from_metadata(uuid)','execute') then raise exception 'Internal helper must not be callable by learners'; end if;
end;
$setup$;
set local role authenticated;
do $test$
declare v_before bigint; v_source text := 'erp:backendcheck_'||replace(gen_random_uuid()::text,'-','')||':quiz'; v_first record; v_second record; v_claim record; v_rank record; v_count integer; v_period text;
begin
  v_before:=public.get_my_exp();
  select * into v_first from public.award_exp('quiz_pass',v_source);
  if not v_first.awarded or v_first.exp_awarded<>15 then raise exception 'Quiz award failed: %',row_to_json(v_first); end if;
  select * into v_second from public.award_exp('quiz_pass',v_source);
  if v_second.awarded or v_second.exp_awarded<>0 or v_second.reason<>'duplicate' then raise exception 'Duplicate award was not blocked'; end if;
  if public.get_my_exp()<>v_before+15 then raise exception 'EXP total incorrect'; end if;
  select count(*) into v_count from public.get_weekly_missions();
  if v_count<>3 then raise exception 'Expected three weekly missions'; end if;
  if not exists(select 1 from public.get_weekly_missions() where mission_code='complete_quiz' and completed and not claimed) then raise exception 'Quiz evidence did not complete weekly mission'; end if;
  select * into v_claim from public.claim_weekly_mission('complete_quiz');
  if not v_claim.awarded or v_claim.exp_awarded<>50 then raise exception 'Weekly reward failed'; end if;
  select * into v_claim from public.claim_weekly_mission('complete_quiz');
  if v_claim.awarded or v_claim.exp_awarded<>0 then raise exception 'Weekly reward duplicated'; end if;
  if public.get_my_exp()<>v_before+65 then raise exception 'Weekly total incorrect'; end if;
  foreach v_period in array array['week','month','total'] loop
    select * into v_rank from public.get_my_rank(v_period);
    if v_rank.rank is null or v_rank.total_exp<>v_before+65 or v_rank.period_exp<>65 then raise exception 'Rank totals incorrect for %',v_period; end if;
    if not exists(select 1 from public.get_leaderboard(v_period,100) where rank=v_rank.rank and total_exp=v_before+65 and period_exp=65) then raise exception 'Leaderboard and own rank disagree for %',v_period; end if;
  end loop;
  if exists(select 1 from public.profiles where user_id<>auth.uid()) then raise exception 'Profile RLS leaked another user'; end if;
  if not exists(select 1 from public.get_weekly_missions() where mission_code='complete_quiz' and claimed) then raise exception 'Weekly claim state incorrect'; end if;
  perform set_config('vduckie.exp_backend_test','{"passed":true,"checks":["authenticated_quiz_award","duplicate_award","three_weekly_missions","quiz_evidence","weekly_reward","duplicate_weekly_reward","week_month_total_ranks","profile_rls"],"persistent_test_writes":false}',true);
end;
$test$;
select current_setting('vduckie.exp_backend_test')::jsonb as test_result;
rollback;
