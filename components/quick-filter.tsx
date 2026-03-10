'use client'

import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Users, Compass, type LucideIcon } from 'lucide-react'

interface QuickFilterProps {
  iconName: 'Sparkles' | 'TrendingUp' | 'Users' | 'Compass'
  label: string
  color: 'purple' | 'pink' | 'blue' | 'indigo'
  active?: boolean
  href?: string
}

const iconMap: Record<string, LucideIcon> = {
  Sparkles,
  TrendingUp,
  Users,
  Compass
}

export function QuickFilter({ 
  iconName, 
  label, 
  color,
  active = false,
  href
}: QuickFilterProps) {
  const Icon = iconMap[iconName]
  
  const colorClasses = {
    purple: 'text-purple-500 bg-purple-50 hover:bg-purple-100',
    pink: 'text-pink-500 bg-pink-50 hover:bg-pink-100',
    blue: 'text-blue-500 bg-blue-50 hover:bg-blue-100',
    indigo: 'text-indigo-500 bg-indigo-50 hover:bg-indigo-100',
  }

  const activeClasses = {
    purple: 'bg-purple-500 text-white shadow-lg shadow-purple-500/25 hover:bg-purple-600',
    pink: 'bg-pink-500 text-white shadow-lg shadow-pink-500/25 hover:bg-pink-600',
    blue: 'bg-blue-500 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-600',
    indigo: 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-600',
  }

  const content = (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 cursor-pointer ${
        active ? activeClasses[color] : colorClasses[color]
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </motion.div>
  )

  if (href) {
    return <a href={href}>{content}</a>
  }

  return content
}
