'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

export function FloatingActionButton() {
  return (
    <>
      {/* Desktop FAB */}
      <motion.a
        href="/post/new"
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        className="hidden sm:flex fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl shadow-lg shadow-purple-500/30 items-center justify-center z-40 hover:shadow-xl transition-shadow"
      >
        <Plus className="w-6 h-6" />
      </motion.a>
      
      {/* Mobile FAB */}
      <motion.a
        href="/post/new"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center z-40"
      >
        <Plus className="w-6 h-6" />
      </motion.a>
    </>
  )
}
