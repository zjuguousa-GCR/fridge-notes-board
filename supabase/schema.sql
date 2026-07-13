-- Family Fridge Notes Board — paste this whole file into the Supabase SQL Editor and run it.

-- profiles: maps an auth user to a display name
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- notes: the sticky notes themselves
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  content text,
  color text not null default 'yellow'
    check (color in ('yellow', 'pink', 'blue', 'green', 'purple', 'orange')),
  image_path text,
  expires_at timestamptz,
  music text,
  created_at timestamptz not null default now(),
  constraint content_or_image check (content is not null or image_path is not null)
);

alter table public.notes enable row level security;

create policy "authenticated users see all notes"
  on public.notes for select
  to authenticated
  using (true);

create policy "users insert their own notes"
  on public.notes for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "users delete only their own notes"
  on public.notes for delete
  to authenticated
  using (auth.uid() = author_id);

-- note_replies: small handwritten replies under a note
create table public.note_replies (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.note_replies enable row level security;

create policy "authenticated users see all replies"
  on public.note_replies for select
  to authenticated
  using (true);

create policy "users insert their own replies"
  on public.note_replies for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "users delete only their own replies"
  on public.note_replies for delete
  to authenticated
  using (auth.uid() = author_id);

-- storage bucket for note images
insert into storage.buckets (id, name, public)
values ('note-images', 'note-images', true)
on conflict (id) do nothing;

create policy "authenticated users upload images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'note-images');

create policy "anyone can view note images"
  on storage.objects for select
  using (bucket_id = 'note-images');

create policy "users delete their own images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'note-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- Optional fast-follow (not required for v1): server-side cleanup of expired notes.
-- Requires enabling the pg_cron extension in the Supabase dashboard first.
-- select cron.schedule('cleanup-expired-notes', '0 3 * * *',
--   $$ delete from public.notes where expires_at is not null and expires_at < now(); $$);
