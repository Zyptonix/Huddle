import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../context/AuthContext'
import TournamentLayout from '../../../components/tournaments/TournamentLayout'
import AnnouncementFeed from '../../../components/tournaments/AnnouncementFeed'

export default function AnnouncementsPage() {
  const router = useRouter()
  const { id } = router.query
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    const res = await fetch(`/api/tournaments/${id}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }

  useEffect(() => { if (id) fetchData() }, [id])

  if (!data) return <TournamentLayout loading={true} />
  const isOrganizer = user?.id === data.organizer_id

  return (
    <TournamentLayout tournament={data} loading={loading}>
      <AnnouncementFeed 
         announcements={data.announcements} 
         tournamentId={id} 
         isOrganizer={isOrganizer} 
         user={user} 
         onRefresh={fetchData} 
      />
    </TournamentLayout>
  )
}