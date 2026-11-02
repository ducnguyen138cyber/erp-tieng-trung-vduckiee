create or replace function public.get_leaderboard(p_period text default 'week', p_limit integer default 100)
returns table(rank bigint, display_name text, avatar_url text, period_exp bigint, total_exp bigint)
language sql stable security definer set search_path = public, pg_temp
as $$
 with bounds as (select public.exp_period_start(p_period) starts_at),
 totals as (
  select p.user_id,p.display_name,p.avatar_url,
    coalesce(sum(t.exp_amount),0)::bigint total_exp,
    coalesce(sum(t.exp_amount) filter (where b.starts_at is null or t.created_at >= b.starts_at),0)::bigint period_exp,
    max(t.created_at) filter (where b.starts_at is null or t.created_at >= b.starts_at) achieved_at
  from public.profiles p
  cross join bounds b
  left join public.exp_transactions t on t.user_id=p.user_id
  group by p.user_id,p.display_name,p.avatar_url
 )
 select row_number() over (order by period_exp desc, achieved_at asc nulls last,user_id asc)::bigint,
 display_name,avatar_url,period_exp,total_exp from totals
 order by period_exp desc,achieved_at asc nulls last,user_id asc
 limit least(greatest(coalesce(p_limit,100),1),100)
$$;
create or replace function public.get_my_rank(p_period text default 'week')
returns table(rank bigint, period_exp bigint, total_exp bigint)
language sql stable security definer set search_path = public, pg_temp
as $$
 with bounds as(select public.exp_period_start(p_period) starts_at),
 totals as (
  select p.user_id,
    coalesce(sum(t.exp_amount),0)::bigint total_exp,
    coalesce(sum(t.exp_amount) filter(where b.starts_at is null or t.created_at>=b.starts_at),0)::bigint period_exp,
    max(t.created_at) filter(where b.starts_at is null or t.created_at>=b.starts_at) achieved_at
  from public.profiles p cross join bounds b
  left join public.exp_transactions t on t.user_id=p.user_id
  group by p.user_id
 ), ranked as (
  select row_number() over(order by period_exp desc,achieved_at asc nulls last,user_id asc)::bigint rank,user_id,period_exp,total_exp from totals
 )
 select rank,period_exp,total_exp from ranked where user_id=auth.uid()
$$;