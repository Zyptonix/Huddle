import Head from 'next/head'
import Link from 'next/link'
import { Rocket, LogIn } from 'lucide-react'

export default function Home() {
  return (
    <>
      <Head>
        <title>Huddle - Your Sports Tournament Hub</title>
      </Head>
      <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-linear-to-b from-white to-gray-100 text-gray-800">
        <main className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-20 text-center">
          <div className="bg-white p-12 sm:p-16 rounded-2xl shadow-xl max-w-2xl w-full">
            <h1 className="text-5xl sm:text-6xl font-bold text-blue-600">
              Huddle
            </h1>
            <p className="mt-4 text-xl sm:text-2xl text-gray-600">
              Your new tournament platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 w-full">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition-all transform hover:scale-105"
              >
                <LogIn size={20} />
                Login & Register
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105"
              >
                <Rocket size={20} />
                Go to Dashboard
              </Link>
            </div>
          </div>
        </main>

        <footer className="w-full text-center p-4 mt-8 text-gray-500 text-sm">
          © {new Date().getFullYear()} Huddle. All rights reserved.
        </footer>
      </div>
    </>
  )
}