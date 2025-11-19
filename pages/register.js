import Link from 'next/link'
import RegisterForm from '../components/auth/RegisterForm'
import AuthLayout from '../components/auth/AuthLayout'

export default function Register() {
  return (
    <AuthLayout 
      title="Create your account" 
      subtitle={
        <>
          Already have an account? <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">Sign in</Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  )
}