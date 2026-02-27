'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import { Hash, TrendingUp, Users, FileText, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { useSession } from 'next-auth/react'

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

interface TagStats {
  postCount: number
  participantCount: number
  viewCount: number
  trending: boolean
}

export default function TagDetailPage() {
  const params = useParams()
  const tagName = decodeURIComponent(params.name as string)
  const { data: session } = useSession()
  
  const [posts, setPosts] = useState<Post[]>([])
  const [stats, setStats] = useState<TagStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'hot' | 'new'>('hot')

  useEffect(() => {
    fetchTagData()
  }, [tagName, activeTab])

  const fetchTagData = async () => {
    setIsLoading(true)
    try {
      // Fetch posts with this tag
      const res = await fetch(`/api/search?q=${encodeURIComponent(tagName)}&type=posts`)
      const data = await res.json()
      setPosts(data.posts || [])
      
      // Mock stats for now
      setStats({
        postCount: data.posts?.length || 0,
        participantCount: Math.floor(Math.random() * 1000) + 500,
        viewCount: Math.floor(Math.random() * 10000) + 1000,
        trending: true
      })
    } catch (error) {
      console.error('Failed to fetch tag data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar user={session?.user || { id: '', name: null, email: null, image: null }} />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-8 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 blur-3xl" />
        
        <div className="relative max-w-4xl mx-auto">
          {/* Back Button */}
          <Link href="/discover">
            <motion.button
              whileHover={{ x: -4 }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              返回发现
            </motion.button>
          </Link>

          {/* Tag Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
              <Hash className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
              #{tagName}
            </h1>
            
            {stats?.trending && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-500 text-sm rounded-full mb-4"
              >
                <TrendingUp className="w-4 h-4" />
                热门话题
              </motion.div>
            )}
          </motion.div>

          {/* Stats */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex justify-center gap-8 mt-6"
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-gray-500 text-sm mb-1">
                  <FileText className="w-4 h-4" />
                  帖子
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {stats.postCount.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-gray-500 text-sm mb-1">
                  <Users className="w-4 h-4" />
                  参与
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {stats.participantCount.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-gray-500 text-sm mb-1">
                  <TrendingUp className="w-4 h-4" />
                  浏览
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {(stats.viewCount / 1000).toFixed(1)}k
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="sticky top-16 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 py-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('hot')}
              className={`px-5 py-2.5 rounded-full font-medium transition-all ${
                activeTab === 'hot'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🔥 热门
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('new')}
              className={`px-5 py-2.5 rounded-full font-medium transition-all ${
                activeTab === 'new'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🆕 最新
            </motion.button>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-200 rounded-2xl aspect-square animate-pulse"
              />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="columns-2 md:columns-3 gap-4 space-y-4">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="break-inside-avoid"
              >
                <PostCard post={post} />
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
              <Hash className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">暂无内容</h3>
            <p className="text-gray-500">成为第一个发布 #{tagName} 的人吧！</p>
          </motion.div>
        )}
      </section>
    </div>
  )
}

function PostCard({ post }: { post: Post }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      {post.images[0] ? (
        <div className="relative aspect-square overflow-hidden">
          <img
            src={post.images[0]}
            alt={post.content}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <p className="text-sm line-clamp-2 mb-2">{post.content}</p>
            <div className="flex items-center gap-3 text-xs">
              <span>❤️ {post._count.likes}</span>
              <span>💬 {post._count.comments}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <p className="text-gray-700 line-clamp-4">{post.content}</p>
          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
            <span>❤️ {post._count.likes}</span>
            <span>💬 {post._count.comments}</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}
