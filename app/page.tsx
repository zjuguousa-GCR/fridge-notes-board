import { redirect } from 'next/navigation'

// proxy.ts already redirects unauthenticated visitors to /login, so by the
// time this page renders, the user is authenticated.
export default function Home() {
  redirect('/board')
}
