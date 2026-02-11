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

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // Check if current user is following this user
    const session = await getServerSession(authOptions)
    let isFollowing = false
    
    if (session?.user?.id && session.user.id !== userId) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: userId
          }
        }
      })
      isFollowing = !!follow
    }

    return NextResponse.json({
      ...user,
      isFollowing,
      isSelf: session?.user?.id === userId
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}
