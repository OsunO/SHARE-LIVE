import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'trending'
    const limit = parseInt(searchParams.get('limit') || '20')

    let posts: any[] = []
    let orderBy: any = {}

    switch (filter) {
      case 'trending':
        // 按点赞数和评论数综合排序（热门）
        posts = await prisma.post.findMany({
          where: { published: true },
          include: {
            author: {
              select: { id: true, name: true, image: true }
            },
            _count: {
              select: { likes: true, comments: true, favorites: true }
            }
          },
          take: limit
        })
        // 手动排序：按互动总数
        posts.sort((a, b) => {
          const scoreA = a._count.likes + a._count.comments * 2 + a._count.favorites * 3
          const scoreB = b._count.likes + b._count.comments * 2 + b._count.favorites * 3
          return scoreB - scoreA
        })
        break

      case 'latest':
        posts = await prisma.post.findMany({
          where: { published: true },
          include: {
            author: {
              select: { id: true, name: true, image: true }
            },
            _count: {
              select: { likes: true, comments: true, favorites: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        })
        break

      case 'nearby':
        // TODO: 实现基于地理位置的查询
        // 目前返回最新的内容作为占位
        posts = await prisma.post.findMany({
          where: { published: true },
          include: {
            author: {
              select: { id: true, name: true, image: true }
            },
            _count: {
              select: { likes: true, comments: true, favorites: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        })
        break

      default:
        posts = await prisma.post.findMany({
          where: { published: true },
          include: {
            author: {
              select: { id: true, name: true, image: true }
            },
            _count: {
              select: { likes: true, comments: true, favorites: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        })
    }

    // 序列化日期
    const serializedPosts = posts.map(post => ({
      ...post,
      createdAt: post.createdAt.toISOString()
    }))

    return NextResponse.json({ posts: serializedPosts })
  } catch (error) {
    console.error('Discover API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discover content' },
      { status: 500 }
    )
  }
}
