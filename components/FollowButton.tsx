'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface FollowButtonProps {
  userId: string
  initialIsFollowing: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onFollowChange?: (isFollowing: boolean) => void
}

export function FollowButton({
  userId,
  initialIsFollowing,
  size = 'md',
  className = '',
  onFollowChange
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  }

  const handleFollow = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    const previousState = isFollowing
    
    // Optimistic update
    setIsFollowing(!isFollowing)
    onFollowChange?.(!isFollowing)

    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch(`/api/users/${userId}/follow`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          throw new Error('取消关注失败')
        }
        
        toast.success('已取消关注')
      } else {
        // Follow
        const response = await fetch(`/api/users/${userId}/follow`, {
          method: 'POST'
        })
        
        if (!response.ok) {
          throw new Error('关注失败')
        }
        
        toast.success('关注成功')
      }
    } catch (error) {
      // Rollback on error
      setIsFollowing(previousState)
      onFollowChange?.(previousState)
      toast.error('操作失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`
        ${sizes[size]}
        font-medium rounded-full transition-all duration-200
        ${isFollowing 
          ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 border border-gray-300' 
          : 'bg-blue-500 text-white hover:bg-blue-600'}
        ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          处理中
        </span>
      ) : (
        isFollowing ? '已关注' : '关注'
      )}
    </button>
  )
}
