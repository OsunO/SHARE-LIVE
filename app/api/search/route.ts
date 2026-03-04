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
    
    // Advanced filter params
    const timeRange = searchParams.get('timeRange')
    const dateStart = searchParams.get('dateStart')
    const dateEnd = searchParams.get('dateEnd')
    const tagsParam = searchParams.get('tags')
    const mediaType = searchParams.get('mediaType') || 'all'
    const sortBy = searchParams.get('sortBy') || 'relevance'

    if (!query.trim()) {
      return NextResponse.json({ posts: [], users: [], tags: [] })
    }

    const searchTerm = query.trim()
    const selectedTags = tagsParam ? tagsParam.split(',') : []
    
    // Build date filter
    let dateFilter: any = {}
    if (timeRange) {
      const now = new Date()
      switch (timeRange) {
        case '24h':
          dateFilter = { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
          break
        case 'week':
          dateFilter = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
          break
        case 'month':
          dateFilter = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
          break
        case 'custom':
          if (dateStart || dateEnd) {
            dateFilter = {}
            if (dateStart) dateFilter.gte = new Date(dateStart)
            if (dateEnd) dateFilter.lte = new Date(dateEnd)
          }
          break
      }
    }

    const results: any = { posts: [], users: [], tags: [] }

    // Search posts
    if (type === 'all' || type === 'posts') {
      // Build where clause
      const whereClause: any = {
        published: true,
        OR: [
          { content: { contains: searchTerm, mode: 'insensitive' } },
          { tags: { hasSome: [searchTerm] } },
          { aiTags: { hasSome: [searchTerm] } }
        ]
      }

      // Add date filter
      if (Object.keys(dateFilter).length > 0) {
        whereClause.createdAt = dateFilter
      }

      // Add tags filter
      if (selectedTags.length > 0) {
        whereClause.tags = { hasEvery: selectedTags }
      }

      // Add media type filter
      if (mediaType === 'image') {
        whereClause.images = { isEmpty: false }
      } else if (mediaType === 'video') {
        whereClause.videos = { isEmpty: false }
      }

      // Build order by
      let orderBy: any = {}
      switch (sortBy) {
        case 'time':
          orderBy = { createdAt: 'desc' }
          break
        case 'popularity':
          orderBy = { likes: { _count: 'desc' } }
          break
        default:
          // For relevance, we'll use createdAt as fallback
          orderBy = { createdAt: 'desc' }
      }

      const posts = await prisma.post.findMany({
        where: whereClause,
        include: {
          author: {
            select: { id: true, name: true, image: true }
          },
          _count: {
            select: { likes: true, comments: true, favorites: true }
          }
        },
        orderBy,
        take: 20
      })

      results.posts = posts.map(post => ({
        ...post,
        createdAt: post.createdAt.toISOString()
      }))
    }

    // Search users
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

    // Search tags
    if (type === 'all' || type === 'tags') {
      // Get tags matching search term
      const tagResults = await prisma.$queryRaw`
        SELECT DISTINCT unnest(tags) as tag, COUNT(*) as count
        FROM "Post"
        WHERE published = true
        AND EXISTS (
          SELECT 1 FROM unnest(tags) t
          WHERE LOWER(t) LIKE LOWER(${`%${searchTerm}%`})
        )
        ${Object.keys(dateFilter).length > 0 && dateFilter.gte 
          ? `AND "createdAt" >= '${dateFilter.gte.toISOString()}'` 
          : ''}
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
