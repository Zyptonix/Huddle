import { Shield } from 'lucide-react'

export default function TeamHeader({ team }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-gray-900">{team.name}</h1>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold uppercase">
              {team.sport}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Shield size={18} />
            <span>Coach: <strong>{team.coach?.username || 'Unknown'}</strong></span>
          </div>
        </div>
        <div className="text-right">
           <span className="text-gray-400 text-sm font-mono block">Join Code</span>
           <span className="text-2xl font-mono font-bold text-gray-800">{team.join_code}</span>
        </div>
      </div>
    </div>
  )
}