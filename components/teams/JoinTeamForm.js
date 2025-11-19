import { useState } from 'react'
import { UserPlus, ArrowRight } from 'lucide-react'

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

    if (!res.ok) {
      setError(data.error)
    } else {
      setJoinCode('')
      if (onJoinSuccess) onJoinSuccess()
      alert(data.message)
    }
    setLoading(false)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <UserPlus size={20} className="text-yellow-600" /> Join a Team
      </h3>
      <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-grow">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter Team Code (e.g. FC-9X2)"
            // FIX: Added 'text-gray-900'
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-yellow-500 outline-none font-mono uppercase text-gray-900"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-yellow-600 text-white font-semibold rounded-md hover:bg-yellow-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
        >
          {loading ? 'Joining...' : 'Join Team'} <ArrowRight size={18} />
        </button>
      </form>
      {error && <p className="text-red-600 mt-2 text-sm bg-red-50 p-2 rounded border border-red-100">{error}</p>}
    </div>
  )
}