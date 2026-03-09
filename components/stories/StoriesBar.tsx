'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { StoryViewer } from './StoryViewer'
import { CreateStoryModal } from './CreateStoryModal'

interface Story {
  id: string
  mediaUrl: string
  mediaType: 'IMAGE' | 'VIDEO'
  caption?: string
  createdAt: string
  expiresAt: string
  author: {
    id: string
    name: string
    image?: string
  }
  isViewed: boolean
}

export function StoriesBar() {
  const { data: session } = useSession()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserStories, setSelectedUserStories] = useState<Story[] | null>(null)
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    fetchStories()
  }, [])

  const fetchStories = async () => {
    try {
      const res = await fetch('/api/stories')
      if (res.ok) {
        const data = await res.json()
        setStories(data.stories || [])
      }
    } catch (error) {
      console.error('Failed to fetch stories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStoryCreated = () => {
    fetchStories()
  }

  const handleStoryViewed = async (storyId: string) => {
    // Mark story as viewed locally
    setStories(prev =>
      prev.map(story =>
        story.id === storyId ? { ...story, isViewed: true } : story
      )
    )
    
    // Send view request to server
    try {
      await fetch(`/api/stories/${storyId}/view`, { method: 'POST' })
    } catch (error) {
      console.error('Failed to mark story as viewed:', error)
    }
  }

  const handleDeleteStory = async (storyId: string) => {
    try {
      const res = await fetch(`/api/stories/${storyId}`, { method: 'DELETE' })
      if (res.ok) {
        setStories(prev => prev.filter(s => s.id !== storyId))
        // Close viewer if no more stories from this user
        const remainingStories = selectedUserStories?.filter(s => s.id !== storyId)
        if (!remainingStories || remainingStories.length === 0) {
          setSelectedUserStories(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete story:', error)
    }
  }

  const openUserStories = (userId: string) => {
    const userStories = stories.filter(s => s.author.id === userId)
    if (userStories.length > 0) {
      setSelectedUserStories(userStories)
      setSelectedStoryIndex(0)
    }
  }

  const currentUserStory = stories.find(s => s.author.id === session?.user?.id)
  const otherStories = stories.filter(s => s.author.id !== session?.user?.id)

  // Get unique users with their latest story for display
  const uniqueUserIds = Array.from(new Set(otherStories.map(s => s.author.id)))
  const displayStories = uniqueUserIds.map(userId => 
    otherStories.find(s => s.author.id === userId)!
  )

  // Check if current user has new story (within last 24 hours)
  const hasNewStory = currentUserStory && 
    new Date(currentUserStory.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 py-3 px-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 shimmer-gradient" />
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 shimmer-gradient" />
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 shimmer-gradient" />
        </div>
      </div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="bg-white/80 backdrop-blur-sm border-b border-gray-100 py-3 overflow-x-auto scrollbar-hide"
      >
        <div className="flex gap-4 min-w-max px-4">
          {/* Add Story Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreateModalOpen(true)}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              hasNewStory 
                ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]' 
                : 'border-2 border-dashed border-purple-300 hover:border-purple-400'
            }`}>
              <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center overflow-hidden">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt="Your avatar"
                    width={56}
                    height={56}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
                    {session?.user?.name?.[0] || '?'}
                  </div>
                )}
              </div>
              
              {/* Add button */}
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 90 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
              </motion.div>
              
              {/* New story indicator */}
              {hasNewStory && (
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>
            <span className="text-xs text-gray-600 font-medium">你的快拍</span>
          </motion.button>

          {/* Story Bubbles */}
          {displayStories.map((story, index) => (
            <motion.button
              key={story.author.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openUserStories(story.author.id)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div
                className={`p-[2px] rounded-full transition-all duration-300 ${
                  story.isViewed
                    ? 'bg-gray-200'
                    : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 animate-pulse-glow'
                }`}
              >
                <div className="p-[2px] bg-white rounded-full">
                  {story.author.image ? (
                    <Image
                      src={story.author.image}
                      alt={story.author.name || 'User'}
                      width={56}
                      height={56}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-lg">
                      {story.author.name?.[0] || '?'}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-600 font-medium truncate max-w-[64px] group-hover:text-purple-600 transition-colors">
                {story.author.name || '用户'}
              </span>
            </motion.button>
          ))}
          
          {/* Empty state hint */}
          {displayStories.length === 0 && !currentUserStory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 px-4 py-2"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <span className="text-2xl">📸</span>
              </div>
              <p className="text-sm text-gray-500">
                还没有快拍，<br />点击左侧添加你的第一个快拍！
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Story Viewer */}
      <AnimatePresence>
        {selectedUserStories && (
          <StoryViewer
            stories={selectedUserStories}
            initialIndex={selectedStoryIndex}
            onClose={() => setSelectedUserStories(null)}
            onView={handleStoryViewed}
            onDelete={handleDeleteStory}
          />
        )}
      </AnimatePresence>

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleStoryCreated}
      />
    </>
  )
}
