-- Progressive level schema draft

create type public.profile_level as enum ('L1', 'L2', 'L3', 'L4');

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
  data jsonb not null default '{}',
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
  metadata jsonb not null default '{}',
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.level_unlock_audit (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  level profile_level not null,
  unlocked_at timestamptz not null default timezone('utc', now()),
  context jsonb not null default '{}'
);

-- helper: ordinal rank for comparing enum values
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

-- RLS policies
create policy profiles_self_access on public.profiles
  for select using (auth.uid() = id)
  with check (auth.uid() = id);

create policy profile_levels_owner_policy on public.profile_levels
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy level_progress_owner_policy on public.level_progress
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy profile_views_owner_or_target on public.profile_views
  for select using (auth.uid() = viewer_id or auth.uid() = target_id);

create policy profile_views_owner_insert on public.profile_views
  for insert with check (auth.uid() = viewer_id);

create policy level_boosters_owner_policy on public.level_boosters
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy level_unlock_audit_owner_select on public.level_unlock_audit
  for select using (auth.uid() = profile_id);

create policy level_unlock_audit_owner_insert on public.level_unlock_audit
  for insert with check (auth.uid() = profile_id);

-- TODO: add moderator roles and admin bypass policies later.
