'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Tag,
  User,
  Image as ImageIcon,
  Video,
  Grid3X3,
  ChevronDown,
  X,
  SlidersHorizontal,
  Clock,
  Flame,
  Search
} from 'lucide-react'

export interface SearchFilters {
  timeRange: '24h' | 'week' | 'month' | 'custom' | null
  customDateStart?: string
  customDateEnd?: string
  tags: string[]
  authorId?: string
  mediaType: 'all' | 'image' | 'video'
  sortBy: 'relevance' | 'time' | 'popularity'
}

interface SearchFilterProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  availableTags?: string[]
  className?: string
}

const timeRangeOptions = [
  { id: '24h', label: '最近24小时', icon: Clock },
  { id: 'week', label: '本周', icon: Calendar },
  { id: 'month', label: '本月', icon: Calendar },
  { id: 'custom', label: '自定义', icon: SlidersHorizontal },
] as const

const sortOptions = [
  { id: 'relevance', label: '相关性', icon: Search },
  { id: 'time', label: '最新优先', icon: Clock },
  { id: 'popularity', label: '热度排序', icon: Flame },
] as const

const mediaTypeOptions = [
  { id: 'all', label: '全部', icon: Grid3X3 },
  { id: 'image', label: '仅图片', icon: ImageIcon },
  { id: 'video', label: '仅视频', icon: Video },
] as const

export function SearchFilter({
  filters,
  onFiltersChange,
  availableTags = [],
  className = ''
}: SearchFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const handleTimeRangeChange = (range: typeof timeRangeOptions[number]['id']) => {
    if (range === 'custom') {
      setShowCustomDate(true)
    } else {
      setShowCustomDate(false)
    }
    onFiltersChange({ ...filters, timeRange: range })
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !filters.tags.includes(tagInput.trim())) {
      onFiltersChange({
        ...filters,
        tags: [...filters.tags, tagInput.trim()]
      })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onFiltersChange({
      ...filters,
      tags: filters.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const handleClearFilters = () => {
    onFiltersChange({
      timeRange: null,
      tags: [],
      authorId: undefined,
      mediaType: 'all',
      sortBy: 'relevance'
    })
    setShowCustomDate(false)
  }

  const hasActiveFilters =
    filters.timeRange !== null ||
    filters.tags.length > 0 ||
    filters.authorId !== undefined ||
    filters.mediaType !== 'all' ||
    filters.sortBy !== 'relevance'

  return (
    <div className={`bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="font-medium">高级筛选</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded-full">
              已启用
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            清空筛选
          </button>
        )}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-6">
              {/* Sort Options */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Search className="w-4 h-4" />
                  排序方式
                </label>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <button
                        key={option.id}
                        onClick={() => onFiltersChange({ ...filters, sortBy: option.id })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          filters.sortBy === option.id
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Time Range */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Calendar className="w-4 h-4" />
                  时间范围
                </label>
                <div className="flex flex-wrap gap-2">
                  {timeRangeOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleTimeRangeChange(option.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          filters.timeRange === option.id
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {option.label}
                      </button>
                    )
                  })}
                </div>

                {/* Custom Date Range */}
                <AnimatePresence>
                  {showCustomDate && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 flex items-center gap-3 overflow-hidden"
                    >
                      <input
                        type="date"
                        value={filters.customDateStart || ''}
                        onChange={(e) =>
                          onFiltersChange({ ...filters, customDateStart: e.target.value })
                        }
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                      <span className="text-gray-400">至</span>
                      <input
                        type="date"
                        value={filters.customDateEnd || ''}
                        onChange={(e) =>
                          onFiltersChange({ ...filters, customDateEnd: e.target.value })
                        }
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Media Type */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Grid3X3 className="w-4 h-4" />
                  媒体类型
                </label>
                <div className="flex flex-wrap gap-2">
                  {mediaTypeOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <button
                        key={option.id}
                        onClick={() =>
                          onFiltersChange({ ...filters, mediaType: option.id as SearchFilters['mediaType'] })
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          filters.mediaType === option.id
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tags Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Tag className="w-4 h-4" />
                  标签筛选
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {filters.tags.map((tag) => (
                    <motion.span
                      key={tag}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm"
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="p-0.5 hover:bg-purple-200 rounded-full transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="输入标签按回车添加..."
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <button
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                    className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    添加
                  </button>
                </div>
                {availableTags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500">推荐标签:</span>
                    {availableTags.slice(0, 8).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          if (!filters.tags.includes(tag)) {
                            onFiltersChange({
                              ...filters,
                              tags: [...filters.tags, tag]
                            })
                          }
                        }}
                        disabled={filters.tags.includes(tag)}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Summary */}
      {hasActiveFilters && !isExpanded && (
        <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap gap-2">
          {filters.sortBy !== 'relevance' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs">
              {sortOptions.find(o => o.id === filters.sortBy)?.label}
            </span>
          )}
          {filters.timeRange && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-lg text-xs">
              {timeRangeOptions.find(o => o.id === filters.timeRange)?.label}
            </span>
          )}
          {filters.mediaType !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs">
              {mediaTypeOptions.find(o => o.id === filters.mediaType)?.label}
            </span>
          )}
          {filters.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
