'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, TrendingUp, MapPin, Clock, Flame } from 'lucide-react'
import { TagCloud } from '@/components/discover/tag-cloud'
import { Navbar } from '@/components/navbar'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

interface Post {
  id: string
  content: string
  images: string[]
  tags: string[]
  createdAt: string
  author: {
    id: string
    name: string | null
    image: string | null
  }
  _count: {
    likes: number
    comments: number
  }
}

const filters = [
  { id: 'trending', label: '热门', icon: Flame },
  { id: 'latest', label: '最新', icon: Clock },
  { id: 'nearby', label: '附近', icon: MapPin },
]

export default function DiscoverPage() {
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('trending')
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    fetchDiscoverContent()
  }, [activeFilter])

  const fetchDiscoverContent = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/discover?filter=${activeFilter}`)
      const data = await res.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error('Failed to fetch discover content:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    
    setIsLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar user={session?.user || { id: '', name: null, email: null, image: null }} />
      
      {/* Hero Section with Tag Cloud */}
      <section className="relative overflow-hidden pt-20 pb-12 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
              发现精彩
            </h1>
            <p className="text-gray-600 text-lg">探索标签，发现有趣的人和故事</p>
          </motion.div>

          {/* Search Bar */}
          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSearch}
            className="max-w-2xl mx-auto mb-12"
          >
            <div className="relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索标签、用户或内容..."
                className="w-full px-6 py-4 pl-14 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg shadow-purple-500/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all group-hover:shadow-xl group-hover:shadow-purple-500/20"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                搜索
              </button>
            </div>
          </motion.form>

          {/* Tag Cloud */}
          <TagCloud />
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="sticky top-16 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 py-4">
            {filters.map((filter) => {
              const Icon = filter.icon
              return (
                <motion.button
                  key={filter.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all ${
                    activeFilter === filter.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {filter.label}
                </motion.button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Masonry Content Grid */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-200 rounded-2xl aspect-[3/4] animate-pulse"
              />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="break-inside-avoid"
              >
                <DiscoverCard post={post} />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">暂无内容</h3>
            <p className="text-gray-500">换个筛选条件试试看</p>
          </motion.div>
        )}
      </section>
    </div>
  )
}

function DiscoverCard({ post }: { post: Post }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      {post.images[0] && (
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={post.images[0]}
            alt={post.content}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Hover Overlay Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <p className="text-sm line-clamp-2 mb-2">{post.content}</p>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3" />
                {post._count.likes}
              </span>
              <span>💬 {post._count.comments}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="p-3 flex flex-wrap gap-1.5">
          {post.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}
