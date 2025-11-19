import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabaseClient'
import { User, Mail, Lock, Phone, Home, Ruler, UserPlus } from 'lucide-react'
import ImageUploader from '../common/ImageUploader'
import PasswordStrength from '../common/PasswordStrength'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Select from '../ui/Select' // NEW
import Alert from '../ui/Alert'   // NEW

export default function RegisterForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [height, setHeight] = useState('')
  const [role, setRole] = useState('fan')
  const [croppedImageFile, setCroppedImageFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { data: { role, username } },
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) throw new Error('Email already registered.')
        throw signUpError
      }
      if (!authData.user) throw new Error('Sign up successful, but no user returned.')

      let avatarUrl = ''
      if (croppedImageFile) {
        const filePath = `${authData.user.id}/${Date.now()}_${croppedImageFile.name}`
        await supabase.storage.from('avatars').upload(filePath, croppedImageFile, { upsert: true })
        const { data } = await supabase.storage.from('avatars').getPublicUrl(filePath)
        avatarUrl = data?.publicUrl || ''
      }

      await supabase.from('profiles').update({ phone, address, height, avatar_url: avatarUrl }).eq('id', authData.user.id)

      setSuccess('Account created! Redirecting...')
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <form className="space-y-6" onSubmit={handleSignUp}>
        <div>
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Credentials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Input label="Email" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={18} />} required />
            <Input label="Username" id="username" value={username} onChange={(e) => setUsername(e.target.value)} icon={<User size={18} />} required />
            <div className="md:col-span-2">
              <Input label="Password" id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={18} />} required />
              <PasswordStrength password={password} />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Input label="Phone" id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<Phone size={18} />} />
            <Input label="Height" id="height" value={height} onChange={(e) => setHeight(e.target.value)} icon={<Ruler size={18} />} placeholder="e.g. 6'2" />
            <div className="md:col-span-2">
              <Input label="Address" id="address" value={address} onChange={(e) => setAddress(e.target.value)} icon={<Home size={18} />} />
            </div>
            <div className="md:col-span-2">
              <Select 
                label="Sign up as" 
                id="role" 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                options={[
                  { value: 'fan', label: 'Fan' },
                  { value: 'player', label: 'Player' },
                  { value: 'coach', label: 'Coach' },
                  { value: 'organizer', label: 'Organizer (Admin)' }
                ]}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 border-t pt-6">
            <ImageUploader onImageChange={setCroppedImageFile} label="Profile Picture (Optional)" />
        </div>

        <div className="pt-4">
          <Button type="submit" isLoading={loading} className="w-full">
            <UserPlus size={20} className="mr-2"/> Create Account
          </Button>
        </div>

        <Alert type="error" message={error} />
        <Alert type="success" message={success} />
      </form>
    </Card>
  )
}