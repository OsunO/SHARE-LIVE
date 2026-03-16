'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Story {
  id: string
  mediaUrl: string
  mediaType: 'IMAGE' | 'VIDEO'
  caption?: string
  createdAt: string
  author: {
    id: string
    name: string
    image?: string
  }
}

interface StoryViewerProps {
  stories: Story[]
  initialIndex: number
  onClose: () => void
  onView: (storyId: string) => void
  onDelete?: (storyId: string) => void
}

const STORY_DURATION = 5000 // 5 seconds auto-advance

export function StoryViewer({ stories, initialIndex, onClose, onView, onDelete }: StoryViewerProps) {
  const { data: session } = useSession()
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const currentStory = stories[currentIndex]
  const isOwner = session?.user?.id === currentStory?.author.id

  // Mark as viewed when story changes
  useEffect(() => {
    if (currentStory) {
      onView(currentStory.id)
    }
  }, [currentStory?.id, onView])

  // Auto-advance progress
  useEffect(() => {
    if (isPaused || isLoading) return

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goToNext()
          return 0
        }
        return prev + (100 / (STORY_DURATION / 50))
      })
    }, 50)

    return () => clearInterval(interval)
  }, [isPaused, isLoading, currentIndex])

  const goToNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setProgress(0)
      setIsLoading(true)
    } else {
      onClose()
    }
  }, [currentIndex, stories.length, onClose])

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setProgress(0)
      setIsLoading(true)
    }
  }, [currentIndex])

  const handleDelete = async () => {
    if (!isOwner || !onDelete) return
    
    try {
      const res = await fetch(`/api/stories/${currentStory.id}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        onDelete(currentStory.id)
        if (stories.length === 1) {
          onClose()
        } else {
          goToNext()
        }
      }
    } catch (error) {
      console.error('Delete story error:', error)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goToNext()
      if (e.key === 'ArrowLeft') goToPrev()
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNext, goToPrev, onClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black"
      onClick={onClose}
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
        {stories.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white"
              initial={{ width: 0 }}
              animate={{ 
                width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
              }}
              transition={{ duration: 0 }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-6 left-0 right-0 z-10 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {currentStory.author.image && (
            <img
              src={currentStory.author.image}
              alt={currentStory.author.name}
              className="w-10 h-10 rounded-full border-2 border-white object-cover"
            />
          )}
          <div>
            <p className="text-white font-medium">{currentStory.author.name}</p>
            <p className="text-white/60 text-xs">
              {new Date(currentStory.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isOwner && onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete() }}
              className="p-2 text-white/80 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Story content */}
      <div 
        className="relative w-full h-full flex items-center justify-center"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStory.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.2 }}
            className="relative w-full h-full max-w-lg mx-auto"
          >
            {currentStory.mediaType === 'IMAGE' ? (
              <img
                src={currentStory.mediaUrl}
                alt="Story"
                className="w-full h-full object-contain"
                onLoad={() => setIsLoading(false)}
              />
            ) : (
              <video
                src={currentStory.mediaUrl}
                className="w-full h-full object-contain"
                autoPlay
                playsInline
                muted
                onLoadedData={() => setIsLoading(false)}
                onEnded={goToNext}
              />
            )}
            
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-20 left-4 right-4 text-center">
            <p className="text-white text-lg drop-shadow-lg">{currentStory.caption}</p>
          </div>
        )}
      </div>

      {/* Navigation areas */}
      <div className="absolute inset-y-0 left-0 w-1/4 flex items-center">
        <button
          onClick={(e) => { e.stopPropagation(); goToPrev() }}
          className={`p-2 ml-2 text-white/50 hover:text-white transition-colors ${currentIndex === 0 ? 'opacity-0 pointer-events-none' : ''}`}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      </div>
      
      <div className="absolute inset-y-0 right-0 w-1/4 flex items-center justify-end">
        <button
          onClick={(e) => { e.stopPropagation(); goToNext() }}
          className="p-2 mr-2 text-white/50 hover:text-white transition-colors"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </motion.div>
  )
}
