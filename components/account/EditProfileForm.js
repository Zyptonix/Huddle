import { useState, useEffect } from 'react'
import { User, Phone, Home, Ruler, AlertCircle, CheckCircle, X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import ImageUploader from '../common/ImageUploader'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Alert from '../ui/Alert'

export default function EditProfileForm({ user, profile, onCancel }) {
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [height, setHeight] = useState('')
  const [croppedImageFile, setCroppedImageFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: '', msg: '' })

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '')
      setPhone(profile.phone || '')
      setAddress(profile.address || '')
      setHeight(profile.height || '')
    }
  }, [profile])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus({ type: '', msg: '' })

    try {
      let newAvatarUrl = profile?.avatar_url
      
      if (croppedImageFile) {
        const filePath = `${user.id}/${Date.now()}_${croppedImageFile.name}`
        await supabase.storage.from('avatars').upload(filePath, croppedImageFile, { upsert: true })
        const { data } = await supabase.storage.from('avatars').getPublicUrl(filePath)
        newAvatarUrl = data.publicUrl
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, phone, address, height, avatar_url: newAvatarUrl }),
      })

      if (!res.ok) throw new Error('Failed to update profile.')

      setStatus({ type: 'success', msg: 'Profile updated! Reloading...' })
      setTimeout(() => window.location.reload(), 1000)
    } catch (err) {
      setStatus({ type: 'error', msg: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
         <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
         </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <ImageUploader currentImage={profile?.avatar_url} onImageChange={setCroppedImageFile} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Username" id="username" value={username} onChange={(e) => setUsername(e.target.value)} icon={<User size={18} />} />
          <Input label="Phone" id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<Phone size={18} />} placeholder="(Optional)" />
          <Input label="Address" id="address" value={address} onChange={(e) => setAddress(e.target.value)} icon={<Home size={18} />} placeholder="(Optional)" />
          <Input label="Height" id="height" value={height} onChange={(e) => setHeight(e.target.value)} icon={<Ruler size={18} />} placeholder="e.g. 6'2" />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" isLoading={loading} className="flex-1">Save Changes</Button>
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        </div>

        {status.msg && <Alert type={status.type === 'error' ? 'error' : 'success'} message={status.msg} />}
      </form>
    </div>
  )
}