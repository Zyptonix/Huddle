import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/ui/Layout' // <--- IMPORT LAYOUT
import ChatSystem from '../components/chat/ChatSystem'

export default function MessagesPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  
  // Get the conversationId from the URL
  const { conversationId } = router.query

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || !user || !profile) return null

  return (
    // <--- WRAP IN LAYOUT TO SHOW NAVBAR --->
    <Layout title="Messages | Huddle">
      <div className="h-[calc(100vh-64px)]"> {/* Optional: Adjust height to fit under navbar without double scrolling */}
        <ChatSystem 
          currentUser={profile} 
          initialChatId={conversationId} 
        />
      </div>
    </Layout>
  )
}