'use client'

import { useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { COLOR_OPTIONS, COLOR_SWATCH } from '@/lib/colors'
import type { NoteColor } from '@/types/database'

const EXPIRY_OPTIONS: { label: string; days: number | null }[] = [
  { label: '永久保留', days: null },
  { label: '1 天后消失', days: 1 },
  { label: '3 天后消失', days: 3 },
  { label: '7 天后消失', days: 7 },
]

export function NoteComposer() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [content, setContent] = useState('')
  const [color, setColor] = useState<NoteColor>('yellow')
  const [expiryDays, setExpiryDays] = useState<number | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

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

    const { error: insertError } = await supabase.from('notes').insert({
      author_id: user.id,
      content: content.trim() || null,
      color,
      image_path: imagePath,
      expires_at: expiresAt,
    })

    if (insertError) {
      setError(insertError.message)
      setPending(false)
      return
    }

    setContent('')
    setColor('yellow')
    setExpiryDays(null)
    setImageFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setPending(false)
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-xl flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="给家人留句话吧…"
        rows={3}
        className="w-full resize-none rounded-lg border border-zinc-300 p-3"
      />

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c}
              className={`h-6 w-6 rounded-full border-2 ${COLOR_SWATCH[c]} ${
                color === c ? 'border-zinc-800' : 'border-transparent'
              }`}
            />
          ))}
        </div>

        <select
          value={expiryDays ?? ''}
          onChange={(e) => setExpiryDays(e.target.value ? Number(e.target.value) : null)}
          className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
        >
          {EXPIRY_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.days ?? ''}>
              {opt.label}
            </option>
          ))}
        </select>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-end rounded-lg bg-amber-500 px-5 py-2 font-medium text-white hover:bg-amber-600 disabled:opacity-50"
      >
        {pending ? '发布中…' : '贴上留言'}
      </button>
    </form>
  )
}
