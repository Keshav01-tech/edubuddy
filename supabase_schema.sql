-- Supabase Database Schema for NCERT Curriculum Study Assistant

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Create a profile trigger on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Student'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. STUDY SESSIONS TABLE (replaces documents)
create table public.study_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  class_name text not null,       -- e.g. 'Class 10'
  subject_name text not null,     -- e.g. 'Science'
  chapter_name text not null,     -- e.g. 'Life Processes'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for study_sessions
alter table public.study_sessions enable row level security;

create policy "Users can perform all actions on own sessions" on public.study_sessions
  for all using (auth.uid() = user_id);


-- 3. CHATS TABLE
create table public.chats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  session_id uuid references public.study_sessions on delete cascade not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for chats
alter table public.chats enable row level security;

create policy "Users can perform all actions on own chats" on public.chats
  for all using (auth.uid() = user_id);


-- 4. MESSAGES TABLE
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references public.chats on delete cascade not null,
  role text not null check (role in ('user', 'model')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for messages
alter table public.messages enable row level security;

create policy "Users can perform all actions on own chat messages" on public.messages
  for all using (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id and chats.user_id = auth.uid()
    )
  );


-- 5. NOTES TABLE
create table public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  session_id uuid references public.study_sessions on delete cascade not null,
  content jsonb not null, -- Stores headings, bullet points, key concepts, definitions, formulas
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for notes
alter table public.notes enable row level security;

create policy "Users can perform all actions on own notes" on public.notes
  for all using (auth.uid() = user_id);


-- 6. QUIZZES TABLE
create table public.quizzes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  session_id uuid references public.study_sessions on delete cascade not null,
  questions jsonb not null, -- Stores MCQ, Short Answer, True/False, Fill-in-the-blanks
  answers jsonb, -- Stores user selected/written answers
  score integer,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for quizzes
alter table public.quizzes enable row level security;

create policy "Users can perform all actions on own quizzes" on public.quizzes
  for all using (auth.uid() = user_id);


-- 7. FLASHCARDS TABLE
create table public.flashcards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  session_id uuid references public.study_sessions on delete cascade not null,
  cards jsonb not null, -- Stores arrays of {question, answer}
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for flashcards
alter table public.flashcards enable row level security;

create policy "Users can perform all actions on own flashcards" on public.flashcards
  for all using (auth.uid() = user_id);
