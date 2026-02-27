'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface Tag {
  name: string
  count: number
  trend: 'up' | 'down' | 'stable'
}

const mockTags: Tag[] = [
  { name: '美食', count: 12580, trend: 'up' },
  { name: '旅行', count: 9876, trend: 'up' },
  { name: '摄影', count: 8654, trend: 'stable' },
  { name: '日常', count: 7654, trend: 'up' },
  { name: '宠物', count: 6543, trend: 'up' },
  { name: '穿搭', count: 5432, trend: 'down' },
  { name: '健身', count: 4321, trend: 'up' },
  { name: '读书', count: 3210, trend: 'stable' },
  { name: '音乐', count: 2987, trend: 'up' },
  { name: '电影', count: 2765, trend: 'down' },
  { name: '手工', count: 2345, trend: 'up' },
  { name: '咖啡', count: 2134, trend: 'up' },
  { name: '日落', count: 1987, trend: 'up' },
  { name: '猫咪', count: 1876, trend: 'stable' },
  { name: '探店', count: 1654, trend: 'up' },
]

interface TagCloudProps {
  onTagClick?: (tag: string) => void
}

export function TagCloud({ onTagClick }: TagCloudProps = {}) {
  const router = useRouter()
  const [hoveredTag, setHoveredTag] = useState<string | null>(null)
  const [tags, setTags] = useState<Tag[]>([])

  useEffect(() => {
    // Shuffle tags for random positioning effect
    setTags([...mockTags].sort(() => Math.random() - 0.5))
  }, [])

  const getTagSize = (count: number) => {
    if (count > 10000) return 'text-2xl px-6 py-3'
    if (count > 5000) return 'text-xl px-5 py-2.5'
    if (count > 3000) return 'text-lg px-4 py-2'
    return 'text-base px-3 py-1.5'
  }

  const getTagColor = (index: number) => {
    const colors = [
      'from-purple-400 to-pink-400',
      'from-blue-400 to-cyan-400',
      'from-orange-400 to-red-400',
      'from-green-400 to-emerald-400',
      'from-indigo-400 to-purple-400',
      'from-pink-400 to-rose-400',
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="relative h-64 md:h-80 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />
        <div className="w-64 h-64 bg-pink-300/20 rounded-full blur-3xl absolute top-10 right-20" />
        <div className="w-48 h-48 bg-blue-300/20 rounded-full blur-3xl absolute bottom-10 left-20" />
      </div>

      {/* Floating Tags */}
      <div className="relative h-full flex flex-wrap items-center justify-center gap-3 p-4">
        {tags.map((tag, index) => (
          <motion.button
            key={tag.name}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: hoveredTag === tag.name ? -8 : Math.sin(index * 0.5) * 5,
            }}
            transition={{ 
              delay: index * 0.05,
              y: {
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut'
              }
            }}
            whileHover={{ scale: 1.1, zIndex: 10 }}
            onHoverStart={() => setHoveredTag(tag.name)}
            onHoverEnd={() => setHoveredTag(null)}
            onClick={() => {
              if (onTagClick) {
                onTagClick(tag.name)
              } else {
                router.push(`/discover?tag=${encodeURIComponent(tag.name)}`)
              }
            }}
            className={`
              relative font-medium text-white rounded-full shadow-lg
              bg-gradient-to-r ${getTagColor(index)}
              hover:shadow-xl transition-shadow duration-300
              ${getTagSize(tag.count)}
            `}
          >
            #{tag.name}
            
            {/* Trend indicator */}
            {tag.trend === 'up' && (
              <motion.span
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
              >
                <span className="absolute inset-0 bg-red-500 rounded-full animate-ping" />
              </motion.span>
            )}

            {/* Hover tooltip */}
            {hoveredTag === tag.name && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap
                  bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg"
              >
                {tag.count.toLocaleString()} 篇动态
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 
                  border-4 border-transparent border-b-gray-900" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
