-- Feed threads/comments/reactions schema and RLS policies

create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  published_at timestamptz not null default timezone('utc', now()),
  is_active boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  reactor_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'heart',
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.threads enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;

-- policy helpers
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
  'threads_select_public',
  'threads',
  $$create policy threads_select_public on public.threads for select using (true);$$
);

select public.ensure_policy(
  'comments_select_public',
  'comments',
  $$create policy comments_select_public on public.comments for select using (true);$$
);

select public.ensure_policy(
  'comments_insert_own',
  'comments',
  $$create policy comments_insert_own on public.comments for insert with check (auth.uid() = author_id);$$
);

select public.ensure_policy(
  'comments_update_own',
  'comments',
  $$create policy comments_update_own on public.comments for update using (auth.uid() = author_id) with check (auth.uid() = author_id);$$
);

select public.ensure_policy(
  'comments_delete_own',
  'comments',
  $$create policy comments_delete_own on public.comments for delete using (auth.uid() = author_id);$$
);

select public.ensure_policy(
  'reactions_select_public',
  'reactions',
  $$create policy reactions_select_public on public.reactions for select using (true);$$
);

select public.ensure_policy(
  'reactions_insert_own',
  'reactions',
  $$create policy reactions_insert_own on public.reactions for insert with check (auth.uid() = reactor_id);$$
);

select public.ensure_policy(
  'reactions_delete_own',
  'reactions',
  $$create policy reactions_delete_own on public.reactions for delete using (auth.uid() = reactor_id);$$
);

create index if not exists comments_thread_created_at_idx on public.comments (thread_id, created_at);
create unique index if not exists reactions_unique_heart on public.reactions (comment_id, reactor_id, type);
