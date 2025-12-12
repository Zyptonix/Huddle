import { Mail, Shield, Phone, Home, Ruler, User, Edit2 } from 'lucide-react'

export default function AccountDetails({ user, profile, onEdit }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Cover Banner */}
      <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
         <div className="absolute inset-0 bg-black/10"></div>
      </div>

      <div className="px-8 pb-8">
        <div className="relative flex justify-between items-end -mt-12 mb-6">
           {/* Avatar */}
           <div className="relative">
              <div className="h-24 w-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                    <User className="h-10 w-10 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 bg-green-500 h-6 w-6 rounded-full border-2 border-white" title="Active"></div>
           </div>
           
           {/* Edit Button */}
           <button 
             onClick={onEdit}
             className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
           >
             <Edit2 size={16} /> Edit Profile
           </button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{profile?.username || 'No Username'}</h1>
          <p className="text-gray-500">{user.email}</p>
        </div>

        {/* Info Grid */}
        <div className="grid md:grid-cols-2 gap-6">
           <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3 mb-2 text-gray-500 text-sm font-medium uppercase tracking-wide">
                 <Shield size={16} /> Role
              </div>
              <div className="text-lg font-bold text-gray-900 capitalize">{profile?.role}</div>
           </div>

           <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3 mb-2 text-gray-500 text-sm font-medium uppercase tracking-wide">
                 <Phone size={16} /> Phone
              </div>
              <div className="text-lg font-semibold text-gray-900">{profile?.phone || 'Not set'}</div>
           </div>

           <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3 mb-2 text-gray-500 text-sm font-medium uppercase tracking-wide">
                 <Ruler size={16} /> Height
              </div>
              <div className="text-lg font-semibold text-gray-900">{profile?.height || 'Not set'}</div>
           </div>

           <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3 mb-2 text-gray-500 text-sm font-medium uppercase tracking-wide">
                 <Home size={16} /> Address
              </div>
              <div className="text-lg font-semibold text-gray-900">{profile?.address || 'Not set'}</div>
           </div>
        </div>

      </div>
    </div>
  )
}