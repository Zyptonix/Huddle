import { useState } from 'react'
import { PlusCircle, Calendar } from 'lucide-react'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Select from '../ui/Select' // NEW
import Alert from '../ui/Alert' // NEW
import SportSelector from '../common/SportSelector' // NEW

export default function CreateTournamentForm({ onTournamentCreated }) {
  const [name, setName] = useState('')
  const [sport, setSport] = useState('football')
  const [format, setFormat] = useState('knockout')
  const [startDate, setStartDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/tournaments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, sport, format, startDate }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error)
    } else {
      if (onTournamentCreated) onTournamentCreated()
      setName('')
      setStartDate('')
      alert(`Tournament created!`)
    }
    setLoading(false)
  }

  return (
    <Card>
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <PlusCircle size={20} className="text-blue-600"/> Create New Tournament
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Tournament Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Summer Cup" required />

        <SportSelector selected={sport} onChange={setSport} />

        <Select
          label="Format"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          options={[
            { value: 'knockout', label: 'Knockout' },
            { value: 'round_robin', label: 'Round Robin' },
            { value: 'league', label: 'League' }
          ]}
        />

        <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} icon={<Calendar size={18}/>} />

        <Alert type="error" message={error} />

        <Button type="submit" isLoading={loading} className="w-full">Create Tournament</Button>
      </form>
    </Card>
  )
}