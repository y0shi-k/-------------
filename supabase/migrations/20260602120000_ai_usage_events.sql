-- TKT-0151: Gemini AI daily usage limit.
-- Records AI usage per user / per JST day / per feature and enforces daily caps
-- atomically on the server. Writes happen only through SECURITY DEFINER functions;
-- direct insert/update/delete is closed by RLS. Do not place API keys here.

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null check (feature in ('recipe_generation', 'ingredient_scan')),
  usage_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_events_user_feature_date_idx
  on public.ai_usage_events (user_id, feature, usage_date);
create index if not exists ai_usage_events_user_date_idx
  on public.ai_usage_events (user_id, usage_date);

alter table public.ai_usage_events enable row level security;

-- select: own rows only. No direct insert/update/delete policies => writes are
-- only possible via the SECURITY DEFINER functions below.
drop policy if exists "ai_usage_events_select_own" on public.ai_usage_events;
create policy "ai_usage_events_select_own" on public.ai_usage_events
  for select using (auth.uid() = user_id);

-- consume_ai_usage: atomic reserve. Single source of truth for the daily limits.
-- Returns json { ok, event_id, reason, remaining_feature, remaining_total }.
create or replace function public.consume_ai_usage(p_feature text)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (now() at time zone 'Asia/Tokyo')::date;
  v_recipe_limit int := 20;
  v_scan_limit int := 10;
  v_total_limit int := 30;
  v_feature_limit int;
  v_feature_used int;
  v_total_used int;
  v_event_id uuid;
begin
  if v_uid is null then
    return json_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  if p_feature not in ('recipe_generation', 'ingredient_scan') then
    return json_build_object('ok', false, 'reason', 'invalid_feature');
  end if;

  v_feature_limit := case p_feature
    when 'recipe_generation' then v_recipe_limit
    when 'ingredient_scan' then v_scan_limit
  end;

  -- Serialize concurrent calls for the same user so rapid taps cannot exceed
  -- the limit. The lock is released at transaction end.
  perform pg_advisory_xact_lock(hashtext(v_uid::text));

  select count(*) into v_total_used
  from public.ai_usage_events
  where user_id = v_uid and usage_date = v_today;

  select count(*) into v_feature_used
  from public.ai_usage_events
  where user_id = v_uid and usage_date = v_today and feature = p_feature;

  if v_total_used >= v_total_limit then
    return json_build_object(
      'ok', false,
      'reason', 'total_limit',
      'remaining_feature', greatest(v_feature_limit - v_feature_used, 0),
      'remaining_total', 0
    );
  end if;

  if v_feature_used >= v_feature_limit then
    return json_build_object(
      'ok', false,
      'reason', 'feature_limit',
      'remaining_feature', 0,
      'remaining_total', greatest(v_total_limit - v_total_used, 0)
    );
  end if;

  insert into public.ai_usage_events (user_id, feature, usage_date)
  values (v_uid, p_feature, v_today)
  returning id into v_event_id;

  return json_build_object(
    'ok', true,
    'event_id', v_event_id,
    'remaining_feature', greatest(v_feature_limit - (v_feature_used + 1), 0),
    'remaining_total', greatest(v_total_limit - (v_total_used + 1), 0)
  );
end;
$$;

-- refund_ai_usage: undo a recent reservation by the owner only. Cannot be used to
-- delete older history and reset the limit.
create or replace function public.refund_ai_usage(p_event_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_deleted int;
begin
  if v_uid is null then
    return false;
  end if;

  delete from public.ai_usage_events
  where id = p_event_id
    and user_id = v_uid
    and created_at > now() - interval '5 minutes';

  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;

-- get_ai_usage_summary: per-feature and total used/limit/remaining for today (UI).
create or replace function public.get_ai_usage_summary()
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (now() at time zone 'Asia/Tokyo')::date;
  v_recipe_limit int := 20;
  v_scan_limit int := 10;
  v_total_limit int := 30;
  v_recipe_used int;
  v_scan_used int;
  v_total_used int;
begin
  if v_uid is null then
    return json_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  select
    count(*) filter (where feature = 'recipe_generation'),
    count(*) filter (where feature = 'ingredient_scan'),
    count(*)
  into v_recipe_used, v_scan_used, v_total_used
  from public.ai_usage_events
  where user_id = v_uid and usage_date = v_today;

  return json_build_object(
    'ok', true,
    'recipe_generation', json_build_object(
      'used', v_recipe_used,
      'limit', v_recipe_limit,
      'remaining', greatest(v_recipe_limit - v_recipe_used, 0)
    ),
    'ingredient_scan', json_build_object(
      'used', v_scan_used,
      'limit', v_scan_limit,
      'remaining', greatest(v_scan_limit - v_scan_used, 0)
    ),
    'total', json_build_object(
      'used', v_total_used,
      'limit', v_total_limit,
      'remaining', greatest(v_total_limit - v_total_used, 0)
    )
  );
end;
$$;

revoke all on function public.consume_ai_usage(text) from public, anon;
revoke all on function public.refund_ai_usage(uuid) from public, anon;
revoke all on function public.get_ai_usage_summary() from public, anon;
grant execute on function public.consume_ai_usage(text) to authenticated;
grant execute on function public.refund_ai_usage(uuid) to authenticated;
grant execute on function public.get_ai_usage_summary() to authenticated;
