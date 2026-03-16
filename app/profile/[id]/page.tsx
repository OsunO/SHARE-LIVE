import { getServerSession } from 'next-auth/next'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FollowButton } from '@/components/FollowButton'
import { ProfileTabs } from '@/components/profile-tabs'
import { Navbar } from '@/components/navbar'
import { formatDate } from '@/lib/utils'
import { Camera, MapPin, Link as LinkIcon, Calendar } from 'lucide-react'
import Link from 'next/link'

interface ProfilePageProps {
  params: { id: string }
}

async function getUserProfile(userId: string, currentUserId?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      coverImage: true,
      location: true,
      website: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true
        }
      }
    }
  })

  if (!user) return null

  let isFollowing = false
  if (currentUserId && currentUserId !== userId) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId
        }
      }
    })
    isFollowing = !!follow
  }

  // Get total likes and favorites received
  const totalLikesReceived = await prisma.like.count({
    where: {
      post: { authorId: userId }
    }
  })

  const totalFavoritesReceived = await prisma.favorite.count({
    where: {
      post: { authorId: userId }
    }
  })

  return {
    ...user,
    isSelf: currentUserId === userId,
    isFollowing,
    stats: {
      totalLikesReceived,
      totalFavoritesReceived
    }
  }
}

async function getUserPosts(userId: string, currentUserId: string) {
  const posts = await prisma.post.findMany({
    where: { 
      authorId: userId,
      published: true 
    },
    include: {
      author: {
        select: { id: true, name: true, image: true }
      },
      _count: {
        select: { likes: true, comments: true, favorites: true }
      },
      likes: {
        where: { userId: currentUserId },
        select: { id: true }
      },
      favorites: {
        where: { userId: currentUserId },
        select: { id: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  const lastPost = posts[posts.length - 1]
  const initialCursor = lastPost?.id || null

  return {
    posts: posts.map((post: typeof posts[0]) => ({
      ...post,
      createdAt: post.createdAt.toISOString()
    })),
    initialCursor
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id
  
  const user = await getUserProfile(params.id, currentUserId)
  
  if (!user) {
    notFound()
  }

  const { posts, initialCursor } = await getUserPosts(params.id, currentUserId || '')

  // 默认封面图
  const defaultCover = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=400&fit=crop'

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar user={(session?.user as any)?.id ? session?.user as any : { id: '', name: null, email: null, image: null }} />
      
      <main className="pb-8">
        {/* Cover Image */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img 
            src={user.coverImage || defaultCover}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          
          {user.isSelf && (
            <button className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 hover:bg-white transition-colors flex items-center gap-2">
              <Camera className="w-4 h-4" />
              更换封面
            </button>
          )}
        </div>

        <div className="container mx-auto max-w-4xl px-4">
          {/* Profile Info Card */}
          <div className="relative -mt-20 mb-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
                {/* Avatar */}
                <div className="relative -mt-16 md:-mt-24">
                  {user.image ? (
                    <img 
                      src={user.image} 
                      alt={user.name || 'User'}
                      className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover ring-4 ring-white shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-4xl font-bold ring-4 ring-white shadow-lg">
                      {user.name?.[0] || 'U'}
                    </div>
                  )}
                  
                  {user.isSelf && (
                    <button className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:text-gray-900">
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-3">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {user.name || '匿名用户'}
                    </h1>
                    
                    {!user.isSelf && currentUserId && (
                      <FollowButton 
                        userId={user.id}
                        initialIsFollowing={user.isFollowing}
                        size="md"
                      />
                    )}
                    
                    {user.isSelf && (
                      <Link href="/settings/profile">
                        <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors">
                          编辑资料
                        </button>
                      </Link>
                    )}
                  </div>
                  
                  {user.bio && (
                    <p className="text-gray-600 mb-3 max-w-lg">{user.bio}</p>
                  )}
                  
                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    {user.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {user.location}
                      </span>
                    )}
                    {user.website && (
                      <a 
                        href={user.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-purple-600 hover:underline"
                      >
                        <LinkIcon className="w-4 h-4" />
                        {user.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(user.createdAt)} 加入
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
                <div className="text-center flex-1">
                  <span className="block text-xl font-bold text-gray-900">{user._count.posts}</span>
                  <span className="text-sm text-gray-500">帖子</span>
                </div>
                <Link href={`/profile/${user.id}/followers`} className="text-center flex-1 hover:bg-gray-50 py-2 rounded-lg transition-colors">
                  <span className="block text-xl font-bold text-gray-900">{user._count.followers}</span>
                  <span className="text-sm text-gray-500">粉丝</span>
                </Link>
                <Link href={`/profile/${user.id}/following`} className="text-center flex-1 hover:bg-gray-50 py-2 rounded-lg transition-colors">
                  <span className="block text-xl font-bold text-gray-900">{user._count.following}</span>
                  <span className="text-sm text-gray-500">关注</span>
                </Link>
                <div className="text-center flex-1">
                  <span className="block text-xl font-bold text-gray-900">{user.stats?.totalLikesReceived || 0}</span>
                  <span className="text-sm text-gray-500">获赞</span>
                </div>
                <div className="text-center flex-1">
                  <span className="block text-xl font-bold text-gray-900">{user.stats?.totalFavoritesReceived || 0}</span>
                  <span className="text-sm text-gray-500">获收藏</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Content */}
          <ProfileTabs
            userId={user.id}
            currentUserId={currentUserId || ''}
            initialPosts={posts}
            initialCursor={initialCursor}
            isSelf={user.isSelf}
          />
        </div>
      </main>
    </div>
  )
}
