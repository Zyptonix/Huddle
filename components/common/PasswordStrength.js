export default function PasswordStrength({ password }) {
  if (!password || password.length === 0) return null

  let score = 0
  if (password.length > 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const getStrengthColor = () => {
    if (score <= 2) return 'bg-red-500'
    if (score <= 4) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getLabel = () => {
    if (score <= 2) return 'Weak'
    if (score <= 4) return 'Medium'
    return 'Strong'
  }

  return (
    <div className="mt-2">
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ease-out ${getStrengthColor()}`}
          style={{ width: `${(score / 5) * 100}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-1 text-right">{getLabel()}</p>
    </div>
  )
}