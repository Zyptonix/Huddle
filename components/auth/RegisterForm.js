import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabaseClient'
import { User, Mail, Lock, Phone, Home, Hash, AlertCircle, CheckCircle, UserPlus, Shield, Briefcase, Heart, Trophy, Medal } from 'lucide-react'
import ImageUploader from '../common/ImageUploader'
import PasswordStrength from '../common/PasswordStrength'
import GoogleButton from './GoogleButton'

import Card from '../ui/Card'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Select from '../ui/Select'
import Alert from '../ui/Alert'

export default function RegisterForm() {
  const router = useRouter()
  // Core State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [age, setAge] = useState('')
  const [role, setRole] = useState('fan')
  
  // Role Specific State
  const [jerseyNumber, setJerseyNumber] = useState('')
  const [positions, setPositions] = useState('')
  const [prevTeams, setPrevTeams] = useState('')
  const [achievements, setAchievements] = useState('')
  const [prevTournaments, setPrevTournaments] = useState('')

  const [croppedImageFile, setCroppedImageFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // --- FIX: Sanitize Integers ---
      // Convert empty strings to null to prevent Database Type Errors
      const sanitizedAge = age ? parseInt(age) : null
      const sanitizedJersey = (role === 'player' && jerseyNumber) ? parseInt(jerseyNumber) : null

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { 
          data: { 
            role, username, phone, address, 
            age: sanitizedAge,
            // Pass role-specific data to trigger
            jersey_number: sanitizedJersey,
            positions_preferred: role === 'player' ? positions : null,
            previous_teams: role === 'player' || role === 'coach' ? prevTeams : null,
            notable_achievements: role === 'player' || role === 'coach' ? achievements : null,
            previous_tournaments: role === 'organizer' ? prevTournaments : null
          } 
        },
      })

      if (signUpError) throw signUpError
      if (!authData.user) throw new Error('Sign up successful, but no user data returned.')

      let avatarUrl = ''
      if (croppedImageFile) {
        const filePath = `${authData.user.id}/${Date.now()}_${croppedImageFile.name}`
        await supabase.storage.from('avatars').upload(filePath, croppedImageFile, { upsert: true })
        const { data } = await supabase.storage.from('avatars').getPublicUrl(filePath)
        avatarUrl = data?.publicUrl || ''
      }

      // Final update to ensure avatar is saved if trigger missed it (safety net)
      await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', authData.user.id)

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
        
        {/* --- Google Auth --- */}
        <div className="space-y-4">
          <GoogleButton />
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-bold">Or register with email</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
        </div>

        {/* --- Credentials --- */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">1. Credentials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={18} />} required />
            <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} icon={<User size={18} />} required />
            <div className="md:col-span-2">
              <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={18} />} required />
              <PasswordStrength password={password} />
            </div>
          </div>
        </div>

        {/* --- Personal Info --- */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">2. Personal Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<Phone size={18} />} placeholder="(Optional)" />
            {/* Age Required */}
            <Input label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} icon={<Hash size={18} />} placeholder="e.g. 24" required />
            <div className="md:col-span-2">
              <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} icon={<Home size={18} />} placeholder="(Optional)" />
            </div>
          </div>
        </div>

        {/* --- Role Selection & Dynamic Fields --- */}
        <div className="mt-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
           <h3 className="text-lg font-medium text-gray-900 mb-4">3. Select Your Role</h3>
           
           <div className="mb-6">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
               {[
                 { id: 'fan', icon: Heart, label: 'Fan', color: 'text-red-600', bg: 'bg-red-50 ring-red-500' },
                 { id: 'player', icon: User, label: 'Player', color: 'text-yellow-600', bg: 'bg-yellow-50 ring-yellow-500' },
                 { id: 'coach', icon: Briefcase, label: 'Coach', color: 'text-green-600', bg: 'bg-green-50 ring-green-500' },
                 { id: 'organizer', icon: Shield, label: 'Organizer', color: 'text-blue-600', bg: 'bg-blue-50 ring-blue-500' }
               ].map((r) => (
                 <button
                   key={r.id}
                   type="button"
                   onClick={() => setRole(r.id)}
                   className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all
                     ${role === r.id ? `ring-2 ${r.bg} border-transparent` : 'bg-white border-gray-300 hover:bg-gray-100'}
                   `}
                 >
                   <r.icon className={role === r.id ? r.color : 'text-gray-400'} size={24} />
                   <span className={`text-sm font-bold ${role === r.id ? 'text-gray-900' : 'text-gray-500'}`}>{r.label}</span>
                 </button>
               ))}
             </div>
           </div>

           {/* --- DYNAMIC SLIDE-DOWN SECTION --- */}
           <div className={`transition-all duration-500 overflow-hidden ${role !== 'fan' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              
              {/* Player Specifics */}
              {role === 'player' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                   <div className="grid grid-cols-2 gap-4">
                      <Input label="Jersey Number" type="number" value={jerseyNumber} onChange={e => setJerseyNumber(e.target.value)} icon={<Hash size={18}/>} />
                      <Input label="Preferred Positions" value={positions} onChange={e => setPositions(e.target.value)} placeholder="e.g. ST, RW" />
                   </div>
                   <Input label="Previous Teams" value={prevTeams} onChange={e => setPrevTeams(e.target.value)} placeholder="e.g. Wildcats FC, City United" icon={<UserPlus size={18}/>} />
                   <Input label="Notable Achievements" value={achievements} onChange={e => setAchievements(e.target.value)} placeholder="e.g. MVP 2023, Golden Boot" icon={<Trophy size={18}/>} />
                </div>
              )}

              {/* Coach Specifics */}
              {role === 'coach' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                   <Input label="Previous Teams Managed" value={prevTeams} onChange={e => setPrevTeams(e.target.value)} placeholder="List teams you have coached..." icon={<Briefcase size={18}/>} />
                   <Input label="Coaching Achievements" value={achievements} onChange={e => setAchievements(e.target.value)} placeholder="e.g. League Winner 2022" icon={<Medal size={18}/>} />
                </div>
              )}

              {/* Organizer Specifics */}
              {role === 'organizer' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                   <Input label="Previous Tournaments" value={prevTournaments} onChange={e => setPrevTournaments(e.target.value)} placeholder="List major events you organized..." icon={<Trophy size={18}/>} />
                </div>
              )}
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