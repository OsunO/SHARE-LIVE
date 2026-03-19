'use client'

import { useState, useEffect } from 'react'
import { Flame, TrendingUp, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface TrendingTag {
  name: string
  count: number
  color: string
}

interface TrendingTopicProps {
  onTagClick?: (tag: string) => void
}

export function TrendingTopics({ onTagClick }: TrendingTopicProps) {
  const router = useRouter()
  const [tags, setTags] = useState<TrendingTag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch('/api/tags/popular')
        if (res.ok) {
          const data = await res.json()
          setTags(data.tags || [])
        }
      } catch (error) {
        console.error('Failed to fetch trending tags:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTags()
  }, [])

  const handleTagClick = (tag: string) => {
    if (onTagClick) {
      onTagClick(tag)
    } else {
      router.push(`/discover/tag/${encodeURIComponent(tag)}`)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="animate-pulse flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* 头部 */}
      <div className="p-4 border-b bg-gradient-to-r from-orange-50 to-red-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">热门话题</h3>
              <p className="text-xs text-gray-500">最近30天热门</p>
            </div>
          </div>
          <button 
            onClick={() => router.push('/search')}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            更多 <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 话题列表 */}
      <div className="p-2">
        {tags.slice(0, 10).map((tag, index) => (
          <motion.button
            key={tag.name}
            onClick={() => handleTagClick(tag.name)}
            className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              index < 3 
                ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white' 
                : 'bg-gray-100 text-gray-500'
            }`}>
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">#{tag.name}</span>
                {index === 0 && (
                  <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> 热
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400">{tag.count} 条动态</span>
            </div>
          </motion.button>
        ))}

        {tags.length === 0 && (
          <div className="py-8 text-center text-gray-400">
            <Flame className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无热门话题</p>
          </div>
        )}
      </div>
    </div>
  )
}