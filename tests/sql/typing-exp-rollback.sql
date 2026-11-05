-- Exercise the same RPC used by learning and Games; no test writes persist.
begin;
do $setup$
declare v_uid uuid;
begin
  select id into v_uid from auth.users order by created_at limit 1;
  if v_uid is null then raise exception 'No Auth account available'; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_uid,'role','authenticated')::text,true);
end $setup$;
set local role authenticated;
do $test$
declare
  v_first record; v_again record; v_before bigint; v_added integer:=0; v_hash text;
  v_start timestamptz:=((now() at time zone 'Asia/Ho_Chi_Minh')::date::timestamp at time zone 'Asia/Ho_Chi_Minh');
  v_words integer;
begin
  select count(*) into v_words from public.exp_transactions
  where user_id=auth.uid() and activity_code='word_mastered' and created_at>=v_start and created_at<v_start+interval '1 day';
  v_before:=public.get_my_exp();
  for i in 1..51 loop
    v_hash:='g'||substr(md5(gen_random_uuid()::text),1,10);
    select * into v_first from public.award_word_mastery(1,v_hash);
    if v_words+v_added<50 then
      if not v_first.awarded or v_first.exp_awarded<>3 then raise exception 'Expected +3 EXP'; end if;
      v_added:=v_added+1;
      select * into v_again from public.award_word_mastery(1,v_hash);
      if v_again.awarded or v_again.exp_awarded<>0 or v_again.reason<>'duplicate' then raise exception 'Duplicate failed'; end if;
    else
      if v_first.awarded or v_first.reason<>'daily_cap' then raise exception 'Daily quota failed'; end if;
    end if;
  end loop;
  if public.get_my_exp()<>v_before+v_added*3 then raise exception 'Total EXP mismatch'; end if;
  perform set_config('vduckie.typing_exp_test',jsonb_build_object('passed',true,
    'checks',array['three_exp_per_new_word','same_word_duplicate_blocked','shared_fifty_word_daily_quota','total_matches_awards'],
    'test_awards_rolled_back',v_added,'persistent_test_writes',false)::text,true);
end $test$;
select current_setting('vduckie.typing_exp_test')::jsonb as test_result;
rollback;
