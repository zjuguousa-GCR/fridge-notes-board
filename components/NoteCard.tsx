'use client'

import { useState, type CSSProperties, type FormEvent, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { COLOR_STYLES, noteDecor } from '@/lib/colors'
import { musicLabel } from '@/lib/music'
import type { NoteWithAuthor, ReplyWithAuthor } from '@/types/database'

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
  replies = [],
  currentUserId,
  selected = false,
  onSelect,
}: {
  note: NoteWithAuthor
  imageUrl: string | null
  replies?: ReplyWithAuthor[]
  currentUserId: string
  selected?: boolean
  onSelect?: () => void
}) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)
  const isOwner = note.author_id === currentUserId
  const authorLabel = note.profiles?.display_name ?? note.profiles?.username ?? '家人'
  const { tilt, magnetColor } = noteDecor(note.id)

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('notes').delete().eq('id', note.id)
    router.refresh()
  }

  async function handleReply(e: FormEvent) {
    e.preventDefault()
    const text = replyText.trim()
    if (!text) return
    setReplying(true)
    setReplyError(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setReplyError('登录状态已过期，请重新登录')
      setReplying(false)
      return
    }

    const { error } = await supabase.from('note_replies').insert({
      note_id: note.id,
      author_id: user.id,
      content: text,
    })

    if (error) {
      setReplyError('回复失败，请重试')
    } else {
      setReplyText('')
      router.refresh()
    }
    setReplying(false)
  }

  async function handleDeleteReply(replyId: string) {
    const supabase = createClient()
    await supabase.from('note_replies').delete().eq('id', replyId)
    router.refresh()
  }

  // 点便签本体切换背景音乐；点按钮/输入框等交互元素时不触发
  function handleCardClick(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('button, input, textarea, a, select')) return
    onSelect?.()
  }

  return (
    <div className="note-wrap" style={{ '--tilt': `${tilt}deg` } as CSSProperties}>
      <div
        onClick={handleCardClick}
        className={`note-paper flex min-h-36 cursor-pointer flex-col gap-2 p-4 pt-6 ${COLOR_STYLES[note.color]} ${
          selected ? 'ring-2 ring-red-500/60' : ''
        }`}
      >
        <span
          aria-hidden
          className="magnet absolute -top-3.5 left-1/2 h-8 w-8 -translate-x-1/2"
          style={{ '--magnet-color': magnetColor } as CSSProperties}
        />

        {note.music && (
          <span
            className="absolute left-2 top-1.5 text-sm"
            title={`背景音乐：${musicLabel(note.music) ?? ''}`}
          >
            🎵
          </span>
        )}

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

        <div className="flex items-end justify-between gap-2 pt-1 font-note">
          <span className="text-lg text-zinc-700">—— {authorLabel}</span>
          <span className="text-sm text-zinc-500">{formatTimestamp(note.created_at)}</span>
        </div>

        {/* 家人的追写回复，像纸条上补的小字 */}
        {replies.length > 0 && (
          <div className="mt-1 space-y-1 border-t border-dashed border-black/15 pt-2">
            {replies.map((reply) => (
              <div
                key={reply.id}
                className="flex items-start justify-between gap-1 font-note text-base leading-snug text-zinc-700"
              >
                <span title={formatTimestamp(reply.created_at)}>
                  {reply.content}
                  <span className="ml-1 text-sm text-zinc-500">—— {reply.authorName}</span>
                </span>
                {reply.author_id === currentUserId && (
                  <button
                    onClick={() => handleDeleteReply(reply.id)}
                    aria-label="删除回复"
                    className="shrink-0 text-sm leading-none text-zinc-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleReply} className="mt-auto flex items-center gap-1 pt-1">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="回复一句…"
            className="w-full rounded-md bg-white/45 px-2 py-1 font-note text-base text-zinc-800 placeholder:text-zinc-500/60 focus:bg-white/70 focus:outline-none"
          />
          <button
            type="submit"
            disabled={replying || !replyText.trim()}
            aria-label="发送回复"
            className="shrink-0 rounded-md px-1.5 py-1 text-base text-zinc-600 hover:text-red-600 disabled:opacity-40"
          >
            ↩
          </button>
        </form>

        {replyError && <p className="text-xs text-red-600">{replyError}</p>}
      </div>
    </div>
  )
}
