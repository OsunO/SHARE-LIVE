import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '10')
    const userId = session.user.id

    // Get list of users being followed
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    })

    const followingIds = following.map((f) => f.followingId)

    // Include user's own posts plus posts from followed users
    const authorIds = [userId, ...followingIds]

    const posts = await prisma.post.findMany({
      where: {
        authorId: { in: authorIds },
        published: true
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            favorites: true
          }
        },
        likes: {
          where: { userId },
          select: { id: true }
        },
        favorites: {
          where: { userId },
          select: { id: true }
        }
      },
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    const lastPost = posts[posts.length - 1]
    const nextCursor = lastPost?.id || null

    return NextResponse.json({
      posts: posts.map((post) => ({
        ...post,
        isLiked: post.likes.length > 0,
        isFavorited: post.favorites.length > 0,
        likes: post._count.likes,
        comments: post._count.comments,
        favorites: post._count.favorites
      })),
      nextCursor,
      hasMore: posts.length === limit
    })
  } catch (error) {
    console.error('Feed error:', error)
    return NextResponse.json({ error: '获取动态失败' }, { status: 500 })
  }
}
