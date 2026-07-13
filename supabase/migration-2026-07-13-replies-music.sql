-- 迁移：留言回复 + 背景音乐（2026-07-13）
-- 已经运行过 schema.sql 的现有数据库，请把本文件全部内容粘贴到 Supabase SQL Editor 运行一次。

-- notes 增加背景音乐列
alter table public.notes add column if not exists music text;

-- 便签回复表：家人可以在便签下追写小字回复
create table if not exists public.note_replies (
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
