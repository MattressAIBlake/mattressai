'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'

export default function Mattress() {
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
        <div className="relative z-20 flex flex-col items-center justify-center px-6 sm:px-12 lg:px-24 max-w-6xl mx-auto">
          
          {/* CLI Terminal Container */}
          <motion.div
            className="bg-gray-900 rounded-xl shadow-2xl max-w-5xl mx-auto border border-gray-700 overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {/* Terminal Header */}
            <div className="bg-gray-800 px-4 py-3 flex items-center gap-2 border-b border-gray-700">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-gray-400 text-sm font-mono ml-4">blake@terminal ~ cat mattress-projects.md</div>
            </div>
            
            {/* Terminal Content */}
            <div className="p-6 md:p-8 font-mono text-sm md:text-base leading-relaxed">
              <div className="space-y-4 text-green-400">
                <div className="text-cyan-400"># Mattress Industry Projects</div>
                
                <div className="text-yellow-400">## Consumer Facing</div>
                <div className="text-gray-300">
                  - <a href="https://mattress-wizard.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline transition-colors">mattress-wizard.com</a> <span className="text-gray-400 italic">(consumer facing)</span>
                </div>
                <div className="text-gray-300">
                  - <a href="https://mattress-wiki.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline transition-colors">mattress-wiki.com</a> <span className="text-gray-400 italic">(consumer facing)</span>
                </div>
                
                <div className="text-yellow-400">## B2B Platform</div>
                <div className="text-gray-300">
                  - <a href="https://mattressai.co" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline transition-colors">mattressai.co</a> <span className="text-gray-400 italic">(B2B Mattress Sales Assistant +CRM for Mattress Retailers)</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Below Text */}
          <motion.p
            className="text-white/80 text-lg font-mono mt-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            I love the mattress industry its aweful.
          </motion.p>

        </div>
      </section>
    </main>
  )
} 