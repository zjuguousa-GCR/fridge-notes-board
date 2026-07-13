'use client'

import { useEffect, useState } from 'react'
import { NoteCard } from '@/components/NoteCard'
import { musicLabel, playTrack, stopTrack } from '@/lib/music'
import type { NoteWithAuthor, ReplyWithAuthor } from '@/types/database'

export interface BoardItem {
  note: NoteWithAuthor
  imageUrl: string | null
  replies: ReplyWithAuthor[]
}

export function NotesBoard({
  items,
  currentUserId,
}: {
  items: BoardItem[]
  currentUserId: string
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)
  // 浏览器禁止未经用户交互就自动播放声音，所以要等第一次触碰页面
  const [started, setStarted] = useState(false)

  const selected = selectedId ? items.find((i) => i.note.id === selectedId) : undefined
  // 未点击任何便签时，播放最新一条带音乐的留言（items 已按时间倒序）
  const fallback = items.find((i) => i.note.music)
  const activeMusic = (selected ? selected.note.music : fallback?.note.music) ?? null
  const activeLabel = musicLabel(activeMusic)

  useEffect(() => {
    const onFirstTouch = () => setStarted(true)
    window.addEventListener('pointerdown', onFirstTouch, { once: true })
    return () => window.removeEventListener('pointerdown', onFirstTouch)
  }, [])

  useEffect(() => {
    if (!started || muted) {
      stopTrack()
      return
    }
    playTrack(activeMusic)
  }, [activeMusic, muted, started])

  useEffect(() => () => stopTrack(), [])

  return (
    <>
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          className="led-display rounded-md px-3 py-1.5 font-mono text-xs"
        >
          {muted
            ? '🔇 音乐已关'
            : activeMusic
              ? `🔊 ♪ ${activeLabel}${selected ? '' : '（最新留言）'}`
              : '🔊 点一张带 🎵 的便签听音乐'}
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ note, imageUrl, replies }) => (
          <NoteCard
            key={note.id}
            note={note}
            imageUrl={imageUrl}
            replies={replies}
            currentUserId={currentUserId}
            selected={note.id === selectedId}
            onSelect={() => setSelectedId(note.id)}
          />
        ))}

        {items.length === 0 && (
          <div className="note-paper col-span-full mx-auto w-full max-w-xs rotate-2 bg-yellow-200 p-6 pt-8 text-center font-note text-xl text-zinc-600">
            <span className="magnet absolute -top-3.5 left-1/2 h-8 w-8 -translate-x-1/2" />
            还没有留言，写下第一条吧！
          </div>
        )}
      </div>
    </>
  )
}
