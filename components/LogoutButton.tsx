'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button onClick={handleLogout} className="text-sm text-zinc-500 hover:text-zinc-800">
      退出登录
    </button>
  )
}
