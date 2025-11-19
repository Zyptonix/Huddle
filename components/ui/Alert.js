import { AlertCircle, CheckCircle } from 'lucide-react'

export default function Alert({ type = 'error', message, className = "" }) {
  if (!message) return null

  const styles = {
    error: "bg-red-50 text-red-700 border-red-200",
    success: "bg-green-50 text-green-700 border-green-200",
    info: "bg-blue-50 text-blue-700 border-blue-200"
  }

  const Icon = type === 'success' ? CheckCircle : AlertCircle

  return (
    <div className={`flex items-center p-3 rounded-lg border text-sm ${styles[type]} ${className}`}>
      <Icon className="w-5 h-5 mr-2 flex-shrink-0" />
      <p className="font-medium">{message}</p>
    </div>
  )
}