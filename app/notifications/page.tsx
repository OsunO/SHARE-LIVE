'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, MessageCircle, UserPlus, AtSign, Bell, 
  CheckCheck, Trash2, Settings, ArrowLeft, Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { useSession } from 'next-auth/react'

type NotificationType = 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MENTION' | 'SYSTEM'

interface Notification {
  id: string
  type: NotificationType
  title: string
  content?: string
  read: boolean
  createdAt: string
  actor?: {
    id: string
    name: string | null
    image: string | null
  }
  post?: {
    id: string
    images: string[]
    content: string
  }
}

const typeConfig = {
  LIKE: { icon: Heart, color: 'text-red-500', bg: 'bg-red-50', gradient: 'from-red-400 to-pink-500' },
  COMMENT: { icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-50', gradient: 'from-blue-400 to-cyan-500' },
  FOLLOW: { icon: UserPlus, color: 'text-green-500', bg: 'bg-green-50', gradient: 'from-green-400 to-emerald-500' },
  MENTION: { icon: AtSign, color: 'text-purple-500', bg: 'bg-purple-50', gradient: 'from-purple-400 to-violet-500' },
  SYSTEM: { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-50', gradient: 'from-gray-400 to-slate-500' },
}

// Stagger animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.34, 1.56, 0.64, 1] as const
    }
  }
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/notifications?filter=${filter}`)
      const data = await res.json()
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    setDeletingId(id)
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id))
        setDeletingId(null)
      }, 300)
    } catch (error) {
      console.error('Failed to delete notification:', error)
      setDeletingId(null)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar user={(session?.user as any)?.id ? session?.user as any : { id: '', name: null, email: null, image: null }} />
      
      <main className="pt-20 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              <Link href="/">
                <motion.button
                  whileHover={{ x: -4 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 hover:bg-white/50 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </motion.button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-800">通知</h1>
              {unreadCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-2.5 py-0.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm rounded-full font-medium"
                >
                  {unreadCount}
                </motion.span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={markAllAsRead}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors font-medium"
                >
                  <CheckCheck className="w-4 h-4" />
                  全部已读
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05, rotate: 15 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 hover:bg-white/50 rounded-xl transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </motion.button>
            </div>
          </motion.div>

          {/* Filter Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 mb-6"
          >
            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}
              label="全部"
              count={notifications.length}
            />
            <FilterButton
              active={filter === 'unread'}
              onClick={() => setFilter('unread')}
              label="未读"
              count={unreadCount}
              showCount
            />
          </motion.div>

          {/* Notifications List */}
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <LoadingSkeleton />
            ) : notifications.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {notifications.map((notification, index) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    index={index}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    isDeleting={deletingId === notification.id}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-full flex items-center justify-center shadow-lg"
                >
                  <Bell className="w-10 h-10 text-purple-400" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {filter === 'unread' ? '没有未读通知' : '暂无通知'}
                </h3>
                <p className="text-gray-500">
                  {filter === 'unread' ? '你已经看完了所有通知！' : '当有新的互动时，你会在这里看到'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

function FilterButton({ 
  active, 
  onClick, 
  label, 
  count, 
  showCount 
}: { 
  active: boolean
  onClick: () => void
  label: string
  count: number
  showCount?: boolean
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        px-5 py-2.5 rounded-full text-sm font-medium transition-all
        ${active
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
          : 'bg-white/50 text-gray-600 hover:bg-white hover:shadow-md'
        }
      `}
    >
      {label}
      {showCount && count > 0 && (
        <span className={`ml-1.5 ${active ? 'text-white/80' : 'text-purple-600'}`}>
          ({count})
        </span>
      )}
    </motion.button>
  )
}

function NotificationItem({ 
  notification, 
  index,
  onMarkAsRead,
  onDelete,
  isDeleting
}: { 
  notification: Notification
  index: number
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  isDeleting: boolean
}) {
  const config = typeConfig[notification.type]
  const Icon = config.icon

  return (
    <motion.div
      layout
      variants={itemVariants}
      exit={{ opacity: 0, x: -100, height: 0 }}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
      className={`
        group relative flex items-start gap-4 p-4 rounded-2xl cursor-pointer
        transition-all duration-300 overflow-hidden
        ${notification.read 
          ? 'bg-white/50 hover:bg-white/70' 
          : 'bg-white shadow-md hover:shadow-lg border-l-4 border-purple-500'
        }
        ${isDeleting ? 'opacity-0' : ''}
      `}
    >
      {/* Avatar or Icon */}
      <div className="relative flex-shrink-0">
        {notification.actor ? (
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative"
          >
            <img
              src={notification.actor.image || '/default-avatar.png'}
              alt={notification.actor.name || ''}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-md"
            />
            {/* Type indicator badge */}
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r ${config.gradient} flex items-center justify-center border-2 border-white shadow-sm`}>
              <Icon className="w-3 h-3 text-white" />
            </div>
          </motion.div>
        ) : (
          <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${config.gradient} flex items-center justify-center shadow-md`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-gray-800 leading-relaxed">
          {notification.actor && (
            <span className="font-semibold text-gray-900">{notification.actor.name}</span>
          )}
          {' '}{notification.title}
        </p>
        {notification.content && (
          <p className="text-gray-500 text-sm mt-1.5 line-clamp-2 bg-gray-50 p-2 rounded-lg">
            &ldquo;{notification.content}&rdquo;
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-gray-400 text-xs">
            {formatTime(notification.createdAt)}
          </span>
          {!notification.read && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded-full font-medium">
              新消息
            </span>
          )}
        </div>
      </div>

      {/* Post thumbnail */}
      {notification.post?.images[0] && (
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden shadow-sm"
        >
          <img
            src={notification.post.images[0]}
            alt=""
            className="w-full h-full object-cover"
          />
        </motion.div>
      )}

      {/* Unread dot */}
      {!notification.read && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4 w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
        />
      )}

      {/* Delete button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        whileHover={{ scale: 1.1 }}
        onClick={(e) => {
          e.stopPropagation()
          onDelete(notification.id)
        }}
        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </motion.button>
    </motion.div>
  )
}

function LoadingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-start gap-4 p-4 bg-white/50 rounded-2xl"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full shimmer-gradient" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-3/4 shimmer-gradient" />
            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-1/2 shimmer-gradient" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
