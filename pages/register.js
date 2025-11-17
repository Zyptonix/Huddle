import { useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
} from 'react-image-crop'
import Modal from 'react-modal'
import {
  User,
  Mail,
  Lock,
  Phone,
  Home,
  Ruler,
  AlertCircle,
  CheckCircle,
  Upload,
  UserPlus,
  Shield,
  Briefcase,
  Heart,
} from 'lucide-react'

// Import react-image-crop styles
import 'react-image-crop/dist/ReactCrop.css'

// Set the app element for react-modal
if (typeof window !== 'undefined') {
  Modal.setAppElement('body')
}

// Helper function to create the cropped image
function getCroppedImg(image, crop, fileName) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    canvas.width = crop.width
    canvas.height = crop.height
    const ctx = canvas.getContext('2d')

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    )

    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'))
        return
      }
      const file = new File([blob], fileName, { type: blob.type })
      resolve(file)
    }, 'image/jpeg')
  })
}


// --- Helper to render form fields ---
  const FormField = ({
    icon,
    label,
    id,
    type,
    value,
    onChange,
    placeholder,
    required = false,
  }) => (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
        <input
          type={type}
          name={id}
          id={id}
          value={value}
          onChange={onChange}
          // FIX: Added text-gray-900
          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md text-gray-900"
          placeholder={placeholder}
          required={required}
        />
      </div>
    </div>
  )

  
