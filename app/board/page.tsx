import { createClient } from '@/lib/supabaseServer'
import { NoteComposer } from '@/components/NoteComposer'
import { NoteCard } from '@/components/NoteCard'
import { LogoutButton } from '@/components/LogoutButton'
import type { Note, NoteWithAuthor, Profile } from '@/types/database'

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

  const authorIds = [...new Set((rawNotes ?? []).map((n) => n.author_id))]
  const { data: authors } = authorIds.length
    ? await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', authorIds)
        .returns<Pick<Profile, 'id' | 'username' | 'display_name'>[]>()
    : { data: [] }

  const authorById = new Map((authors ?? []).map((a) => [a.id, a]))
  const notes: NoteWithAuthor[] = (rawNotes ?? []).map((note) => {
    const author = authorById.get(note.author_id)
    return {
      ...note,
      profiles: author
        ? { username: author.username, display_name: author.display_name }
        : null,
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
              {notes.length} 条留言
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

          <div className="mt-14 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => {
              const imageUrl = note.image_path
                ? supabase.storage.from('note-images').getPublicUrl(note.image_path).data.publicUrl
                : null

              return (
                <NoteCard key={note.id} note={note} imageUrl={imageUrl} currentUserId={user!.id} />
              )
            })}

            {notes.length === 0 && (
              <div className="note-paper col-span-full mx-auto w-full max-w-xs rotate-2 bg-yellow-200 p-6 pt-8 text-center font-note text-xl text-zinc-600">
                <span className="magnet absolute -top-3.5 left-1/2 h-8 w-8 -translate-x-1/2" />
                还没有留言，写下第一条吧！
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
