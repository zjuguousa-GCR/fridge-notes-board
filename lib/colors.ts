import type { NoteColor } from '@/types/database'

export const COLOR_OPTIONS: NoteColor[] = ['yellow', 'pink', 'blue', 'green', 'purple', 'orange']

// 便签纸底色（倾斜角度由 noteTilt 按 id 决定，不在这里写死）
export const COLOR_STYLES: Record<NoteColor, string> = {
  yellow: 'bg-yellow-200',
  pink: 'bg-pink-200',
  blue: 'bg-sky-200',
  green: 'bg-green-200',
  purple: 'bg-purple-200',
  orange: 'bg-orange-200',
}

export const COLOR_SWATCH: Record<NoteColor, string> = {
  yellow: 'bg-yellow-300',
  pink: 'bg-pink-300',
  blue: 'bg-sky-300',
  green: 'bg-green-300',
  purple: 'bg-purple-300',
  orange: 'bg-orange-300',
}

// 冰箱贴磁铁的颜色，按留言 id 轮换
export const MAGNET_COLORS = ['#e5484d', '#3573e6', '#12a594', '#f59e0b', '#8b5cf6', '#e93d82']

function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** 由留言 id 决定的固定倾斜角（-3° ~ 3°）与磁铁颜色，保证服务端/客户端渲染一致 */
export function noteDecor(id: string) {
  const h = hashCode(id)
  const tilt = (h % 7) - 3
  return {
    tilt: tilt === 0 ? 1.5 : tilt,
    magnetColor: MAGNET_COLORS[h % MAGNET_COLORS.length],
  }
}
