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
}

export interface NoteWithAuthor extends Note {
  profiles: Pick<Profile, 'username' | 'display_name'> | null
}
