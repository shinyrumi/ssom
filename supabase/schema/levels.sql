-- Progressive level schema draft

create type if not exists public.profile_level as enum ('L1', 'L2', 'L3', 'L4');

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  nickname text not null,
  avatar_preset text not null,
  current_level profile_level not null default 'L1',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profile_levels (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  level profile_level not null,
  data jsonb not null default '{}'::jsonb,
  unlocked_at timestamptz not null default timezone('utc', now()),
  constraint profile_levels_pk primary key (profile_id, level)
);

create table if not exists public.level_progress (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  xp integer not null default 0,
  last_activity timestamptz,
  next_unlock_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profile_views (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  level_exposed profile_level not null,
  viewed_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.level_boosters (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  boost_type text not null,
  multiplier numeric(4,2) not null default 1.00,
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.level_unlock_audit (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  level profile_level not null,
  unlocked_at timestamptz not null default timezone('utc', now()),
  context jsonb not null default '{}'::jsonb
);

create or replace function public.level_to_rank(level profile_level)
returns int language sql stable as $$
  select coalesce(array_position(enum_range(null::profile_level), level), 0);
$$;

create or replace function public.calculate_reciprocal_level(viewer uuid, target uuid)
returns profile_level language sql stable as $$
  select case
           when public.level_to_rank(v.current_level) <= public.level_to_rank(t.current_level)
             then v.current_level
           else t.current_level
         end as reciprocal_level
  from public.profiles v, public.profiles t
  where v.id = viewer and t.id = target;
$$;

alter table public.profiles enable row level security;
alter table public.profile_levels enable row level security;
alter table public.level_progress enable row level security;
alter table public.profile_views enable row level security;
alter table public.level_boosters enable row level security;
alter table public.level_unlock_audit enable row level security;

create or replace function public.ensure_policy(
  policy_name text,
  relation regclass,
  policy_sql text
) returns void language plpgsql as $$
begin
  if not exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'public' and policyname = policy_name and tablename = relation::text
  ) then
    execute policy_sql;
  end if;
end;
$$;

select public.ensure_policy(
  'profiles_select_self',
  'profiles',
  $$create policy profiles_select_self on public.profiles for select using (auth.uid() = id);$$
);

select public.ensure_policy(
  'profiles_insert_self',
  'profiles',
  $$create policy profiles_insert_self on public.profiles for insert with check (auth.uid() = id);$$
);

select public.ensure_policy(
  'profiles_update_self',
  'profiles',
  $$create policy profiles_update_self on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);$$
);

select public.ensure_policy(
  'profiles_delete_self',
  'profiles',
  $$create policy profiles_delete_self on public.profiles for delete using (auth.uid() = id);$$
);

select public.ensure_policy(
  'profile_levels_select_self',
  'profile_levels',
  $$create policy profile_levels_select_self on public.profile_levels for select using (auth.uid() = profile_id);$$
);

select public.ensure_policy(
  'profile_levels_modify_self',
  'profile_levels',
  $$create policy profile_levels_modify_self on public.profile_levels for insert with check (auth.uid() = profile_id);$$
);

select public.ensure_policy(
  'profile_levels_update_self',
  'profile_levels',
  $$create policy profile_levels_update_self on public.profile_levels for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);$$
);

select public.ensure_policy(
  'profile_levels_delete_self',
  'profile_levels',
  $$create policy profile_levels_delete_self on public.profile_levels for delete using (auth.uid() = profile_id);$$
);

select public.ensure_policy(
  'level_progress_select_self',
  'level_progress',
  $$create policy level_progress_select_self on public.level_progress for select using (auth.uid() = profile_id);$$
);

select public.ensure_policy(
  'level_progress_insert_self',
  'level_progress',
  $$create policy level_progress_insert_self on public.level_progress for insert with check (auth.uid() = profile_id);$$
);

select public.ensure_policy(
  'level_progress_update_self',
  'level_progress',
  $$create policy level_progress_update_self on public.level_progress for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);$$
);

select public.ensure_policy(
  'level_progress_delete_self',
  'level_progress',
  $$create policy level_progress_delete_self on public.level_progress for delete using (auth.uid() = profile_id);$$
);

select public.ensure_policy(
  'profile_views_select_self',
  'profile_views',
  $$create policy profile_views_select_self on public.profile_views for select using (auth.uid() = viewer_id or auth.uid() = target_id);$$
);

select public.ensure_policy(
  'profile_views_insert_self',
  'profile_views',
  $$create policy profile_views_insert_self on public.profile_views for insert with check (auth.uid() = viewer_id);$$
);

select public.ensure_policy(
  'profile_views_delete_self',
  'profile_views',
  $$create policy profile_views_delete_self on public.profile_views for delete using (auth.uid() = viewer_id);$$
);

select public.ensure_policy(
  'level_boosters_select_self',
  'level_boosters',
  $$create policy level_boosters_select_self on public.level_boosters for select using (auth.uid() = profile_id);$$
);

select public.ensure_policy(
  'level_boosters_insert_self',
  'level_boosters',
  $$create policy level_boosters_insert_self on public.level_boosters for insert with check (auth.uid() = profile_id);$$
);

select public.ensure_policy(
  'level_boosters_update_self',
  'level_boosters',
  $$create policy level_boosters_update_self on public.level_boosters for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);$$
);

select public.ensure_policy(
  'level_boosters_delete_self',
  'level_boosters',
  $$create policy level_boosters_delete_self on public.level_boosters for delete using (auth.uid() = profile_id);$$
);

select public.ensure_policy(
  'level_unlock_audit_select_self',
  'level_unlock_audit',
  $$create policy level_unlock_audit_select_self on public.level_unlock_audit for select using (auth.uid() = profile_id);$$
);

select public.ensure_policy(
  'level_unlock_audit_insert_self',
  'level_unlock_audit',
  $$create policy level_unlock_audit_insert_self on public.level_unlock_audit for insert with check (auth.uid() = profile_id);$$
);

-- TODO: add moderator roles and admin bypass policies later.
