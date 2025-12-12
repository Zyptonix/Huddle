import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import ChatSystem from '../components/chat/ChatSystem'

export default function MessagesPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || !user || !profile) return null

  return <ChatSystem currentUser={profile} />
}