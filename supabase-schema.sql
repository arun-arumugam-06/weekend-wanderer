-- Weekend Wanderer Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- Enable Row Level Security
alter default privileges revoke execute on functions from public;

-- Create users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create itineraries table
create table public.itineraries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  location text not null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  items jsonb not null default '[]'::jsonb,
  total_cost numeric(10,2) default 0,
  is_favorite boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.itineraries enable row level security;

-- Create policies
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

create policy "Users can view own itineraries" on public.itineraries
  for select using (auth.uid() = user_id);

create policy "Users can create own itineraries" on public.itineraries
  for insert with check (auth.uid() = user_id);

create policy "Users can update own itineraries" on public.itineraries
  for update using (auth.uid() = user_id);

create policy "Users can delete own itineraries" on public.itineraries
  for delete using (auth.uid() = user_id);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Create triggers for updated_at
create trigger handle_updated_at before update on public.users
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.itineraries
  for each row execute procedure public.handle_updated_at();

-- Insert user into public.users table automatically when they sign up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', 'User'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
