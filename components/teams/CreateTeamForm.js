import { useState } from 'react'
import { PlusCircle } from 'lucide-react'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Alert from '../ui/Alert' // NEW
import SportSelector from '../common/SportSelector' // NEW

export default function CreateTeamForm({ onTeamCreated }) {
  const [name, setName] = useState('')
  const [sport, setSport] = useState('football')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/teams/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, sport }),
    })
    const data = await res.json()

    if (!res.ok) setError(data.error)
    else {
      if (onTeamCreated) onTeamCreated()
      setName('')
      setSport('football')
      alert(`Team Created! Code: ${data.join_code}`)
    }
    setLoading(false)
  }

  return (
    <Card className="mt-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <PlusCircle size={20} className="text-blue-600"/> Create New Team
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Team Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Thunder Strikers" required />
        
        <SportSelector selected={sport} onChange={setSport} />

        <Alert type="error" message={error} />

        <Button type="submit" isLoading={loading} className="w-full">Create Team</Button>
      </form>
    </Card>
  )
}