-- Integration assertions against the real schema, all test writes rolled back.
begin;
do $setup$
declare u uuid;
begin
 select id into u from auth.users order by created_at limit 1;
 if u is null then raise exception 'test requires an existing account'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 perform set_config('vduckie.game_test_user',u::text,true);
 perform set_config('vduckie.game_test_exp',public.get_my_exp()::text,true);
 -- Old dates avoid assumptions about existing user rankings or today's weekday.
end $setup$;
set local role authenticated;
do $ownership$
declare a jsonb; b jsonb; r jsonb; rejected boolean:=false;
begin
 a:=public.start_game_run('typing','4:hard:hanzi');
 perform set_config('vduckie.game_test_run',a->>'run_id',true);
 begin perform public.start_game_run('typing','9:easy:guided'); exception when others then rejected:=true; end;
 if not rejected then raise exception 'invalid category accepted'; end if;
 r:=public.submit_game_run((a->>'run_id')::uuid,'{"completed":2,"attempts":8,"correct":6,"active_ms":0,"combos":[1,2],"score":999999}'::jsonb);
 if (r->>'score')::integer<>200 or (r->>'accuracy')::integer<>75 then raise exception 'server scoring failed'; end if;
 b:=public.submit_game_run((a->>'run_id')::uuid,'{}');
 if not (b->>'duplicate')::boolean or (b->>'score')::integer<>200 then raise exception 'retry changed accepted score'; end if;
 a:=public.start_game_run('typing','4:hard:hanzi');
 rejected:=false;
 begin perform public.submit_game_run((a->>'run_id')::uuid,'{"completed":2,"attempts":8,"correct":6,"active_ms":0,"combos":[5,6]}'); exception when others then rejected:=true; end;
 if not rejected then raise exception 'invalid combo accepted'; end if;
 rejected:=false;
 begin perform public.submit_game_run((a->>'run_id')::uuid,'{"completed":1,"attempts":1,"correct":1,"active_ms":180001,"combos":[1]}'); exception when others then rejected:=true; end;
 if not rejected then raise exception 'impossible duration accepted'; end if;
 a:=public.start_game_run('sentences','factory');
 r:=public.submit_game_run((a->>'run_id')::uuid,'{"completed":8,"attempts":50,"correct":45,"active_ms":0,"score":999999}');
 if (r->>'score')::integer<>800 then raise exception 'sentence scoring failed'; end if;
 r:=public.get_game_leaderboard('typing','4:hard:hanzi','total',100);
 if (r->'mine'->>'score')::integer<>200 then raise exception 'personal ranking missing'; end if;
 if (select count(*) from jsonb_array_elements(r->'rows') where (value->>'is_me')::boolean)<>1 then raise exception 'duplicate test player'; end if;
 if r::text like '%user_id%' or r::text like '%run_id%' then raise exception 'private fields leaked'; end if;
 if public.get_my_exp()<>current_setting('vduckie.game_test_exp')::bigint then raise exception 'game awarded EXP'; end if;
end $ownership$;
reset role;
do $other_user$
declare u uuid; rejected boolean:=false;
begin
 select id into u from auth.users where id<>current_setting('vduckie.game_test_user')::uuid limit 1;
 if u is null then raise exception 'test requires two existing accounts'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 begin perform public.submit_game_run(current_setting('vduckie.game_test_run')::uuid,'{}'); exception when others then rejected:=true; end;
 if not rejected then raise exception 'cross-account run accepted'; end if;
 if has_table_privilege('authenticated','game_private.runs','INSERT') or has_table_privilege('anon','game_private.runs','SELECT') then raise exception 'direct ledger access'; end if;
 if has_function_privilege('anon','public.start_game_run(text,text)','EXECUTE') then raise exception 'guest can submit'; end if;
 if position('daily-exp:' in pg_get_functiondef('public.award_exp(text,text)'::regprocedure))=0 then raise exception 'daily shared lock missing'; end if;
end $other_user$;
set local role anon;
select public.get_game_leaderboard('typing','4:hard:hanzi','week',5) is not null as public_board_readable;
reset role;
select jsonb_build_object('passed',true,'checks',array['server_score_not_client_amount','retry_idempotency','separate_categories','invalid_combo_rejected','impossible_time_rejected','one_best_per_player','personal_rank','private_fields_hidden','other_account_rejected','guest_read_only','no_game_exp','shared_daily_exp_lock'],'persistent_test_writes',false) as test_result;
rollback;
