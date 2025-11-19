import Link from 'next/link'
import Head from 'next/head'

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex bg-white">
      <Head>
        <title>{title} - Huddle</title>
      </Head>

      {/* --- LEFT SIDE: FORM --- */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white z-10">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8">
            <Link href="/">
              <h1 className="text-4xl font-extrabold text-blue-600 tracking-tight cursor-pointer">
                Huddle
              </h1>
            </Link>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {title}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {subtitle}
            </p>
          </div>

          {children}

        </div>
      </div>

      {/* --- RIGHT SIDE: IMAGE --- */}
      <div className="hidden lg:block relative w-0 flex-1">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          // CHANGE THIS LINE BELOW:
          src="/images/auth-bg.jpg" 
          // Make sure 'auth-bg.jpg' exists in your 'public/images/' folder
          alt="Stadium background"
        />
        {/* Overlay gradient to make it look premium */}
        <div className="absolute inset-0 bg-blue-900 bg-opacity-30 mix-blend-multiply"></div>
        <div className="absolute bottom-0 left-0 p-12 text-white z-10">
          <blockquote className="space-y-2">
            <p className="text-lg font-medium">
              &ldquo;Huddle has completely transformed how we manage our Sunday league. The automated scheduling is a lifesaver.&rdquo;
            </p>
            <footer className="text-sm font-semibold opacity-80">
              Alex Morgan, League Organizer
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  )
}