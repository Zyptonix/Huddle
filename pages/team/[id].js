import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
// FIX: Correct path
import Layout from '../../components/ui/Layout'
import TeamHeader from '../../components/teams/TeamHeader'
import RosterList from '../../components/teams/RosterList'
import Alert from '../../components/ui/Alert'
import Loading from '../../components/ui/Loading' 

export default function TeamPage() {
  const router = useRouter()
  const { id } = router.query
  const [team, setTeam] = useState(null)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (id) {
      const fetchTeam = async () => {
        try {
          const res = await fetch(`/api/teams/${id}`)
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          setTeam(data)
        } catch (err) {
          setError(err.message)
        } finally {
          setFetchLoading(false)
        }
      }
      fetchTeam()
    }
  }, [id])

  return (
    <Layout title={team ? `${team.name} - Huddle` : 'Loading Team...'}>
      {fetchLoading ? (
        <div className="py-20"><Loading message="Loading team details..." /></div>
      ) : error ? (
        <Alert type="error" message={error} />
      ) : team ? (
        <>
          <TeamHeader team={team} />
          <RosterList roster={team.roster} />
        </>
      ) : null}
    </Layout>
  )
}