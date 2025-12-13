import { useState, useEffect } from 'react'
import { 
  User, Phone, Home, Ruler, Calendar, Hash, 
  Shirt, Trophy, Award, X 
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext' // Import useAuth
import ImageUploader from '../common/ImageUploader'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Alert from '../ui/Alert'

export default function EditProfileForm({ user, profile, onCancel }) {
  const { refreshProfile } = useAuth() // <--- 1. Destructure the new function
  
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    address: '',
    height: '',
    age: '',
    jersey_number: '',
    positions_preferred: '',
    previous_teams: '',
    notable_achievements: ''
  })

  const [croppedImageFile, setCroppedImageFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: '', msg: '' })

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        phone: profile.phone || '',
        address: profile.address || '',
        height: profile.height || '',
        age: profile.age || '',
        jersey_number: profile.jersey_number || '',
        positions_preferred: profile.positions_preferred || '',
        previous_teams: profile.previous_teams || '',
        notable_achievements: profile.notable_achievements || ''
      })
    }
  }, [profile])

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus({ type: '', msg: '' })

    try {
      // --- CHANGE 1: Get the Access Token ---
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("No active session")

      let newAvatarUrl = profile?.avatar_url
      
      // 1. Handle Image Upload (Existing code is fine)
      if (croppedImageFile) {
        const fileExt = croppedImageFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, croppedImageFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
        newAvatarUrl = data.publicUrl
      }

      // --- CHANGE 2: Sanitize Data (Fixes "invalid input syntax for integer") ---
      // Postgres will crash if you send "" (empty string) to an integer column.
      const payload = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null, 
        jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : null,
        avatar_url: newAvatarUrl
      }

      // --- CHANGE 3: Add Authorization Header ---
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` // <--- CRITICAL FIX
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        // Try to parse the error message from backend if available
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || 'Failed to update profile.')
      }

      await refreshProfile() 

      setStatus({ type: 'success', msg: 'Profile updated successfully!' })
      
      setTimeout(() => {
        onCancel() 
      }, 1000)

    } catch (err) {
      console.error(err)
      setStatus({ type: 'error', msg: err.message })
    } finally {
      setLoading(false)
    }
  }
  // Helper for Section Headers
  const SectionHeader = ({ title }) => (
    <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wide border-b border-indigo-100 pb-2 mb-4 mt-2">
      {title}
    </h3>
  )

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-2xl font-black text-gray-900">Edit Profile</h2>
         <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
         </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Image Uploader */}
        <div className="flex justify-center mb-6">
          <ImageUploader currentImage={profile?.avatar_url} onImageChange={setCroppedImageFile} />
        </div>

        {/* Section 1: Personal Details */}
        <div>
          <SectionHeader title="Personal Details" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Username" id="username" value={formData.username} onChange={handleChange} icon={<User size={18} />} />
            <Input label="Phone" id="phone" type="tel" value={formData.phone} onChange={handleChange} icon={<Phone size={18} />} placeholder="(Optional)" />
            <div className="md:col-span-2">
              <Input label="Address" id="address" value={formData.address} onChange={handleChange} icon={<Home size={18} />} placeholder="City, Country" />
            </div>
            <Input label="Age" id="age" type="number" value={formData.age} onChange={handleChange} icon={<Calendar size={18} />} />
            <Input label="Height" id="height" value={formData.height} onChange={handleChange} icon={<Ruler size={18} />} placeholder="e.g. 185cm" />
          </div>
        </div>

        {/* Section 2: Player Stats */}
        <div>
          <SectionHeader title="Player Stats" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Jersey Number" id="jersey_number" type="number" value={formData.jersey_number} onChange={handleChange} icon={<Hash size={18} />} placeholder="e.g. 10" />
            <Input label="Position" id="positions_preferred" value={formData.positions_preferred} onChange={handleChange} icon={<Shirt size={18} />} placeholder="e.g. Striker" />
          </div>
        </div>

        {/* Section 3: Career History */}
        <div>
          <SectionHeader title="Career History" />
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Trophy size={16} className="text-gray-400" /> Previous Teams
              </label>
              <textarea
                id="previous_teams"
                value={formData.previous_teams}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="List your past clubs..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Award size={16} className="text-gray-400" /> Notable Achievements
              </label>
              <textarea
                id="notable_achievements"
                value={formData.notable_achievements}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Awards, stats, trophies..."
              />
            </div>
          </div>
        </div>

{/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" isLoading={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
            Save Changes
          </Button>
        </div>

        {status.msg && (
          <Alert type={status.type === 'error' ? 'error' : 'success'} message={status.msg} />
        )}
      </form>
    </div>
  )
}