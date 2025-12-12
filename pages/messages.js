import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import ChatSystem from '../components/chat/ChatSystem'

export default function MessagesPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  
  // Get the conversationId from the URL (e.g. /messages?conversationId=123)
  const { conversationId } = router.query

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || !user || !profile) return null

  // Pass it to the ChatSystem
  return (
    <ChatSystem 
      currentUser={profile} 
      initialChatId={conversationId} 
    />
  )
}