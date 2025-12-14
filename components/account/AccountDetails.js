import { 
  Mail, Shield, Phone, Home, Ruler, User, Users, Edit2, // Added 'Users' here
  Hash, Shirt, Trophy, Award, Calendar, MapPin 
} from 'lucide-react'

export default function AccountDetails({ user, profile, onEdit }) {
  
  // Reusable Info Card Component
  const InfoCard = ({ icon: Icon, label, value, fullWidth = false }) => (
    <div className={`p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors ${fullWidth ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center gap-2 mb-2 text-gray-500 text-xs font-bold uppercase tracking-wider">
        <Icon size={14} className="text-indigo-500" /> 
        {label}
      </div>
      <div className="text-gray-900 font-medium break-words">
        {value || <span className="text-gray-400 italic">Not set</span>}
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      
      {/* --- Cover Banner --- */}
      <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
      </div>

      <div className="px-8 pb-8">
        {/* --- Header Section --- */}
        <div className="relative flex flex-col md:flex-row justify-between items-end -mt-12 mb-8 gap-4">
           
           {/* Avatar & Name Group */}
           <div className="flex flex-col md:flex-row items-end gap-6 w-full md:w-auto">
             <div className="relative flex-shrink-0">
               <div className="h-28 w-28 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
                 {profile?.avatar_url ? (
                   <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                 ) : (
                   <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                     <User className="h-12 w-12 text-gray-300" />
                   </div>
                 )}
               </div>
               <div className="absolute bottom-1 right-1 bg-emerald-500 h-5 w-5 rounded-full border-2 border-white ring-1 ring-gray-100" title="Active"></div>
             </div>
             
             <div className="mb-2 text-center md:text-left">
                <h1 className="text-3xl font-black text-gray-900 leading-tight">
                  {profile?.username || 'No Username'}
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 text-sm mt-1">
                  <Mail size={14} /> {user.email}
                </div>
             </div>
           </div>
           
           {/* Edit Button */}
           <button 
             onClick={onEdit}
             className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm w-full md:w-auto justify-center"
           >
             <Edit2 size={16} /> Edit Profile
           </button>
        </div>

        {/* --- 1. Personal Details --- */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User size={20} className="text-gray-400"/> Personal Info
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
             <InfoCard icon={Shield} label="Role" value={<span className="capitalize">{profile?.role}</span>} />
             <InfoCard icon={Phone} label="Phone" value={profile?.phone} />
             <InfoCard icon={Calendar} label="Age" value={profile?.age} />
             <InfoCard icon={MapPin} label="Address" value={profile?.address} />
          </div>
        </div>

        {/* --- 2. Sports Profile (Only visible if data exists or user is player/coach) --- */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy size={20} className="text-gray-400"/> Sports Stats
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
             
             {/* Key Stats */}
             <InfoCard icon={Hash} label="Jersey Number" value={profile?.jersey_number && `#${profile.jersey_number}`} />
             <InfoCard icon={Shirt} label="Position" value={profile?.positions_preferred} />
             <InfoCard icon={Ruler} label="Height" value={profile?.height} />
             
             {/* Spacer for 4-col grid layout balance, or extra stat */}
             <div className="hidden lg:block"></div> 

             {/* Long Text Sections */}
             <InfoCard 
               fullWidth 
               icon={Users} 
               label="Previous Teams" 
               value={profile?.previous_teams} 
             />
             <InfoCard 
               fullWidth 
               icon={Award} 
               label="Notable Achievements" 
               value={profile?.notable_achievements} 
             />
          </div>
        </div>

      </div>
    </div>
  )
}