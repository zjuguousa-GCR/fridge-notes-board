import type { NoteColor } from '@/types/database'

export const COLOR_OPTIONS: NoteColor[] = ['yellow', 'pink', 'blue', 'green', 'purple', 'orange']

export const COLOR_STYLES: Record<NoteColor, string> = {
  yellow: 'bg-yellow-200 border-yellow-300 rotate-[-1deg]',
  pink: 'bg-pink-200 border-pink-300 rotate-[1deg]',
  blue: 'bg-sky-200 border-sky-300 rotate-[-1deg]',
  green: 'bg-green-200 border-green-300 rotate-[1deg]',
  purple: 'bg-purple-200 border-purple-300 rotate-[-1deg]',
  orange: 'bg-orange-200 border-orange-300 rotate-[1deg]',
}

export const COLOR_SWATCH: Record<NoteColor, string> = {
  yellow: 'bg-yellow-300',
  pink: 'bg-pink-300',
  blue: 'bg-sky-300',
  green: 'bg-green-300',
  purple: 'bg-purple-300',
  orange: 'bg-orange-300',
}
