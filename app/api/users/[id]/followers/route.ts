import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '20')

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            image: true,
            _count: {
              select: { followers: true }
            }
          }
        }
      },
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1
      }),
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    const lastFollow = followers[followers.length - 1]
    const nextCursor = lastFollow?.id || null

    const session = await getServerSession(authOptions)
    
    const followersWithStatus = await Promise.all(
      followers.map(async (f) => {
        let isFollowing = false
        if (session?.user?.id && session.user.id !== f.follower.id) {
          const follow = await prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: session.user.id,
                followingId: f.follower.id
              }
            }
          })
          isFollowing = !!follow
        }
        return {
          ...f.follower,
          isFollowing
        }
      })
    )

    return NextResponse.json({
      followers: followersWithStatus,
      nextCursor,
      hasMore: followers.length === limit
    })
  } catch (error) {
    console.error('Get followers error:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}
