import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/ui/Layout'
import { Save, User, MapPin, Phone, Award, Shield, Shirt, Calendar, Briefcase } from 'lucide-react'

export default function AccountSettings() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    username: '',
    phone: '',
    address: '',
    role: 'fan', // default
    sport: '',
    position: '',
    jersey_number: '',
    height: '',
    age: '',
    previous_teams: '',
    notable_achievements: '',
    bio: '', // Assuming you might add a bio column later, or use existing text fields
    avatar_url: ''
  })

  useEffect(() => {
    if (user) getProfile()
  }, [user])

  const getProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      if (data) setProfile(data)
    } catch (error) {
      console.log('Error loading profile', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          phone: profile.phone,
          address: profile.address,
          sport: profile.sport,
          // Player/Coach specific
          jersey_number: profile.jersey_number || null,
          height: profile.height,
          age: profile.age,
          positions_preferred: profile.position, // Mapping 'position' to DB 'positions_preferred'
          previous_teams: profile.previous_teams,
          notable_achievements: profile.notable_achievements,
          updated_at: new Date(),
        })
        .eq('id', user.id)

      if (error) throw error
      alert('Profile updated successfully!')
      router.push(`/profile/${user.id}`) // Redirect to view profile after save
    } catch (error) {
      alert('Error updating profile!')
      console.log(error)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  // Helper to render specific sections
  const renderRoleSpecificFields = () => {
    const role = (profile.role || '').toLowerCase()

    // --- COACH VIEW ---
    if (role === 'coach') {
      return (
        <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2">
                <Briefcase size={20}/> Coach Specifications
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
                <InputGroup label="Sport Coached" name="sport" value={profile.sport} onChange={handleChange} icon={<Shield size={16}/>} />
                <InputGroup label="Years Experience (Age)" name="age" type="number" value={profile.age} onChange={handleChange} icon={<Calendar size={16}/>} />
            </div>

            <InputGroup 
                label="Coaching Philosophy / Bio" 
                name="notable_achievements" 
                value={profile.notable_achievements} 
                onChange={handleChange} 
                isTextArea 
                placeholder="Describe your coaching style and certifications..."
            />
            
            <InputGroup 
                label="Teams Managed (History)" 
                name="previous_teams" 
                value={profile.previous_teams} 
                onChange={handleChange} 
                placeholder="e.g. West High School, City FC..." 
            />
        </div>
      )
    }

    // --- PLAYER VIEW ---
    if (role === 'player') {
      return (
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                <User size={20}/> Player Stats & Details
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
                <InputGroup label="Sport" name="sport" value={profile.sport} onChange={handleChange} icon={<Shield size={16}/>} />
                <InputGroup label="Preferred Position" name="position" value={profile.positions_preferred || profile.position} onChange={handleChange} placeholder="e.g. Striker, Point Guard" />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <InputGroup label="Jersey Number" name="jersey_number" type="number" value={profile.jersey_number} onChange={handleChange} icon={<Shirt size={16}/>} />
                <InputGroup label="Height" name="height" value={profile.height} onChange={handleChange} placeholder="e.g. 6'2''" />
                <InputGroup label="Age" name="age" type="number" value={profile.age} onChange={handleChange} />
            </div>

            <InputGroup 
                label="Previous Teams" 
                name="previous_teams" 
                value={profile.previous_teams} 
                onChange={handleChange} 
                placeholder="Comma separated: Team A, Team B" 
            />
            
            <InputGroup 
                label="Notable Achievements" 
                name="notable_achievements" 
                value={profile.notable_achievements} 
                onChange={handleChange} 
                isTextArea 
                placeholder="Awards, Trophies, Records..."
            />
        </div>
      )
    }

    // --- ORGANIZER VIEW ---
    if (role === 'organizer') {
        return (
            <div className="bg-purple-50 border border-purple-100 p-6 rounded-2xl space-y-6">
                <h3 className="text-lg font-bold text-purple-800 flex items-center gap-2">
                    <Award size={20}/> Organizer Details
                </h3>
                <InputGroup label="Organization Name" name="previous_teams" value={profile.previous_teams} onChange={handleChange} placeholder="e.g. City League Association" />
                <InputGroup label="Sport Focus" name="sport" value={profile.sport} onChange={handleChange} />
            </div>
        )
    }

    return null // Fans don't need extra fields
  }

  if (loading) return <Layout><div className="p-10 text-center">Loading settings...</div></Layout>

  return (
    <Layout title="Edit Profile">
      <div className="max-w-3xl mx-auto py-10 px-4">
        
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-black text-gray-900">Edit Profile</h1>
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
                {profile.role || 'User'} Account
            </span>
        </div>

        <form onSubmit={updateProfile} className="space-y-8">
            
            {/* 1. Basic Info (Everyone sees this) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Basic Information</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <InputGroup label="Username" name="username" value={profile.username} onChange={handleChange} />
                    <InputGroup label="Phone Number" name="phone" value={profile.phone} onChange={handleChange} icon={<Phone size={16}/>} />
                </div>
                
                <InputGroup label="Location / Address" name="address" value={profile.address} onChange={handleChange} icon={<MapPin size={16}/>} />
            </div>

            {/* 2. Role Specific Fields (Dynamic) */}
            {renderRoleSpecificFields()}

            {/* 3. Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                <button 
                    type="button" 
                    onClick={() => router.back()}
                    className="px-6 py-2.5 rounded-xl font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

        </form>
      </div>
    </Layout>
  )
}

// Reusable Input Component to keep code clean
function InputGroup({ label, name, value, onChange, type = "text", placeholder, icon, isTextArea }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                {label}
            </label>
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        {icon}
                    </div>
                )}
                {isTextArea ? (
                    <textarea 
                        name={name}
                        value={value || ''}
                        onChange={onChange}
                        placeholder={placeholder}
                        rows={3}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3"
                    />
                ) : (
                    <input 
                        type={type} 
                        name={name}
                        value={value || ''}
                        onChange={onChange}
                        placeholder={placeholder}
                        className={`w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 ${icon ? 'pl-10' : ''}`}
                    />
                )}
            </div>
        </div>
    )
}