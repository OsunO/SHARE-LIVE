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
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'all'

    if (!query.trim()) {
      return NextResponse.json({ posts: [], users: [], tags: [] })
    }

    const searchTerm = query.trim()
    const results: any = { posts: [], users: [], tags: [] }

    // 搜索帖子
    if (type === 'all' || type === 'posts') {
      const posts = await prisma.post.findMany({
        where: {
          published: true,
          OR: [
            { content: { contains: searchTerm, mode: 'insensitive' } },
            { tags: { hasSome: [searchTerm] } },
            { aiTags: { hasSome: [searchTerm] } }
          ]
        },
        include: {
          author: {
            select: { id: true, name: true, image: true }
          },
          _count: {
            select: { likes: true, comments: true, favorites: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })

      results.posts = posts.map(post => ({
        ...post,
        createdAt: post.createdAt.toISOString()
      }))
    }

    // 搜索用户
    if (type === 'all' || type === 'users') {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
          _count: {
            select: {
              followers: true,
              following: true,
              posts: true
            }
          }
        },
        take: 10
      })

      results.users = users
    }

    // 搜索标签
    if (type === 'all' || type === 'tags') {
      // 获取包含搜索词的热门标签
      const tagResults = await prisma.$queryRaw`
        SELECT DISTINCT unnest(tags) as tag, COUNT(*) as count
        FROM "Post"
        WHERE published = true
        AND EXISTS (
          SELECT 1 FROM unnest(tags) t
          WHERE LOWER(t) LIKE LOWER(${`%${searchTerm}%`})
        )
        GROUP BY unnest(tags)
        ORDER BY count DESC
        LIMIT 20
      `

      results.tags = tagResults
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
