'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Image as ImageIcon, 
  Video,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'

interface Post {
  id: string
  content: string
  images: string[]
  videos: string[]
  videoThumbnails: string[]
  createdAt: string
  moderationStatus: string
  moderationReason: string | null
  author: {
    id: string
    name: string | null
    image: string | null
    email: string | null
  }
  _count: {
    likes: number
    comments: number
  }
}

interface PendingResponse {
  posts: Post[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function ModerationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set())
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [currentPostId, setCurrentPostId] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  // 检查登录状态
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // 获取待审核内容
  const fetchPendingPosts = async (page = 1) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/moderation/pending?page=${page}&limit=${pagination.limit}`)
      
      if (res.status === 403) {
        setError('您没有管理员权限')
        return
      }
      
      if (!res.ok) {
        throw new Error('获取待审核内容失败')
      }
      
      const data: PendingResponse = await res.json()
      setPosts(data.posts)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchPendingPosts()
    }
  }, [session])

  // 批准内容
  const handleApprove = async (postIds: string[]) => {
    try {
      const res = await fetch('/api/moderation/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postIds })
      })
      
      if (!res.ok) throw new Error('操作失败')
      
      // 刷新列表
      fetchPendingPosts(pagination.page)
      setSelectedPosts(new Set())
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    }
  }

  // 拒绝内容
  const handleReject = async (postIds: string[], reason: string) => {
    if (!reason.trim()) {
      alert('请填写拒绝原因')
      return
    }
    
    try {
      const res = await fetch('/api/moderation/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postIds, reason })
      })
      
      if (!res.ok) throw new Error('操作失败')
      
      // 刷新列表
      fetchPendingPosts(pagination.page)
      setSelectedPosts(new Set())
      setShowRejectModal(false)
      setRejectReason('')
      setCurrentPostId(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    }
  }

  // 选择/取消选择帖子
  const toggleSelect = (postId: string) => {
    const newSelected = new Set(selectedPosts)
    if (newSelected.has(postId)) {
      newSelected.delete(postId)
    } else {
      newSelected.add(postId)
    }
    setSelectedPosts(newSelected)
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedPosts.size === posts.length) {
      setSelectedPosts(new Set())
    } else {
      setSelectedPosts(new Set(posts.map(p => p.id)))
    }
  }

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-500">加载中...</p>
        </div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">内容审核</h1>
              <p className="text-sm text-gray-500">
                待审核内容: {pagination.total} 条
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fetchPendingPosts(pagination.page)}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                刷新
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/')}
              >
                返回首页
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 批量操作栏 */}
      {selectedPosts.size > 0 && (
        <div className="bg-blue-50 border-b py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="text-sm text-blue-700">
              已选择 {selectedPosts.size} 条内容
            </span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleApprove(Array.from(selectedPosts))}
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                批量通过
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setCurrentPostId(null)
                  setShowRejectModal(true)
                }}
                className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
              >
                <XCircle className="w-4 h-4 mr-1" />
                批量拒绝
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setSelectedPosts(new Set())}
              >
                取消选择
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 内容列表 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto text-green-400" />
            <p className="mt-4 text-gray-500">暂无待审核内容</p>
          </div>
        ) : (
          <>
            {/* 全选 */}
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                checked={selectedPosts.size === posts.length && posts.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-600">全选</span>
            </div>

            {/* 帖子列表 */}
            <div className="space-y-4">
              {posts.map((post) => (
                <div 
                  key={post.id} 
                  className="bg-white rounded-lg border shadow-sm overflow-hidden"
                >
                  <div className="flex">
                    {/* 选择框 */}
                    <div className="flex items-center px-4 border-r bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedPosts.has(post.id)}
                        onChange={() => toggleSelect(post.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </div>

                    {/* 内容预览 */}
                    <div className="flex-1 p-4">
                      {/* 作者信息 */}
                      <div className="flex items-center gap-2 mb-3">
                        {post.author.image ? (
                          <img 
                            src={post.author.image} 
                            alt="" 
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {post.author.name || '匿名用户'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatTime(post.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* 文本内容 */}
                      {post.content && (
                        <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                          {post.content}
                        </p>
                      )}

                      {/* 图片预览 */}
                      {post.images.length > 0 && (
                        <div className="flex gap-2 mb-3">
                          {post.images.slice(0, 4).map((img, i) => (
                            <div 
                              key={i}
                              className="relative w-20 h-20 rounded overflow-hidden bg-gray-100"
                            >
                              <img 
                                src={img} 
                                alt="" 
                                className="w-full h-full object-cover"
                              />
                              {i === 3 && post.images.length > 4 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm">
                                  +{post.images.length - 4}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 视频预览 */}
                      {post.videos.length > 0 && (
                        <div className="flex gap-2 mb-3">
                          {post.videos.slice(0, 2).map((video, i) => (
                            <div 
                              key={i}
                              className="relative w-20 h-20 rounded overflow-hidden bg-gray-900"
                            >
                              {post.videoThumbnails[i] ? (
                                <img 
                                  src={post.videoThumbnails[i]} 
                                  alt="" 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Video className="w-6 h-6 text-white" />
                                </div>
                              )}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                                  <div className="w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent border-l-gray-900 ml-1" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 统计信息 */}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>❤️ {post._count.likes}</span>
                        <span>💬 {post._count.comments}</span>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex flex-col justify-center gap-2 p-4 border-l bg-gray-50">
                      <Button
                        size="sm"
                        onClick={() => handleApprove([post.id])}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        通过
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setCurrentPostId(post.id)
                          setShowRejectModal(true)
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        拒绝
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 分页 */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => fetchPendingPosts(pagination.page - 1)}
                >
                  上一页
                </Button>
                <span className="flex items-center text-sm text-gray-600">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => fetchPendingPosts(pagination.page + 1)}
                >
                  下一页
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* 拒绝原因弹窗 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium mb-4">拒绝原因</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入拒绝原因..."
              className="w-full h-32 border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason('')
                  setCurrentPostId(null)
                }}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  const ids = currentPostId 
                    ? [currentPostId] 
                    : Array.from(selectedPosts)
                  handleReject(ids, rejectReason)
                }}
              >
                确认拒绝
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}