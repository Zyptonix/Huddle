import { useState } from 'react'
import { Trophy, Shield, Calendar, Edit2, Save, X } from 'lucide-react'

export default function TournamentHeader({ tournament, isOrganizer, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: tournament.name,
    sport: tournament.sport,
    format: tournament.format,
    start_date: tournament.start_date || '',
    status: tournament.status
  })

  const handleSave = async () => {
    await onUpdate(editForm)
    setIsEditing(false)
  }

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-12 shadow-sm">
      <div className="max-w-5xl mx-auto">
         <div className="flex justify-between items-start">
           <div className="w-full">
             <div className="flex items-center gap-2 text-sm font-bold text-blue-600 uppercase tracking-wider mb-2">
                <Trophy size={16} /> {tournament.sport} Tournament
             </div>
             
             {isEditing ? (
               <input 
                 type="text" 
                 className="text-4xl font-extrabold text-gray-900 mb-4 border-b-2 border-blue-500 outline-none w-full bg-transparent"
                 value={editForm.name}
                 onChange={e => setEditForm({...editForm, name: e.target.value})}
               />
             ) : (
               <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{tournament.name}</h1>
             )}
             
             <div className="flex flex-wrap gap-6 text-gray-600 items-center">
               <div className="flex items-center gap-2">
                 <Shield size={18} /> Organizer: <span className="font-semibold text-gray-900">{tournament.organizerName}</span>
               </div>
               <div className="flex items-center gap-2">
                 <Calendar size={18} /> Start: 
                 {isEditing ? (
                   <input 
                     type="date" 
                     className="border rounded p-1 text-sm ml-2"
                     value={editForm.start_date}
                     onChange={e => setEditForm({...editForm, start_date: e.target.value})}
                   />
                 ) : (
                   <span className="font-semibold text-gray-900">{tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'TBD'}</span>
                 )}
               </div>
               {isEditing && (
                 <select 
                   className="border rounded p-1 text-sm"
                   value={editForm.status}
                   onChange={e => setEditForm({...editForm, status: e.target.value})}
                 >
                   <option value="upcoming">Upcoming</option>
                   <option value="active">Active</option>
                   <option value="completed">Completed</option>
                 </select>
               )}
             </div>
           </div>

           {isOrganizer && (
             <div>
               {isEditing ? (
                 <div className="flex gap-2">
                   <button onClick={() => setIsEditing(false)} className="p-2 text-red-600 hover:bg-red-50 rounded"><X size={24} /></button>
                   <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-50 rounded"><Save size={24} /></button>
                 </div>
               ) : (
                 <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors">
                   <Edit2 size={18} /> Edit
                 </button>
               )}
             </div>
           )}
         </div>
      </div>
    </div>
  )
}