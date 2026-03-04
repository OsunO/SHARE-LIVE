'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  X,
  Trash2,
  Search,
  TrendingUp,
  ArrowRight
} from 'lucide-react'

const STORAGE_KEY = 'share-live-search-history'
const MAX_HISTORY_ITEMS = 20

export interface SearchHistoryItem {
  id: string
  query: string
  timestamp: number
  filters?: {
    timeRange?: string
    tags: string[]
    mediaType: string
    sortBy: string
  }
}

interface SearchHistoryProps {
  onSelectQuery: (query: string, filters?: SearchHistoryItem['filters']) => void
  className?: string
}

export function SearchHistory({ onSelectQuery, className = '' }: SearchHistoryProps) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [isExpanded, setIsExpanded] = useState(true)
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setHistory(parsed)
      }
    } catch (error) {
      console.error('Failed to load search history:', error)
    }
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    } catch (error) {
      console.error('Failed to save search history:', error)
    }
  }, [history])

  const addToHistory = (query: string, filters?: SearchHistoryItem['filters']) => {
    if (!query.trim()) return

    setHistory((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((item) => item.query !== query.trim())
      
      // Add new item at the beginning
      const newItem: SearchHistoryItem = {
        id: Date.now().toString(),
        query: query.trim(),
        timestamp: Date.now(),
        filters
      }
      
      // Keep only max items
      return [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS)
    })
  }

  const removeFromHistory = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id))
  }

  const clearAllHistory = () => {
    setHistory([])
    setShowConfirmClear(false)
  }

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return new Date(timestamp).toLocaleDateString('zh-CN')
  }

  // Expose addToHistory method via ref pattern
  useEffect(() => {
    // @ts-ignore - adding to window for global access
    window.__searchHistory = { addToHistory }
  }, [])

  if (history.length === 0) {
    return (
      <div className={`bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-lg p-6 ${className}`}>
        <div className="flex items-center gap-2 text-gray-400 mb-3">
          <Clock className="w-5 h-5" />
          <span className="font-medium">搜索历史</span>
        </div>
        <p className="text-sm text-gray-400 text-center py-4">
          暂无搜索记录
        </p>
      </div>
    )
  }

  return (
    <div className={`bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
        >
          <Clock className="w-5 h-5" />
          <span className="font-medium">搜索历史</span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
            {history.length}
          </span>
        </button>
        <div className="flex items-center gap-2">
          {showConfirmClear ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <span className="text-xs text-gray-500">确定清空?</span>
              <button
                onClick={clearAllHistory}
                className="px-2 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
              >
                是
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-300 transition-colors"
              >
                否
              </button>
            </motion.div>
          ) : (
            <button
              onClick={() => setShowConfirmClear(true)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="清空历史"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* History List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="max-h-80 overflow-y-auto">
              {history.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="group flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                  onClick={() => onSelectQuery(item.query, item.filters)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Search className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate group-hover:text-purple-600 transition-colors">
                        {item.query}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">
                          {formatTimeAgo(item.timestamp)}
                        </span>
                        {item.filters && (
                          <span className="text-xs text-purple-500">
                            · 有筛选条件
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4 text-purple-500" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFromHistory(item.id)
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Hook to use search history
export function useSearchHistory() {
  const addToHistory = (query: string, filters?: SearchHistoryItem['filters']) => {
    // @ts-ignore
    if (window.__searchHistory) {
      // @ts-ignore
      window.__searchHistory.addToHistory(query, filters)
    }
  }

  return { addToHistory }
}
