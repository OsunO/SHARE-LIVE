import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const POSTS_PER_PAGE = 10

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || String(POSTS_PER_PAGE))
    const userId = params.id
    const currentUserId = session.user.id

    // Query likes with post data
    const likes = await prisma.like.findMany({
      where: { userId },
      include: {
        post: {
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

    const posts = likes.map((l: typeof likes[0]) => l.post).filter((p: typeof likes[0]['post']) => p.published)

    const lastLike = likes[likes.length - 1]
    const nextCursor = lastLike?.id || null

    return NextResponse.json({
      posts: posts.map((post: typeof posts[0]) => ({
        ...post,
        createdAt: post.createdAt.toISOString()
      })),
      nextCursor,
      hasMore: likes.length === limit
    })
  } catch (error) {
    console.error('Get likes error:', error)
    return NextResponse.json({ error: '获取点赞记录失败' }, { status: 500 })
  }
}
