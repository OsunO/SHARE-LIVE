import { getServerSession } from 'next-auth/next'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FollowButton } from '@/components/FollowButton'
import { InfiniteFeed } from '@/components/infinite-feed'
import { Navbar } from '@/components/navbar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from '@/lib/utils'

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

  return {
    ...user,
    isSelf: currentUserId === userId,
    isFollowing
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
    posts: posts.map(post => ({
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={session?.user} />
      
      <main className="container mx-auto max-w-4xl px-4 py-6">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            {user.image ? (
              <img 
                src={user.image} 
                alt={user.name || 'User'}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-gray-50"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-gray-50">
                {user.name?.[0] || 'U'}
              </div>
            )}
            
            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.name || '匿名用户'}
                </h1>
                
                {!user.isSelf && currentUserId && (
                  <FollowButton 
                    userId={user.id}
                    initialIsFollowing={user.isFollowing}
                    size="sm"
                  />
                )}
              </div>
              
              {user.bio && (
                <p className="text-gray-600 mb-3 max-w-lg">{user.bio}</p>
              )}
              
              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <span className="font-bold text-gray-900 text-lg">{user._count.posts}</span>
                  <p className="text-gray-500"> posts</p>
                </div>
                <div className="text-center">
                  <a href={`/profile/${user.id}/followers`} className="block hover:text-blue-500 transition-colors">
                    <span className="font-bold text-gray-900 text-lg">{user._count.followers}</span>
                    <p className="text-gray-500"> followers</p>
                  </a>
                </div>
                <div className="text-center">
                  <a href={`/profile/${user.id}/following`} className="block hover:text-blue-500 transition-colors">
                    <span className="font-bold text-gray-900 text-lg">{user._count.following}</span>
                    <p className="text-gray-500"> following</p>
                  </a>
                </div>
              </div>
              
              <p className="text-xs text-gray-400 mt-3">
                加入时间 {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Content */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full bg-white border-b rounded-none justify-start mb-4">
            <TabsTrigger value="posts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent">
              Posts
            </TabsTrigger>
            <TabsTrigger value="saved" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent">
              Saved
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts">
            {posts.length > 0 ? (
              <InfiniteFeed 
                initialPosts={posts}
                initialCursor={initialCursor}
                currentUserId={currentUserId || ''}
              />
            ) : (
              <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
                <p className="text-lg mb-2">no posts yet</p>
                {user.isSelf && <p className="text-sm">share your first post!</p>}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="saved">
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
              <p>saved feature coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
