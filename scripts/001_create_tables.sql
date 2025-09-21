-- Añadiendo tablas para categorías y gamificación
-- Create profiles table for user management
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create categories table for different license types
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  total_tests integer not null default 100,
  questions_per_test integer not null default 30,
  time_limit_minutes integer not null default 30,
  pass_threshold integer not null default 27,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create test_results table to track user test attempts
create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_code text not null references public.categories(code),
  test_pack text not null,
  score integer not null,
  total_questions integer not null default 30,
  passed boolean not null,
  test_mode text not null default 'exam', -- 'exam' or 'study'
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_gamification table for tracking points, levels, etc.
create table if not exists public.user_gamification (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_code text not null references public.categories(code),
  level integer not null default 1,
  total_points integer not null default 0,
  tests_completed integer not null default 0,
  tests_passed integer not null default 0,
  perfect_scores integer not null default 0,
  streak_days integer not null default 0,
  last_activity timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, category_code)
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.test_results enable row level security;
alter table public.user_gamification enable row level security;

-- Profiles policies
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Categories policies (public read)
create policy "categories_select_all"
  on public.categories for select
  to authenticated
  using (true);

-- Test results policies
create policy "test_results_select_own"
  on public.test_results for select
  using (auth.uid() = user_id);

create policy "test_results_insert_own"
  on public.test_results for insert
  with check (auth.uid() = user_id);

create policy "test_results_update_own"
  on public.test_results for update
  using (auth.uid() = user_id);

create policy "test_results_delete_own"
  on public.test_results for delete
  using (auth.uid() = user_id);

-- User gamification policies
create policy "user_gamification_select_own"
  on public.user_gamification for select
  using (auth.uid() = user_id);

create policy "user_gamification_insert_own"
  on public.user_gamification for insert
  with check (auth.uid() = user_id);

create policy "user_gamification_update_own"
  on public.user_gamification for update
  using (auth.uid() = user_id);
