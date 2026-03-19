'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Users,
  FileText,
  Heart,
  Bookmark,
  MessageCircle,
  UserPlus,
  Mail,
  Camera,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Stats {
  overview: {
    totalUsers: number
    totalPosts: number
    totalLikes: number
    totalFavorites: number
    totalComments: number
    totalFollows: number
    totalMessages: number
    totalStories: number
    pendingModeration: number
  }
  charts: {
    userGrowth: Record<string, number>
    postGrowth: Record<string, number>
  }
  popularTags: Array<{ name: string; count: number }>
  activeUsers: Array<{
    id: string
    name: string | null
    image: string | null
    _count: { posts: number }
  }>
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/stats')
      
      if (res.status === 403) {
        setError('您没有管理员权限')
        return
      }
      
      if (!res.ok) throw new Error('获取数据失败')
      
      const data = await res.json()
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchStats()
    }
  }, [session])

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-500" />
          <p className="mt-2 text-red-600">{error}</p>
          <Button onClick={() => router.push('/')} className="mt-4">
            返回首页
          </Button>
        </div>
      </div>
    )
  }

  const statCards = [
    { label: '用户总数', value: stats?.overview.totalUsers || 0, icon: Users, color: 'bg-blue-500' },
    { label: '帖子总数', value: stats?.overview.totalPosts || 0, icon: FileText, color: 'bg-green-500' },
    { label: '点赞数', value: stats?.overview.totalLikes || 0, icon: Heart, color: 'bg-red-500' },
    { label: '收藏数', value: stats?.overview.totalFavorites || 0, icon: Bookmark, color: 'bg-yellow-500' },
    { label: '评论数', value: stats?.overview.totalComments || 0, icon: MessageCircle, color: 'bg-purple-500' },
    { label: '关注关系', value: stats?.overview.totalFollows || 0, icon: UserPlus, color: 'bg-indigo-500' },
    { label: '私信数', value: stats?.overview.totalMessages || 0, icon: Mail, color: 'bg-pink-500' },
    { label: '故事数', value: stats?.overview.totalStories || 0, icon: Camera, color: 'bg-orange-500' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">管理员仪表盘</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchStats}>
                <RefreshCw className="w-4 h-4 mr-1" />
                刷新
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/admin/moderation')}>
                内容审核 ({stats?.overview.pendingModeration || 0})
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                返回首页
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 用户增长图表 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              用户增长 (最近7天)
            </h2>
            <div className="h-48 flex items-end gap-2">
              {stats?.charts.userGrowth && Object.entries(stats.charts.userGrowth).map(([date, count]) => (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${Math.max(count * 20, 4)}px` }}
                  />
                  <span className="text-xs text-gray-400">{date.slice(5)}</span>
                  <span className="text-xs font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 帖子增长图表 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-500" />
              帖子增长 (最近7天)
            </h2>
            <div className="h-48 flex items-end gap-2">
              {stats?.charts.postGrowth && Object.entries(stats.charts.postGrowth).map(([date, count]) => (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-green-500 rounded-t"
                    style={{ height: `${Math.max(count * 20, 4)}px` }}
                  />
                  <span className="text-xs text-gray-400">{date.slice(5)}</span>
                  <span className="text-xs font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 热门标签 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">🔥 热门标签</h2>
            <div className="space-y-3">
              {stats?.popularTags.map((tag, index) => (
                <div key={tag.name} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-400 w-6">#{index + 1}</span>
                  <span className="flex-1 font-medium">#{tag.name}</span>
                  <span className="text-sm text-gray-500">{tag.count} 次</span>
                </div>
              ))}
              {stats?.popularTags.length === 0 && (
                <p className="text-gray-400 text-sm">暂无标签数据</p>
              )}
            </div>
          </div>

          {/* 活跃用户 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">⭐ 活跃用户 (最近7天)</h2>
            <div className="space-y-3">
              {stats?.activeUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  {user.image ? (
                    <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <Users className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <span className="flex-1 font-medium">{user.name || '匿名用户'}</span>
                  <span className="text-sm text-gray-500">{user._count.posts} 帖子</span>
                </div>
              ))}
              {stats?.activeUsers.length === 0 && (
                <p className="text-gray-400 text-sm">暂无活跃用户</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}