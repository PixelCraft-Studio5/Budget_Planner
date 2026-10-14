create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  budget jsonb not null default '{
    "workIncome": 0,
    "sideHustleIncome": 0,
    "savingTarget": 0,
    "emergencyFund": 0,
    "expenses": []
  }'::jsonb,
  profile jsonb not null default '{}'::jsonb
);

alter table public.user_data enable row level security;

grant select, insert, update on public.user_data to authenticated;
revoke all on public.user_data from anon;

drop policy if exists "Users can read their own data"
  on public.user_data;
drop policy if exists "Users can create their own data"
  on public.user_data;
drop policy if exists "Users can update their own data"
  on public.user_data;

create policy "Users can read their own data"
  on public.user_data
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own data"
  on public.user_data
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own data"
  on public.user_data
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
