'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { COLOR_STYLES } from '@/lib/colors'
import type { NoteWithAuthor } from '@/types/database'

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function NoteCard({
  note,
  imageUrl,
  currentUserId,
}: {
  note: NoteWithAuthor
  imageUrl: string | null
  currentUserId: string
}) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const isOwner = note.author_id === currentUserId
  const authorLabel = note.profiles?.display_name ?? note.profiles?.username ?? '家人'

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('notes').delete().eq('id', note.id)
    router.refresh()
  }

  return (
    <div
      className={`relative flex flex-col gap-2 rounded-sm border p-4 shadow-md transition-transform hover:scale-[1.02] ${COLOR_STYLES[note.color]}`}
    >
      {isOwner && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          aria-label="删除留言"
          className="absolute right-2 top-2 text-zinc-500 hover:text-red-600 disabled:opacity-50"
        >
          ✕
        </button>
      )}

      {note.content && (
        <p className="whitespace-pre-wrap pr-4 text-zinc-800">{note.content}</p>
      )}

      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="留言图片" className="rounded-md object-cover" />
      )}

      <div className="mt-auto flex items-center justify-between pt-2 text-xs text-zinc-600">
        <span>{authorLabel}</span>
        <span>{formatTimestamp(note.created_at)}</span>
      </div>
    </div>
  )
}