export default function Register() {
  const router = useRouter()

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [height, setHeight] = useState('')
  const [role, setRole] = useState('fan')

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState(0)

  // Image crop state
  const [imgSrc, setImgSrc] = useState('')
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState(null)
  const [imageFile, setImageFile] = useState(null) // Holds the original file
  const [croppedImageFile, setCroppedImageFile] = useState(null) // Holds the cropped file
  const imgRef = useRef(null)

  // Modal state
  const [modalIsOpen, setModalIsOpen] = useState(false)

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // --- Password Strength Logic ---
  const checkPasswordStrength = (pass) => {
    let score = 0
    if (pass.length > 8) score++
    if (/[A-Z]/.test(pass)) score++
    if (/[a-z]/.test(pass)) score++
    if (/[0-9]/.test(pass)) score++
    if (/[^A-Za-z0-9]/.test(pass)) score++
    setPasswordStrength(score)
  }

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500'
    if (passwordStrength <= 4) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  // --- Image Crop Logic ---
  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setImageFile(file) // Save original file
      setCrop(undefined) // Reset crop
      const reader = new FileReader()
      reader.addEventListener('load', () =>
        setImgSrc(reader.result.toString() || '')
      )
      reader.readAsDataURL(file)
      setModalIsOpen(true) // Open the modal
    }
  }

  const onImageLoad = (e) => {
    imgRef.current = e.currentTarget
    // Auto-center a 1:1 aspect ratio crop
    const { width, height } = e.currentTarget
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1 / 1, // Aspect ratio 1:1
        width,
        height
      ),
      width,
      height
    )
    setCrop(crop)
  }

  const handleCropComplete = async () => {
    if (completedCrop && imgRef.current && imageFile) {
      try {
        const croppedFile = await getCroppedImg(
          imgRef.current,
          completedCrop,
          imageFile.name
        )
        setCroppedImageFile(croppedFile)
        setModalIsOpen(false)
      } catch (e) {
        console.error('Error cropping image:', e)
        setError('Could not crop image. Please try again.')
        setModalIsOpen(false)
      }
    }
  }

  // --- Main Form Submit Logic (REBUILT & FIXED) ---
  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (passwordStrength < 3) {
      setError('Password is too weak. Please make it stronger.')
      setLoading(false)
      return
    }

    let user = null;

    try {
      // 1. Handle Sign Up
      // This passes the 'role' and 'username' to our SQL Trigger
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            role: role,
            username: username,
          },
        },
      })

      if (signUpError) {
        // Check for the specific "already registered" error
        if (
          signUpError.message.includes('already registered') ||
          signUpError.message.includes('Email address already in use')
        ) {
          throw new Error('A user with this email address already exists.')
        }
        // Throw any other sign-up error
        throw signUpError
      }
      user = authData.user
      let avatarUrl = ''

      // 2. Handle File Upload if it exists
      if (croppedImageFile) {
        // FIX: Path must start with user ID to pass RLS policy
        const filePath = `${user.id}/${Date.now()}_${croppedImageFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, croppedImageFile)

        if (uploadError) throw uploadError

        // FIX: Added 'await'
        const { data: urlData } = await supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)
        
        if (!urlData) {
            throw new Error('Could not get public URL for avatar.')
        }
        avatarUrl = urlData.publicUrl
      }

      // 3. Update the user's profile with the rest of the data
      // (phone, address, height, and the new avatar_url)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          phone: phone,
          address: address,
          height: height,
          avatar_url: avatarUrl || null,
        })
        .eq('id', user.id) // Only update the row for this new user

      if (updateError) throw updateError

      setSuccess('Account created successfully! Redirecting to dashboard...')
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (error) {
      console.error('Sign up Error:', error)
      setError(error.message)
      // If sign-up worked but profile update failed, the user exists
      // but we should still show an error.
      if (user) {
        setError(`Account created, but profile update failed: ${error.message}`)
      }
    } finally {
      // This guarantees the loading spinner stops
      setLoading(false)
    }
  }

  

  return (
    <>
      <Head>
        <title>Register for Huddle</title>
        {/* FIX: Style to force browser autofill to have black text */}
        <style>
          {`
            input:-webkit-autofill,
            input:-webkit-autofill:hover, 
            input:-webkit-autofill:focus, 
            input:-webkit-autofill:active,
            select:-webkit-autofill,
            select:-webkit-autofill:hover,
            select:-webkit-autofill:focus,
            select:-webkit-autofill:active {
              -webkit-text-fill-color: #111827 !important;
              -webkit-box-shadow: 0 0 0px 1000px #fff inset !important;
            }
          `}
        </style>
      </Head>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
          {/* --- BRANDING --- */}
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your <span className="text-blue-600">Huddle</span> account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already a member?{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in here
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
          <div className="bg-white py-8 px-4 shadow-lg border border-gray-200 sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSignUp}>
              {/* --- SECTION 1 --- */}
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Account Credentials</h3>
                <p className="mt-1 text-sm text-gray-500">This is for logging in and identification.</p>
              </div>
              <div className="border-t border-gray-200 mt-4 pt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <FormField
                  icon={<Mail className="h-5 w-5 text-gray-400" />}
                  label="Email address"
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required={true}
                />
                <FormField
                  icon={<User className="h-5 w-5 text-gray-400" />}
                  label="Public Username"
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your display name"
                  required={true}
                />
                <div className="md:col-span-2">
                  <FormField
                    icon={<Lock className="h-5 w-5 text-gray-400" />}
                    label="Password"
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      checkPasswordStrength(e.target.value)
                    }}
                    placeholder="Min. 8 characters"
                    required={true}
                  />
                  {/* Password Strength Bar */}
                  {password.length > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${getStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>

              {/* --- SECTION 2 --- */}
              <div className="mt-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Personal Details</h3>
                <p className="mt-1 text-sm text-gray-500">This information will be on your public profile (optional).</p>
              </div>
              <div className="border-t border-gray-200 mt-4 pt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <FormField
                  icon={<Phone className="h-5 w-5 text-gray-400" />}
                  label="Phone Number"
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(Optional)"
                />
                <FormField
                  icon={<Ruler className="h-5 w-5 text-gray-400" />}
                  label="Height"
                  id="height"
                  type="text"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g., 6' 2' (Optional)"
                />
                <div className="md:col-span-2">
                  <FormField
                    icon={<Home className="h-5 w-5 text-gray-400" />}
                    label="Home Address"
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="(Optional)"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Sign up as:
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       {/* --- COLORFUL ICONS --- */}
                       {role === 'fan' && <Heart className="h-5 w-5 text-red-500" />}
                       {role === 'player' && <User className="h-5 w-5 text-yellow-600" />}
                       {role === 'coach' && <Briefcase className="h-5 w-5 text-green-500" />}
                       {role === 'organizer' && <Shield className="h-5 w-5 text-blue-600" />}
                     </div>
                    <select

                      id="role"
                      name="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      // FIX: Removed mt-1 and sm:text-sm. Added text-base
                      className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md text-gray-900"
                    >
                      <option value="fan">Fan</option>
                      <option value="player">Player</option>
                      <option value="coach">Coach</option>
                      <option value="organizer">Organizer (Admin)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* --- SECTION 3 --- */}
              <div className="mt-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Profile Picture</h3>
                <p className="mt-1 text-sm text-gray-500">A picture helps others recognize you (optional).</p>
              </div>
              <div className="border-t border-gray-200 mt-4 pt-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {croppedImageFile ? (
                      <img
                        className="h-12 w-12 rounded-full object-cover"
                        src={URL.createObjectURL(croppedImageFile)}
                        alt="Profile preview"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span className="p-2 border rounded-md hover:bg-gray-50 flex items-center gap-2">
                      <Upload size={16} />
                      Choose a file
                    </span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={onSelectFile}
                    />
                  </label>
                  {croppedImageFile && (
                    <button
                      type="button"
                      onClick={() => setCroppedImageFile(null)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>


              {/* --- Submit & Error/Success Messages --- */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                >
                  <UserPlus size={20} className="mr-2"/>
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>

              {error && (
                <div className="flex items-center text-red-700 bg-red-100 p-3 rounded-md border border-red-200">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <p>{error}</p>
                </div>
              )}
              {success && (
                <div className="flex items-center text-green-700 bg-green-100 p-3 rounded-md border border-green-200">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <p>{success}</p>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* --- Image Crop Modal --- */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="Crop Image"
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-lg"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        <h2 className="text-2xl font-semibold mb-4">Crop your profile picture</h2>
        {imgSrc && (
          <ReactCrop
            crop={crop}
            onChange={(c, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            circularCrop
          >
            <img
              ref={imgRef}
              src={imgSrc}
              onLoad={onImageLoad}
              alt="Crop preview"
            />
          </ReactCrop>
        )}
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={() => setModalIsOpen(false)}
            className="px-4 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCropComplete}
            className="px-4 py-2 rounded-md bg-blue-600 text-sm font-medium text-white hover:bg-blue-700"
          >
            Crop & Save
          </button>
        </div>
      </Modal>
    </>
  )
}