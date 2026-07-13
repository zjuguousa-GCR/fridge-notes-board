'use client'

import { useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { COLOR_STYLES, noteDecor } from '@/lib/colors'
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
  const { tilt, magnetColor } = noteDecor(note.id)

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('notes').delete().eq('id', note.id)
    router.refresh()
  }

  return (
    <div className="note-wrap" style={{ '--tilt': `${tilt}deg` } as CSSProperties}>
      <div
        className={`note-paper flex min-h-36 flex-col gap-2 p-4 pt-6 ${COLOR_STYLES[note.color]}`}
      >
        <span
          aria-hidden
          className="magnet absolute -top-3.5 left-1/2 h-8 w-8 -translate-x-1/2"
          style={{ '--magnet-color': magnetColor } as CSSProperties}
        />

        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            aria-label="删除留言"
            className="absolute right-2 top-1.5 text-lg leading-none text-zinc-500/70 hover:text-red-600 disabled:opacity-50"
          >
            ✕
          </button>
        )}

        {note.content && (
          <p className="whitespace-pre-wrap pr-4 font-note text-xl leading-relaxed text-zinc-800">
            {note.content}
          </p>
        )}

        {imageUrl && (
          <div className="rotate-1 self-center bg-white p-1.5 pb-5 shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="留言图片" className="max-h-56 w-full object-cover" />
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-1 font-note">
          <span className="text-lg text-zinc-700">—— {authorLabel}</span>
          <span className="text-sm text-zinc-500">{formatTimestamp(note.created_at)}</span>
        </div>
      </div>
    </div>
  )
}
