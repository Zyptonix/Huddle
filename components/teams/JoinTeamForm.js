import { useState } from 'react'
import { UserPlus, ArrowRight } from 'lucide-react'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Alert from '../ui/Alert'
export default function JoinTeamForm({ onJoinSuccess }) {
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleJoin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/teams/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ joinCode }),
    })
    const data = await res.json()

    if (!res.ok) setError(data.error)
    else {
      setJoinCode('')
      if (onJoinSuccess) onJoinSuccess()
      alert(data.message)
    }
    setLoading(false)
  }

  return (
    <Card className="mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <UserPlus size={20} className="text-yellow-600" /> Join a Team
      </h3>
      <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-grow w-full">
           <Input 
             value={joinCode} 
             onChange={(e) => setJoinCode(e.target.value)} 
             placeholder="Enter Code (e.g. FC-9X2)" 
             className="mb-0" // Override margin
           />
        </div>
        <Button type="submit" isLoading={loading} variant="success" className="w-full sm:w-auto mb-0.5">
          Join Team <ArrowRight size={16} className="ml-2"/>
        </Button>
      </form>
      {error && <Alert type="error" message={error} className="mt-3" />}
    </Card>
  )
}