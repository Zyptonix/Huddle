import { Activity, Trophy } from 'lucide-react'

export default function SportSelector({ selected, onChange }) {
  const sports = [
    { id: 'football', icon: Activity },
    { id: 'cricket', icon: Trophy },
    { id: 'tennis', icon: Activity }
  ]

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
      <div className="grid grid-cols-3 gap-3">
        {sports.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={`p-2 rounded-lg border text-sm font-medium capitalize flex flex-col items-center gap-1 transition-all
              ${selected === s.id 
                ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' 
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
          >
            <s.icon size={16} />
            {s.id}
          </button>
        ))}
      </div>
    </div>
  )
}