import Link from 'next/link'
import LoginForm from '../components/auth/LoginForm'
import AuthLayout from '../components/auth/AuthLayout'

export default function Login() {
  return (
    <AuthLayout 
      title="Sign in to your account" 
      subtitle={
        <>
          Or <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">create a new account</Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  )
}