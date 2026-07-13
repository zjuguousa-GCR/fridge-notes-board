'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/

export default function SignupPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!USERNAME_PATTERN.test(username)) {
      setError('用户名需为 3-20 位字母、数字或下划线')
      return
    }
    if (password.length < 6) {
      setError('密码至少需要 6 位')
      return
    }
    if (inviteCode !== process.env.NEXT_PUBLIC_FAMILY_INVITE_CODE) {
      setError('家庭邀请码不正确')
      return
    }

    setPending(true)
    const supabase = createClient()
    const email = `${username}@familyboard.app`

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      setError(signUpError.message === 'User already registered' ? '该用户名已被注册' : signUpError.message)
      setPending(false)
      return
    }

    if (!data.user) {
      setError('注册失败，请重试')
      setPending(false)
      return
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      username,
      display_name: displayName || username,
    })

    if (profileError) {
      setError(profileError.message)
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
        <h1 className="text-2xl font-semibold text-zinc-800">加入家庭留言贴</h1>

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
          <label htmlFor="displayName" className="text-sm font-medium text-zinc-600">
            显示名称（例如：妈妈）
          </label>
          <input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
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

        <div className="space-y-1">
          <label htmlFor="inviteCode" className="text-sm font-medium text-zinc-600">
            家庭邀请码
          </label>
          <input
            id="inviteCode"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
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
          {pending ? '注册中…' : '注册'}
        </button>

        <p className="text-center text-sm text-zinc-500">
          已有账号？{' '}
          <Link href="/login" className="font-medium text-amber-600">
            去登录
          </Link>
        </p>
      </form>
    </div>
  )
}
