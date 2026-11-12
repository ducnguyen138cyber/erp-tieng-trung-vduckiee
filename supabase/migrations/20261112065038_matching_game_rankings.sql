-- Add matching without changing existing game runs, EXP or account data.
alter table game_private.runs drop constraint runs_game_check;
alter table game_private.runs add constraint runs_game_check check (game in ('typing','sentences','matching'));

create or replace function game_private.valid_category(p_game text,p_category text) returns boolean
language sql immutable security invoker set search_path='' as $$
 select coalesce((p_game='typing' and p_category ~ '^[1-4]:(easy|medium|hard):(guided|hanzi|vietnamese)$')
   or (p_game='matching' and p_category ~ '^(all|hsk[1-6]|hsk79|factory):(6|8|10|12):(pinyin|hanzi)$')
   or (p_game='sentences' and p_category in ('basic','daily','factory')),false)
$$;

create or replace function game_private.submit_run(p_run_id uuid,p_result jsonb) returns jsonb
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
 elsif v_run.game='matching' then
   if v_n<>split_part(v_run.category,':',2)::integer then raise exception 'matching round incomplete'; end if;
   v_score:=v_n*100;
 else
   if v_n>10 then raise exception 'invalid sentence count'; end if;
   v_score:=v_n*100;
 end if;
 v_accuracy:=round(100.0*v_correct/v_attempts)::integer;
 update game_private.runs set finished_at=clock_timestamp(),score=v_score,accuracy=v_accuracy,completed=v_n,active_ms=v_ms where id=v_run.id;
 return jsonb_build_object('score',v_score,'accuracy',v_accuracy,'duplicate',false);
end $$;
