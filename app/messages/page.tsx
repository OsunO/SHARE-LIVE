'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  MessageCircle, 
  Search, 
  User, 
  ChevronRight,
  RefreshCw
} from 'lucide-react'

interface Conversation {
  id: string
  otherUser: {
    id: string
    name: string | null
    image: string | null
  }
  lastMessage: string | null
  lastMessageAt: string | null
  updatedAt: string
  latestMessage: {
    id: string
    content: string
    createdAt: string
    senderId: string
    read: boolean
  } | null
}

export default function MessagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/messages')
      if (!res.ok) throw new Error('获取失败')
      const data = await res.json()
      setConversations(data.conversations)
    } catch (err) {
      console.error('Fetch conversations error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchConversations()
    }
  }, [session])

  // 格式化时间
  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return '昨天'
    } else if (days < 7) {
      return `${days}天前`
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
    }
  }

  // 过滤会话
  const filteredConversations = conversations.filter(conv => 
    conv.otherUser.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">私信</h1>
            <button
              onClick={fetchConversations}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <RefreshCw className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索联系人..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </header>

      {/* 会话列表 */}
      <main className="max-w-2xl mx-auto">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchQuery ? '没有找到相关会话' : '暂无私信'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              去关注的人主页发起聊天吧
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center gap-3 p-4 bg-white hover:bg-gray-50 transition-colors"
              >
                {/* 头像 */}
                <div className="relative">
                  {conv.otherUser.image ? (
                    <img
                      src={conv.otherUser.image}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">
                      {conv.otherUser.name || '匿名用户'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(conv.lastMessageAt || conv.updatedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-1">
                    {conv.lastMessage || '开始聊天吧'}
                  </p>
                </div>

                {/* 箭头 */}
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}