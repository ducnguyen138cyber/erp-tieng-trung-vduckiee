-- Existing user and authenticated RPC only; every test award is rolled back.
begin;
do $setup$
declare v_uid uuid;
begin
  select u.id into v_uid from auth.users u join public.profiles p on p.user_id=u.id order by u.created_at limit 1;
  if v_uid is null then raise exception 'An existing learner is required'; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_uid,'role','authenticated')::text,true);
  if has_function_privilege('anon','public.award_word_mastery(integer,text)','execute') then raise exception 'Unexpected anonymous access'; end if;
end $setup$;
set local role authenticated;
do $test$
declare v_before bigint; v_row record; v_count integer; v_hash text; v_added integer:=0; v_rejected boolean; v_level integer;
begin
  v_before:=public.get_my_exp();
  select count(*) into v_count from public.exp_transactions where user_id=auth.uid() and activity_code='word_mastered'
    and created_at>=((now() at time zone 'Asia/Ho_Chi_Minh')::date::timestamp at time zone 'Asia/Ho_Chi_Minh')
    and created_at<((now() at time zone 'Asia/Ho_Chi_Minh')::date::timestamp at time zone 'Asia/Ho_Chi_Minh')+interval '1 day';
  for i in 1..51 loop
    v_level:=case when i%2=0 then 5 else 6 end;
    v_hash:='q'||substr(md5(gen_random_uuid()::text),1,10);
    select * into v_row from public.award_word_mastery(v_level,v_hash);
    if i<=greatest(0,50-v_count) then
      if not v_row.awarded or v_row.exp_awarded<>3 then raise exception 'New HSK5/6 award failed';end if;
      v_added:=v_added+3;
      select * into v_row from public.award_word_mastery(v_level,v_hash);
      if v_row.awarded or v_row.reason<>'duplicate' then raise exception 'Duplicate was not rejected';end if;
    elsif v_row.awarded or v_row.reason<>'daily_cap' then raise exception 'Shared daily cap was not enforced';end if;
  end loop;
  if public.get_my_exp()<>v_before+v_added then raise exception 'Total EXP is inconsistent';end if;
  foreach v_level in array array[0,7] loop
    v_rejected:=false;
    begin perform public.award_word_mastery(v_level,'invalid99');exception when raise_exception then v_rejected:=true;end;
    if not v_rejected then raise exception 'Unsupported level was accepted';end if;
  end loop;
  perform set_config('vduckie.hsk56_test',json_build_object('passed',true,'shared_daily_cap',true,'deduplication',true,'total_exp_consistent',true,'persistent_writes',false)::text,true);
end $test$;
select current_setting('vduckie.hsk56_test')::jsonb as verification;
rollback;
