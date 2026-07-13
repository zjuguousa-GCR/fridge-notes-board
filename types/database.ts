export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange'

export interface Profile {
  id: string
  username: string
  display_name: string
  created_at: string
}

export interface Note {
  id: string
  author_id: string
  content: string | null
  color: NoteColor
  image_path: string | null
  expires_at: string | null
  created_at: string
  /** 背景音乐 id（lib/music.ts 的 MusicId）；老数据库尚未迁移时该列不存在 */
  music?: string | null
}

export interface NoteWithAuthor extends Note {
  profiles: Pick<Profile, 'username' | 'display_name'> | null
}

export interface NoteReply {
  id: string
  note_id: string
  author_id: string
  content: string
  created_at: string
}

export interface ReplyWithAuthor extends NoteReply {
  authorName: string
}
