import { useState, useEffect } from 'react'
import { Users, Copy, Check } from 'lucide-react'
import Link from 'next/link'

export default function CoachTeamList() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    const res = await fetch('/api/teams/created')
    if (res.ok) {
      const data = await res.json()
      setTeams(data)
    }
    setLoading(false)
  }

  // --- FIX: Use robust copy method for iframes ---
  const copyToClipboard = (text, id) => {
    const textArea = document.createElement("textarea")
    textArea.value = text
    textArea.style.top = "0"
    textArea.style.left = "0"
    textArea.style.position = "fixed"
    textArea.style.opacity = "0"
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      const successful = document.execCommand('copy')
      if (successful) {
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
      }
    } catch (err) {
      console.error('Unable to copy', err)
    }
    document.body.removeChild(textArea)
  }

  if (loading) return <p className="text-gray-500 mt-4">Loading your teams...</p>

  if (teams.length === 0) {
    return (
      <div className="mt-8 text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <Users className="mx-auto h-10 w-10 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No teams yet</h3>
        <p className="mt-1 text-sm text-gray-500">Create your first team above to get started.</p>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Your Teams</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <div key={team.id} className="bg-white p-5 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow relative">
            <div className="flex justify-between items-start">
              <div>
                {/* ADDED LINK HERE */}
                <Link href={`/team/${team.id}`} className="font-bold text-lg text-gray-900 hover:text-blue-600 hover:underline">
                  {team.name}
                </Link>
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full capitalize mt-1 block w-max">
                  {team.sport}
                </span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Join Code</p>
              <div className="w-full flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                <code className="text-blue-600 font-mono text-lg select-all cursor-text">
                  {team.join_code}
                </code>
                <button
                  onClick={() => copyToClipboard(team.join_code, team.id)}
                  className="p-2 rounded-md hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700 focus:outline-none"
                  title="Copy to clipboard"
                  type="button"
                >
                  {copiedId === team.id ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Share this code with your players.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}