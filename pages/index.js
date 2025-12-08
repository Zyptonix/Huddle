import Head from 'next/head'
import Link from 'next/link'
import { Trophy, Users, Activity, ArrowRight, Shield } from 'lucide-react'

// Modular Components
import Navbar from '../components/ui/Navbar'
import Footer from '../components/ui/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Head>
        <title>Huddle - The Ultimate Sports Platform</title>
      </Head>

      {/* The Navbar handles the login/dashboard buttons automatically */}
      <Navbar />

      {/* --- HERO SECTION --- */}
      <div className="relative overflow-hidden bg-gray-900">
        <div className="absolute inset-0">
          <img
            src="/images/hero-bg.jpg" // Ensure you have this image in public/images/
            alt="Football pitch"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center lg:text-left lg:w-2/3">
            <h1 className="text-5xl lg:text-7xl font-extrabold text-white tracking-tight mb-6">
              Manage your league <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">like a pro.</span>
            </h1>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl">
              The all-in-one platform for organizers, coaches, and players. 
              Create tournaments, manage rosters, and track stats in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link 
                href="/register" 
                className="flex items-center justify-center px-8 py-4 text-lg font-bold rounded-full text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20"
              >
                Start for Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                href="/login" 
                className="flex items-center justify-center px-8 py-4 text-lg font-bold rounded-full text-white border border-gray-600 hover:bg-gray-800 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* --- FEATURES GRID --- */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-blue-600 font-semibold tracking-wide uppercase">Platform Features</h2>
            <p className="mt-2 text-4xl font-extrabold text-gray-900">Everything you need to win.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <FeatureCard 
              icon={<Trophy className="h-8 w-8 text-white" />}
              color="bg-yellow-500"
              title="Tournament Management"
              desc="Create multi-sport tournaments with automated scheduling. Knockout, League, or Round Robin."
            />
            <FeatureCard 
              icon={<Users className="h-8 w-8 text-white" />}
              color="bg-blue-600"
              title="Team Rosters"
              desc="Coaches can build squads, generate join codes, and manage player availability effortlessly."
            />
            <FeatureCard 
              icon={<Activity className="h-8 w-8 text-white" />}
              color="bg-green-500"
              title="Tactics Board"
              desc="Draw formations and strategies on a digital whiteboard. Share plays with your team instantly."
            />
            <FeatureCard 
              icon={<Shield className="h-8 w-8 text-white" />}
              color="bg-purple-600"
              title="Venue Management"
              desc="Organize your locations, track stadium capacity, and assign matches to specific fields."
            />
             <FeatureCard 
              icon={<Users className="h-8 w-8 text-white" />}
              color="bg-red-500"
              title="Fan Engagement"
              desc="Fans can follow their favorite teams, view live match schedules, and check leaderboards."
            />
            <FeatureCard 
              icon={<Activity className="h-8 w-8 text-white" />}
              color="bg-indigo-600"
              title="Performance Analytics"
              desc="Track goals, assists, and match history. Build your career profile season after season."
            />
          </div>
        </div>
      </div>

      {/* Modular Footer */}
      <Footer />
    </div>
  )
}

function FeatureCard({ icon, color, title, desc }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
      <div className={`inline-flex items-center justify-center p-3 rounded-xl ${color} shadow-lg mb-6`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{desc}</p>
    </div>
  )
}