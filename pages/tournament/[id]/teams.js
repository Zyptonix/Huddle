import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../context/AuthContext'
import TournamentLayout from '../../../components/tournaments/TournamentLayout'
import RegisteredTeamsList from '../../../components/tournaments/RegisteredTeamsList'

export default function TeamsPage() {
  const router = useRouter()
  const { id } = router.query
  const { user, profile } = useAuth()
  const [data, setData] = useState(null)
  const [myTeams, setMyTeams] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    const res = await fetch(`/api/tournaments/${id}`)
    if (res.ok) setData(await res.json())
    
    if (profile?.role === 'coach') {
        const teamRes = await fetch('/api/teams/created')
        if (teamRes.ok) setMyTeams(await teamRes.json())
    }
    setLoading(false)
  }

  useEffect(() => { if (id) fetchData() }, [id, profile])

  if (!data) return <TournamentLayout loading={true} />

  return (
    <TournamentLayout tournament={data} loading={loading}>
      <RegisteredTeamsList 
         teams={data.teams} 
         myTeams={myTeams} 
         profile={profile} 
         tournamentId={id} 
         sport={data.sport} 
         onRefresh={fetchData} 
      />
    </TournamentLayout>
  )
}