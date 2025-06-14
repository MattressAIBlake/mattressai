'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Home() {
  const router = useRouter()

  const navigateToPage = (page: string) => {
    router.push(`/${page}`)
  }

  return (
    <main className="min-h-screen relative">
      {/* Hero Section with Static Background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/Personalheroimage.png"
            alt="Futuristic landscape with mountains"
            fill
            className="object-cover"
            priority
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Glowing Emojis Above Pyramids */}
        <div className="absolute inset-0 z-10">
          {/* Left Mountain - Mattress Industry (Middle height) */}
          <motion.button
            onClick={() => navigateToPage('mattress')}
            className="absolute left-[50%] top-[25%] text-6xl hover:scale-110 transition-all duration-300 cursor-pointer group"
            aria-label="Navigate to Mattress Industry projects"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            whileHover={{ scale: 1.2 }}
          >
            <span className="drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-pulse">
              🛏️
            </span>
            {/* Hover tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black/80 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Mattress Stuff
            </div>
          </motion.button>

          {/* Center Mountain - Client Work (Shortest) */}
          <motion.button
            onClick={() => navigateToPage('clients')}
            className="absolute left-[45%] top-[50%] text-6xl hover:scale-110 transition-all duration-300 cursor-pointer transform -translate-x-1/2 group"
            aria-label="Navigate to Client work"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            whileHover={{ scale: 1.2 }}
          >
            <span className="drop-shadow-[0_0_30px_rgba(255,215,0,1)] animate-pulse">
              💵
            </span>
            {/* Hover tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black/80 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Client Stuff
            </div>
          </motion.button>

          {/* Right Mountain - Other Stuff (Tallest) */}
          <motion.button
            onClick={() => navigateToPage('other')}
            className="absolute right-[24%] top-[7%] text-6xl hover:scale-110 transition-all duration-300 cursor-pointer group"
            aria-label="Navigate to Other projects"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
            whileHover={{ scale: 1.2 }}
          >
            <span className="drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-pulse">
              🧠
            </span>
            {/* Hover tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black/80 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Other Stuff
            </div>
          </motion.button>

          {/* About Me Button - Floating */}
          <button
            onClick={() => navigateToPage('about')}
            className="absolute bottom-[42%] right-[10%] bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105 border border-white/30"
          >
            <span className="font-medium">👋 About Me</span>
          </button>
        </div>

        {/* Simple Text in Top Left */}
        <motion.div 
          className="absolute top-8 left-8 z-20 text-white max-w-md"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-2xl font-bold drop-shadow-lg mb-2">
            Blake William Austin
          </h1>
          <p className="text-base font-medium drop-shadow-lg leading-relaxed opacity-90">
            I can build simple apps (its easy), I enjoy building things that destroy BS and bring helpful truth to light
          </p>
        </motion.div>

        {/* Floating Navigation Dots */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-30">
          <button
            onClick={() => navigateToPage('about')}
            className="w-3 h-3 rounded-full bg-white/50 hover:bg-white transition-all duration-300 hover:scale-125"
            aria-label="About"
          />
          <button
            onClick={() => navigateToPage('mattress')}
            className="w-3 h-3 rounded-full bg-white/50 hover:bg-white transition-all duration-300 hover:scale-125"
            aria-label="Mattress"
          />
          <button
            onClick={() => navigateToPage('other')}
            className="w-3 h-3 rounded-full bg-white/50 hover:bg-white transition-all duration-300 hover:scale-125"
            aria-label="Other"
          />
          <button
            onClick={() => navigateToPage('clients')}
            className="w-3 h-3 rounded-full bg-white/50 hover:bg-white transition-all duration-300 hover:scale-125"
            aria-label="Clients"
          />
        </div>
      </section>
    </main>
  )
} 