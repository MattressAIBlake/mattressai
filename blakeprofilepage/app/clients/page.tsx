'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'

export default function Clients() {
  const router = useRouter()

  return (
    <main className="min-h-screen relative">
      {/* Hero Section with Same Background as Home */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image - Same as home page */}
        <div className="absolute inset-0">
          <Image
            src="/Personalheroimage.png"
            alt="Futuristic landscape with mountains"
            fill
            className="object-cover"
            priority
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Header Navigation */}
        <div className="absolute top-8 left-8 z-50">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105 border border-white/30"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Home</span>
          </button>
        </div>

        {/* Content Container */}
        <div className="relative z-20 flex flex-col items-center justify-center px-6 sm:px-12 lg:px-24 max-w-4xl mx-auto text-center">
          
          <motion.div
            className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700 overflow-hidden p-8"
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <motion.a
              href="https://ewheeldealai.replit.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl md:text-3xl font-mono text-cyan-400 hover:text-cyan-300 underline transition-colors duration-300 block mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              ewheeldealai.replit.app
            </motion.a>
            
            <motion.p
              className="text-lg md:text-xl font-mono text-gray-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              Yes its a simple replit app. And also Yes its pretty cool and helpful
            </motion.p>
          </motion.div>

        </div>
      </section>
    </main>
  )
} 