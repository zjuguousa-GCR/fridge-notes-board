import { createClient } from '@/lib/supabaseServer'
import { NoteComposer } from '@/components/NoteComposer'
import { NotesBoard, type BoardItem } from '@/components/NotesBoard'
import { LogoutButton } from '@/components/LogoutButton'
import type { Note, NoteReply, Profile, ReplyWithAuthor } from '@/types/database'

export default async function BoardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user!.id)
    .single()

  // notes.author_id 的外键指向 auth.users 而非 profiles，无法用 PostgREST 关联查询，
  // 因此分两次查询后在这里合并作者信息。
  const { data: rawNotes } = await supabase
    .from('notes')
    .select('*')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .returns<Note[]>()

  // 便签下的回复（数据库尚未运行迁移时表不存在，data 为 null，按无回复处理）
  const noteIds = (rawNotes ?? []).map((n) => n.id)
  const { data: rawReplies } = noteIds.length
    ? await supabase
        .from('note_replies')
        .select('*')
        .in('note_id', noteIds)
        .order('created_at', { ascending: true })
        .returns<NoteReply[]>()
    : { data: [] as NoteReply[] }

  const authorIds = [
    ...new Set([
      ...(rawNotes ?? []).map((n) => n.author_id),
      ...(rawReplies ?? []).map((r) => r.author_id),
    ]),
  ]
  const { data: authors } = authorIds.length
    ? await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', authorIds)
        .returns<Pick<Profile, 'id' | 'username' | 'display_name'>[]>()
    : { data: [] }

  const authorById = new Map((authors ?? []).map((a) => [a.id, a]))

  const repliesByNote = new Map<string, ReplyWithAuthor[]>()
  for (const reply of rawReplies ?? []) {
    const author = authorById.get(reply.author_id)
    const list = repliesByNote.get(reply.note_id) ?? []
    list.push({ ...reply, authorName: author?.display_name ?? author?.username ?? '家人' })
    repliesByNote.set(reply.note_id, list)
  }

  const items: BoardItem[] = (rawNotes ?? []).map((note) => {
    const author = authorById.get(note.author_id)
    return {
      note: {
        ...note,
        profiles: author
          ? { username: author.username, display_name: author.display_name }
          : null,
      },
      imageUrl: note.image_path
        ? supabase.storage.from('note-images').getPublicUrl(note.image_path).data.publicUrl
        : null,
      replies: repliesByNote.get(note.id) ?? [],
    }
  })

  return (
    <div className="kitchen-wall min-h-full flex-1 px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        {/* 冷冻室门（顶部小门） */}
        <header className="fridge-door brushed-steel relative mb-2.5 flex items-center justify-between gap-3 rounded-t-3xl rounded-b-lg py-5 pl-10 pr-4 sm:pl-16 sm:pr-7">
          <div className="fridge-handle absolute left-3 top-1/2 h-14 w-2.5 -translate-y-1/2 sm:left-6 sm:w-3" />
          <h1 className="engraved text-lg font-bold tracking-wide sm:text-xl">🧲 家庭留言贴</h1>
          <div className="flex items-center gap-3">
            <span className="led-display rounded-md px-2.5 py-1 font-mono text-xs">
              {items.length} 条留言
            </span>
            <span className="hidden text-sm text-zinc-600 sm:inline">
              你好，{profile?.display_name ?? '家人'}
            </span>
            <LogoutButton />
          </div>
        </header>

        {/* 冷藏室门（主门），留言都贴在这里 */}
        <main className="fridge-door brushed-steel relative rounded-t-lg rounded-b-3xl px-6 pb-20 pt-12 sm:px-12">
          <div className="fridge-handle absolute left-3 top-12 h-44 w-2.5 sm:left-6 sm:w-3" />

          <NoteComposer />

          <NotesBoard items={items} currentUserId={user!.id} />
        </main>
      </div>
    </div>
  )
}
