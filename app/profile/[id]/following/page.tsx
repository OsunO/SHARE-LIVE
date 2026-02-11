import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ArrowLeft, Users } from 'lucide-react'
import Link from 'next/link'
import { FollowButton } from '@/components/FollowButton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface FollowingPageProps {
  params: { id: string }
  searchParams: { cursor?: string }
}

async function getUserAndFollowing(
  userId: string,
  currentUserId?: string,
  cursor?: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, image: true }
  })

  if (!user) return null

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    include: {
      following: {
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
          _count: { select: { followers: true } }
        }
      }
    },
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { createdAt: 'desc' },
    take: 20
  })

  const lastFollow = following[following.length - 1]
  const nextCursor = lastFollow?.id || null

  const followingWithStatus = await Promise.all(
    following.map(async (f) => {
      let isFollowing = false
      if (currentUserId && currentUserId !== f.following.id) {
        const follow = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: f.following.id
            }
          }
        })
        isFollowing = !!follow
      }
      return {
        ...f.following,
        isFollowing,
        isSelf: currentUserId === f.following.id
      }
    })
  )

  return {
    user,
    following: followingWithStatus,
    nextCursor
  }
}

export default async function FollowingPage({
  params,
  searchParams
}: FollowingPageProps) {
  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id

  const data = await getUserAndFollowing(
    params.id,
    currentUserId,
    searchParams.cursor
  )

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">用户不存在</p>
        </div>
      </div>
    )
  }

  const { user, following, nextCursor } = data

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href={`/profile/${user.id}`}>
            <Button variant="ghost" size="icon" className="hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="font-semibold text-lg">关注</h1>
            <p className="text-sm text-gray-500">{user.name}</p>
          </div>
        </div>
      </div>

      {/* Following List */}
      <div className="max-w-2xl mx-auto">
        {following.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Users className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">还没有关注任何人</p>
            <p className="text-gray-400 text-sm mt-2">
              关注其他用户查看他们的动态
            </p>
          </div>
        ) : (
          <div className="bg-white divide-y divide-gray-100">
            {following.map((followedUser) => (
              <div
                key={followedUser.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <Link
                  href={`/profile/${followedUser.id}`}
                  className="flex items-center gap-3 flex-1"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={followedUser.image || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                      {followedUser.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {followedUser.name || '匿名用户'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {followedUser._count.followers} 粉丝
                    </p>
                    {followedUser.bio && (
                      <p className="text-sm text-gray-400 truncate mt-1">
                        {followedUser.bio}
                      </p>
                    )}
                  </div>
                </Link>

                {!followedUser.isSelf && currentUserId && (
                  <FollowButton
                    userId={followedUser.id}
                    initialIsFollowing={followedUser.isFollowing}
                    size="sm"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {nextCursor && (
          <div className="p-4 text-center">
            <Link
              href={`/profile/${user.id}/following?cursor=${nextCursor}`}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              加载更多
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
