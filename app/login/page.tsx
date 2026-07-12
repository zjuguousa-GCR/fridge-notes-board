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
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: `${username}@familyboard.local`,
      password,
    })

    if (signInError) {
      setError('用户名或密码不正确')
      setPending(false)
      return
    }

    router.push('/board')
    router.refresh()
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-amber-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-amber-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-2xl font-semibold text-zinc-800">家庭留言贴</h1>

        <div className="space-y-1">
          <label htmlFor="username" className="text-sm font-medium text-zinc-600">
            用户名
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
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
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-amber-500 py-2 font-medium text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {pending ? '登录中…' : '登录'}
        </button>

        <p className="text-center text-sm text-zinc-500">
          还没有账号？{' '}
          <Link href="/signup" className="font-medium text-amber-600">
            去注册
          </Link>
        </p>
      </form>
    </div>
  )
}
