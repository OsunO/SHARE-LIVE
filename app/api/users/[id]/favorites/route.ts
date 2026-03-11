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

    // Query favorites with post data
    const favorites = await prisma.favorite.findMany({
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

    const posts = favorites.map((f: typeof favorites[0]) => f.post).filter((p: typeof favorites[0]['post']) => p.published)

    const lastFavorite = favorites[favorites.length - 1]
    const nextCursor = lastFavorite?.id || null

    return NextResponse.json({
      posts: posts.map((post: typeof posts[0]) => ({
        ...post,
        createdAt: post.createdAt.toISOString()
      })),
      nextCursor,
      hasMore: favorites.length === limit
    })
  } catch (error) {
    console.error('Get favorites error:', error)
    return NextResponse.json({ error: '获取收藏失败' }, { status: 500 })
  }
}
