import { createClient } from '@/lib/supabaseServer'
import { NoteComposer } from '@/components/NoteComposer'
import { NoteCard } from '@/components/NoteCard'
import { LogoutButton } from '@/components/LogoutButton'
import type { NoteWithAuthor } from '@/types/database'

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

  const { data: notes } = await supabase
    .from('notes')
    .select('*, profiles(username, display_name)')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .returns<NoteWithAuthor[]>()

  return (
    <div className="min-h-full flex-1 bg-amber-50 pb-16">
      <header className="flex items-center justify-between border-b border-amber-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-zinc-800">🧲 家庭留言贴</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500">你好，{profile?.display_name ?? '家人'}</span>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <NoteComposer />

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {notes?.map((note) => {
            const imageUrl = note.image_path
              ? supabase.storage.from('note-images').getPublicUrl(note.image_path).data.publicUrl
              : null

            return (
              <NoteCard key={note.id} note={note} imageUrl={imageUrl} currentUserId={user!.id} />
            )
          })}

          {notes?.length === 0 && (
            <p className="col-span-full text-center text-zinc-400">
              还没有留言，写下第一条吧！
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
