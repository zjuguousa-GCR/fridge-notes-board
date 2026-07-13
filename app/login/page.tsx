'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const supabase = createClient()
    let { error: signInError } = await supabase.auth.signInWithPassword({
      email: `${username}@familyboard.app`,
      password,
    })

    // 兼容邮箱域名从 familyboard.local 改为 familyboard.app 之前注册的老账号
    if (signInError) {
      ;({ error: signInError } = await supabase.auth.signInWithPassword({
        email: `${username}@familyboard.local`,
        password,
      }))
    }

    if (signInError) {
      setError('用户名或密码不正确')
      setPending(false)
      return
    }

    router.push('/board')
    router.refresh()
  }

  return (
    <div className="kitchen-wall flex flex-1 items-center justify-center px-4 py-10">
      <div className="fridge-door brushed-steel w-full max-w-md rounded-3xl px-6 py-12 sm:px-10">
        <form
          onSubmit={handleSubmit}
          className="note-paper mx-auto w-full max-w-sm -rotate-1 space-y-4 bg-yellow-200 p-6 pt-9"
        >
          <span className="magnet absolute -top-4 left-1/2 h-9 w-9 -translate-x-1/2" />
          <h1 className="text-center font-note text-3xl text-zinc-800">🧲 家庭留言贴</h1>

        <div className="space-y-1">
          <label htmlFor="username" className="text-sm font-medium text-zinc-600">
            用户名
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-md border border-black/10 bg-white/75 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-zinc-600">
            密码
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-black/10 bg-white/75 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="magnet-btn w-full rounded-full py-2 font-medium text-white disabled:opacity-50"
          >
            {pending ? '登录中…' : '登录'}
          </button>

          <p className="text-center text-sm text-zinc-600">
            还没有账号？{' '}
            <Link href="/signup" className="font-medium text-red-500 underline underline-offset-2">
              去注册
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
