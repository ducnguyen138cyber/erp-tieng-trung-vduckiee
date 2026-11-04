-- Update VDuckie HSK mastery reward from +5 to +3 EXP per distinct word.
-- Daily quota: at most 50 newly rewarded words, not an EXP-sum threshold.
-- Existing +5 awards remain in history; they count as one word toward today's 50.
-- Serialize all word awards for the same learner/day to prevent concurrent cap bypass.
-- Does not touch lesson/quiz/dictation/review/weekly rewards.

create or replace function public.award_word_mastery(p_level integer, p_word_hash text)
returns table(awarded boolean, exp_awarded integer, total_exp bigint, reason text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $function$
declare
  v_uid uuid := auth.uid();
  v_hash text := lower(trim(coalesce(p_word_hash, '')));
  v_source text;
  v_dedupe text;
  v_today_words integer;
  v_inserted integer;
  v_local_date date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_start timestamptz := ((now() at time zone 'Asia/Ho_Chi_Minh')::date::timestamp at time zone 'Asia/Ho_Chi_Minh');
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if p_level not between 1 and 4 or v_hash !~ '^[0-9a-z]{5,12}$' then
    raise exception 'invalid word mastery evidence';
  end if;

  v_source := 'hsk:word:' || p_level::text || ':' || v_hash;
  v_dedupe := 'word_mastered:' || v_source;

  -- Lock across DIFFERENT words, not only the same word, for a strict daily quota.
  perform pg_advisory_xact_lock(
    hashtextextended(v_uid::text || ':word_mastery_daily:' || v_local_date::text, 0)
  );
  perform public.sync_my_profile();

  if exists (
    select 1 from public.exp_transactions t
    where t.user_id = v_uid and t.dedupe_key = v_dedupe
  ) then
    select coalesce(sum(t.exp_amount), 0) into total_exp
    from public.exp_transactions t where t.user_id = v_uid;
    awarded := false; exp_awarded := 0; reason := 'duplicate';
    return next; return;
  end if;

  -- Count awarded words, including transactions made under the old +5 rule.
  select count(*)::integer into v_today_words
  from public.exp_transactions t
  where t.user_id = v_uid
    and t.activity_code = 'word_mastered'
    and t.created_at >= v_start
    and t.created_at < v_start + interval '1 day';

  if v_today_words >= 50 then
    select coalesce(sum(t.exp_amount), 0) into total_exp
    from public.exp_transactions t where t.user_id = v_uid;
    awarded := false; exp_awarded := 0; reason := 'daily_cap';
    return next; return;
  end if;

  insert into public.exp_transactions(user_id, activity_code, source_id, exp_amount, dedupe_key)
  values (v_uid, 'word_mastered', v_source, 3, v_dedupe)
  on conflict(user_id, dedupe_key) do nothing;
  get diagnostics v_inserted = row_count;

  select coalesce(sum(t.exp_amount), 0) into total_exp
  from public.exp_transactions t where t.user_id = v_uid;
  awarded := v_inserted = 1;
  exp_awarded := case when awarded then 3 else 0 end;
  reason := case when awarded then 'awarded' else 'duplicate' end;
  return next;
end
$function$;

revoke all on function public.award_word_mastery(integer,text) from public, anon;
grant execute on function public.award_word_mastery(integer,text) to authenticated;
