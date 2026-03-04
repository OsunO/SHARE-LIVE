'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  TrendingUp,
  Clock,
  Flame,
  Filter,
  X,
  ArrowLeft,
  Loader2
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { TagCloud } from '@/components/discover/tag-cloud'
import { SearchFilter, SearchFilters } from '@/components/search/SearchFilter'
import { SearchHistory, useSearchHistory } from '@/components/search/SearchHistory'
import { useSession } from 'next-auth/react'

interface Post {
  id: string
  content: string
  images: string[]
  videos?: string[]
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

interface User {
  id: string
  name: string | null
  image: string | null
  bio: string | null
  _count: {
    followers: number
    posts: number
  }
}

interface TagResult {
  tag: string
  count: number
}

interface SearchResults {
  posts: Post[]
  users: User[]
  tags: TagResult[]
}

const tabs = [
  { id: 'all', label: '全部', icon: Search },
  { id: 'posts', label: '动态', icon: TrendingUp },
  { id: 'users', label: '用户', icon: Flame },
  { id: 'tags', label: '标签', icon: Filter },
]

// Loading fallback component
function SearchPageLoading() {
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

// Main search page content
function SearchPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToHistory } = useSearchHistory()

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'users' | 'tags'>(
    (searchParams.get('type') as any) || 'all'
  )
  const [results, setResults] = useState<SearchResults>({ posts: [], users: [], tags: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(!!searchParams.get('q'))
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState<SearchFilters>({
    timeRange: null,
    tags: [],
    mediaType: 'all',
    sortBy: 'relevance'
  })

  const [availableTags, setAvailableTags] = useState<string[]>([])

  // Fetch popular tags for suggestions
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch('/api/tags/popular')
        if (res.ok) {
          const data = await res.json()
          setAvailableTags(data.tags?.map((t: any) => t.name) || [])
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error)
      }
    }
    fetchTags()
  }, [])

  // Perform search
  const performSearch = useCallback(async (
    query: string,
    type: string,
    searchFilters: SearchFilters,
    saveToHistory: boolean = true
  ) => {
    if (!query.trim()) return

    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('q', query.trim())
      params.set('type', type)

      // Add filter params
      if (searchFilters.timeRange) {
        params.set('timeRange', searchFilters.timeRange)
        if (searchFilters.timeRange === 'custom') {
          if (searchFilters.customDateStart) params.set('dateStart', searchFilters.customDateStart)
          if (searchFilters.customDateEnd) params.set('dateEnd', searchFilters.customDateEnd)
        }
      }
      if (searchFilters.tags.length > 0) {
        params.set('tags', searchFilters.tags.join(','))
      }
      if (searchFilters.mediaType !== 'all') {
        params.set('mediaType', searchFilters.mediaType)
      }
      params.set('sortBy', searchFilters.sortBy)

      const res = await fetch(`/api/search?${params.toString()}`)
      if (!res.ok) throw new Error('Search failed')

      const data = await res.json()
      setResults(data)
      setHasSearched(true)

      // Update URL
      router.push(`/search?${params.toString()}`, { scroll: false })

      // Save to history
      if (saveToHistory) {
        addToHistory(query.trim(), {
          timeRange: searchFilters.timeRange || undefined,
          tags: searchFilters.tags,
          mediaType: searchFilters.mediaType,
          sortBy: searchFilters.sortBy
        })
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [router, addToHistory])

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(searchQuery, activeTab, filters)
  }

  // Handle history item selection
  const handleHistorySelect = (query: string, savedFilters?: any) => {
    setSearchQuery(query)
    if (savedFilters) {
      setFilters({
        timeRange: savedFilters.timeRange || null,
        tags: savedFilters.tags || [],
        mediaType: savedFilters.mediaType || 'all',
        sortBy: savedFilters.sortBy || 'relevance'
      })
    }
    performSearch(query, activeTab, savedFilters ? {
      timeRange: savedFilters.timeRange || null,
      tags: savedFilters.tags || [],
      mediaType: savedFilters.mediaType || 'all',
      sortBy: savedFilters.sortBy || 'relevance'
    } : filters, false)
  }

  // Handle tab change
  const handleTabChange = (tabId: typeof activeTab) => {
    setActiveTab(tabId)
    if (searchQuery.trim()) {
      performSearch(searchQuery, tabId, filters)
    }
  }

  // Initial search from URL params
  useEffect(() => {
    const q = searchParams.get('q')
    if (q && !hasSearched) {
      performSearch(q, activeTab, filters, false)
    }
  }, [])

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
      <Navbar user={(session?.user as any)?.id ? session?.user as any : { id: '', name: null, email: null, image: null }} />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-8 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 blur-3xl" />

        <div className="relative max-w-4xl mx-auto">
          {/* Back Button & Title */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/50 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              搜索
            </h1>
          </div>

          {/* Search Bar */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="mb-6"
          >
            <div className="relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索标签、用户或内容..."
                className="w-full px-6 py-4 pl-14 pr-32 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg shadow-purple-500/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all group-hover:shadow-xl"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              
              {/* Clear Button */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setResults({ posts: [], users: [], tags: [] })
                    setHasSearched(false)
                  }}
                  className="absolute right-24 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              <button
                type="submit"
                disabled={!searchQuery.trim() || isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                搜索
              </button>
            </div>
          </motion.form>

          {/* Filters Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  showFilters
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-white/50 text-gray-600 hover:bg-white'
                }`}
              >
                <Filter className="w-4 h-4" />
                高级筛选
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white/50 rounded-xl p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-white text-purple-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-6"
              >
                <SearchFilter
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableTags={availableTags}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search History (only show when no search has been made) */}
          {!hasSearched && !searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <SearchHistory onSelectQuery={handleHistorySelect} />
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-lg p-6">
                <div className="flex items-center gap-2 text-gray-700 mb-4">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">热门标签</span>
                </div>
                <TagCloud onTagClick={(tag) => {
                  setSearchQuery(tag)
                  performSearch(tag, activeTab, filters)
                }} />
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Results Section */}
      {hasSearched && (
        <section className="max-w-4xl mx-auto px-4 pb-12">
          {/* Results Stats */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              &ldquo;<span className="font-medium text-gray-900">{searchQuery}</span>&rdquo; 的搜索结果
            </p>
            <span className="text-sm text-gray-500">
              共 {(results.posts?.length || 0) + (results.users?.length || 0) + (results.tags?.length || 0)} 条结果
            </span>
          </div>

          {/* Tab Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Posts Results */}
              {(activeTab === 'all' || activeTab === 'posts') && results.posts?.length > 0 && (
                <div>
                  {activeTab === 'all' && (
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-500" />
                      相关动态
                    </h2>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.posts.map((post, index) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => router.push(`/post/${post.id}`)}
                        className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          {post.images?.[0] && (
                            <img
                              src={post.images[0]}
                              alt=""
                              className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                              {post.content}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <img
                                src={post.author.image || '/default-avatar.png'}
                                alt=""
                                className="w-5 h-5 rounded-full"
                              />
                              <span>{post.author.name}</span>
                              <span>·</span>
                              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Flame className="w-3 h-3" />
                                {post._count.likes}
                              </span>
                              <span className="flex items-center gap-1">
                                💬 {post._count.comments}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users Results */}
              {(activeTab === 'all' || activeTab === 'users') && results.users?.length > 0 && (
                <div>
                  {activeTab === 'all' && (
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Flame className="w-5 h-5 text-purple-500" />
                      相关用户
                    </h2>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {results.users.map((user, index) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => router.push(`/profile/${user.id}`)}
                        className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4"
                      >
                        <img
                          src={user.image || '/default-avatar.png'}
                          alt=""
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {user.name || '匿名用户'}
                          </h3>
                          {user.bio && (
                            <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                              {user.bio}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{user._count.followers} 粉丝</span>
                            <span>{user._count.posts} 动态</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags Results */}
              {(activeTab === 'all' || activeTab === 'tags') && results.tags?.length > 0 && (
                <div>
                  {activeTab === 'all' && (
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Filter className="w-5 h-5 text-purple-500" />
                      相关标签
                    </h2>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {results.tags.map((tag, index) => (
                      <motion.button
                        key={tag.tag}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => router.push(`/discover/tag/${encodeURIComponent(tag.tag)}`)}
                        className="px-5 py-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-3"
                      >
                        <span className="text-lg font-medium text-purple-600">
                          #{tag.tag}
                        </span>
                        <span className="text-sm text-gray-500">
                          {tag.count} 篇动态
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {results.posts?.length === 0 &&
                results.users?.length === 0 &&
                results.tags?.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                    <Search className="w-10 h-10 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    未找到相关结果
                  </h3>
                  <p className="text-gray-500">
                    换个关键词试试看，或者使用更通用的词语
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

// Main page with Suspense boundary
export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageLoading />}>
      <SearchPageContent />
    </Suspense>
  )
}
