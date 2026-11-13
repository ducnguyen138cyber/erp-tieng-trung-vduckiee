-- Disposable CI database only. Reuse the checked-in table/policies verbatim.
-- Never run this setup on a hosted Supabase project.
\set ON_ERROR_STOP on
begin;
create schema auth;
create role anon nologin;
create role authenticated nologin;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
\ir ../supabase/schema.sql
insert into auth.users values ('00000000-0000-4000-8000-000000000111'),('00000000-0000-4000-8000-000000000222');
insert into public.user_words(user_id,word_key,note) values
 ('00000000-0000-4000-8000-000000000111','profile','alice-only'),
 ('00000000-0000-4000-8000-000000000222','profile','bob-only');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000111',true);
do $$declare n integer;begin
 if (select count(*) from public.user_words)<>1 then raise exception 'Alice can read another owner';end if;
 if not exists(select 1 from public.user_words where note='alice-only') then raise exception 'Alice own read denied';end if;
 update public.user_words set note='alice-updated' where word_key='profile';get diagnostics n=row_count;if n<>1 then raise exception 'Alice own update denied';end if;
 update public.user_words set note='intrusion' where user_id='00000000-0000-4000-8000-000000000222';get diagnostics n=row_count;if n<>0 then raise exception 'Cross-owner update allowed';end if;
 delete from public.user_words where user_id='00000000-0000-4000-8000-000000000222';get diagnostics n=row_count;if n<>0 then raise exception 'Cross-owner delete allowed';end if;
 begin
  insert into public.user_words(user_id,word_key) values('00000000-0000-4000-8000-000000000222','cross-owner');
  raise exception 'Cross-owner insert allowed';
 exception when insufficient_privilege then null;end;
 begin
  update public.user_words set user_id='00000000-0000-4000-8000-000000000222' where word_key='profile';
  raise exception 'Ownership reassignment allowed';
 exception when insufficient_privilege then null;end;
 insert into public.user_words(user_id,word_key) values(auth.uid(),'own-new');
 delete from public.user_words where word_key='own-new';get diagnostics n=row_count;if n<>1 then raise exception 'Own delete denied';end if;
 raise notice 'PASS Alice own read/insert/update/delete; cross-owner read/insert/update/delete/reassignment denied';
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000222',true);
do $$begin
 if (select count(*) from public.user_words)<>1 or not exists(select 1 from public.user_words where note='bob-only') then raise exception 'Bob isolation failed';end if;
 raise notice 'PASS Bob sees own original row, no Alice progress';
end$$;
reset role;
set local role anon;
do $$begin
 begin perform 1 from public.user_words;raise exception 'Anonymous progress access allowed';exception when insufficient_privilege then null;end;
 raise notice 'PASS anonymous access denied';
end$$;
reset role;
rollback;
