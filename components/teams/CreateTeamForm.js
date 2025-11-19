import { useState } from 'react'
import { PlusCircle, Trophy, Activity } from 'lucide-react'

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

    if (!res.ok) {
      setError(data.error)
    } else {
      // Notify parent component to refresh list
      if (onTeamCreated) onTeamCreated()
      setName('')
      setSport('football')
      alert(`Team Created! Share code: ${data.join_code}`)
    }
    setLoading(false)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mt-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <PlusCircle size={20} className="text-blue-600"/> Create New Team
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g. Thunder Strikers"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
          <div className="grid grid-cols-3 gap-3">
            {['football', 'cricket', 'tennis'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSport(s)}
                className={`p-2 rounded-md border text-sm font-medium capitalize flex flex-col items-center gap-1 transition-all
                  ${sport === s 
                    ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' 
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {s === 'football' && <Activity size={16} />} 
                {s === 'cricket' && <Trophy size={16} />} 
                {s === 'tennis' && <Activity size={16} />} 
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          {loading ? 'Creating...' : 'Create Team'}
        </button>
      </form>
    </div>
  )
}


