'use client'

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { COLOR_OPTIONS, COLOR_STYLES, COLOR_SWATCH } from '@/lib/colors'
import { MUSIC_TRACKS, playTrack, stopTrack } from '@/lib/music'
import type { NoteColor } from '@/types/database'

const EXPIRY_OPTIONS: { label: string; days: number | null }[] = [
  { label: '永久保留', days: null },
  { label: '1 天后消失', days: 1 },
  { label: '3 天后消失', days: 3 },
  { label: '7 天后消失', days: 7 },
]

const EMOJIS = ['😀', '🥰', '😘', '😂', '😎', '🤗', '😴', '🥳', '😭', '❤️', '👍', '🙏', '🎉', '🌟', '🍰', '🏠']

export function NoteComposer() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [content, setContent] = useState('')
  const [color, setColor] = useState<NoteColor>('yellow')
  const [expiryDays, setExpiryDays] = useState<number | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [music, setMusic] = useState('')
  const [previewing, setPreviewing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  // 离开页面时停掉试听
  useEffect(() => () => stopTrack(), [])

  function insertEmoji(emoji: string) {
    const el = textareaRef.current
    if (!el) {
      setContent((c) => c + emoji)
      return
    }
    const start = el.selectionStart ?? content.length
    const end = el.selectionEnd ?? start
    setContent(content.slice(0, start) + emoji + content.slice(end))
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + emoji.length
      el.setSelectionRange(pos, pos)
    })
  }

  function togglePreview() {
    if (previewing) {
      stopTrack()
      setPreviewing(false)
    } else if (music) {
      playTrack(music)
      setPreviewing(true)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!content.trim() && !imageFile) {
      setError('请写点什么或上传一张图片')
      return
    }

    setPending(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('登录状态已过期，请重新登录')
      setPending(false)
      return
    }

    let imagePath: string | null = null

    if (imageFile) {
      const ext = imageFile.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('note-images')
        .upload(path, imageFile)

      if (uploadError) {
        setError(uploadError.message)
        setPending(false)
        return
      }
      imagePath = path
    }

    const expiresAt = expiryDays
      ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString()
      : null

    const payload: Record<string, unknown> = {
      author_id: user.id,
      content: content.trim() || null,
      color,
      image_path: imagePath,
      expires_at: expiresAt,
    }
    if (music) payload.music = music

    const { error: insertError } = await supabase.from('notes').insert(payload)

    if (insertError) {
      setError(insertError.message)
      setPending(false)
      return
    }

    if (previewing) {
      stopTrack()
      setPreviewing(false)
    }
    setContent('')
    setColor('yellow')
    setExpiryDays(null)
    setImageFile(null)
    setMusic('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    setPending(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md -rotate-1">
      {/* 写留言 = 直接在一张便签纸上写字，选什么颜色纸就变什么颜色 */}
      <div className={`note-paper flex flex-col gap-3 p-5 pt-8 ${COLOR_STYLES[color]}`}>
        <span
          aria-hidden
          className="magnet absolute -top-4 left-1/2 h-9 w-9 -translate-x-1/2"
          style={{ '--magnet-color': '#e5484d' } as CSSProperties}
        />

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="给家人留句话吧…"
          rows={3}
          className="w-full resize-none bg-transparent font-note text-xl leading-relaxed text-zinc-800 placeholder:text-zinc-500/60 focus:outline-none"
        />

        <div className="flex flex-wrap gap-0.5" role="group" aria-label="插入表情">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => insertEmoji(emoji)}
              className="rounded p-0.5 text-lg leading-none transition-transform hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2" role="group" aria-label="便签颜色">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={c}
                className={`h-6 w-6 rounded-full border shadow-sm transition-transform ${COLOR_SWATCH[c]} ${
                  color === c
                    ? 'scale-115 border-zinc-700 ring-2 ring-zinc-700/40'
                    : 'border-black/10'
                }`}
              />
            ))}
          </div>

          <select
            value={expiryDays ?? ''}
            onChange={(e) => setExpiryDays(e.target.value ? Number(e.target.value) : null)}
            className="rounded-md border border-black/10 bg-white/70 px-2 py-1 text-sm text-zinc-700"
          >
            {EXPIRY_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.days ?? ''}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            <select
              value={music}
              onChange={(e) => {
                setMusic(e.target.value)
                if (previewing) {
                  if (e.target.value) playTrack(e.target.value)
                  else {
                    stopTrack()
                    setPreviewing(false)
                  }
                }
              }}
              className="rounded-md border border-black/10 bg-white/70 px-2 py-1 text-sm text-zinc-700"
            >
              <option value="">无背景音乐</option>
              {MUSIC_TRACKS.map((track) => (
                <option key={track.id} value={track.id}>
                  ♪ {track.label}
                </option>
              ))}
            </select>
            {music && (
              <button
                type="button"
                onClick={togglePreview}
                aria-label={previewing ? '停止试听' : '试听'}
                className="rounded-md border border-black/10 bg-white/70 px-2 py-1 text-sm text-zinc-700 hover:text-red-600"
              >
                {previewing ? '■' : '▶'}
              </button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="text-xs text-zinc-600 file:mr-2 file:rounded-full file:border-0 file:bg-white/80 file:px-3 file:py-1 file:text-xs file:text-zinc-700"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="magnet-btn self-end rounded-full px-6 py-2 font-medium text-white disabled:opacity-50"
        >
          {pending ? '发布中…' : '贴上留言'}
        </button>
      </div>
    </form>
  )
}
