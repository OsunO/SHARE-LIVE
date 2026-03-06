export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma, Prisma } from '@/lib/prisma'

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
      // Build base where conditions for Prisma query
      const whereConditions: string[] = ['published = true']
      
      // Content search (case insensitive)
      whereConditions.push(`(
        LOWER(content) LIKE LOWER('%${searchTerm.replace(/'/g, "''")}%')
        OR EXISTS (
          SELECT 1 FROM unnest(tags) t 
          WHERE LOWER(t) LIKE LOWER('%${searchTerm.replace(/'/g, "''")}%')
        )
        OR EXISTS (
          SELECT 1 FROM unnest("aiTags") t 
          WHERE LOWER(t) LIKE LOWER('%${searchTerm.replace(/'/g, "''")}%')
        )
      )`)

      // Add date filter
      if (Object.keys(dateFilter).length > 0) {
        if (dateFilter.gte) {
          whereConditions.push(`"createdAt" >= '${dateFilter.gte.toISOString()}'`)
        }
        if (dateFilter.lte) {
          whereConditions.push(`"createdAt" <= '${dateFilter.lte.toISOString()}'`)
        }
      }

      // Add tags filter (must have all selected tags)
      if (selectedTags.length > 0) {
        const tagChecks = selectedTags.map(tag => 
          `EXISTS (SELECT 1 FROM unnest(tags) t WHERE LOWER(t) = LOWER('${tag.replace(/'/g, "''")}'))`
        ).join(' AND ')
        whereConditions.push(`(${tagChecks})`)
      }

      // Add media type filter
      if (mediaType === 'image') {
        whereConditions.push(`array_length(images, 1) > 0`)
      } else if (mediaType === 'video') {
        whereConditions.push(`array_length(videos, 1) > 0`)
      }

      // Build order by
      let orderByClause = ''
      switch (sortBy) {
        case 'time':
          orderByClause = '"createdAt" DESC'
          break
        case 'popularity':
          orderByClause = '(SELECT COUNT(*) FROM "Like" WHERE "postId" = p.id) DESC'
          break
        default:
          // For relevance: prioritize exact matches in aiTags, then partial matches
          orderByClause = `
            CASE 
              WHEN EXISTS (SELECT 1 FROM unnest("aiTags") t WHERE LOWER(t) = LOWER('${searchTerm.replace(/'/g, "''")}')) THEN 3
              WHEN EXISTS (SELECT 1 FROM unnest(tags) t WHERE LOWER(t) = LOWER('${searchTerm.replace(/'/g, "''")}')) THEN 2
              WHEN LOWER(content) LIKE LOWER('%${searchTerm.replace(/'/g, "''")}%') THEN 1
              ELSE 0
            END DESC,
            "createdAt" DESC
          `
      }

      // Execute raw query for complex filtering
      const whereClause = whereConditions.join(' AND ')
      const postsRaw = await prisma.$queryRaw`
        SELECT 
          p.id,
          p.content,
          p.images,
          p.videos,
          p.tags,
          p."aiTags",
          p."aiDescription",
          p."createdAt",
          p."updatedAt",
          p."authorId",
          json_build_object(
            'id', u.id,
            'name', u.name,
            'image', u.image
          ) as author,
          json_build_object(
            'likes', (SELECT COUNT(*) FROM "Like" WHERE "postId" = p.id),
            'comments', (SELECT COUNT(*) FROM "Comment" WHERE "postId" = p.id),
            'favorites', (SELECT COUNT(*) FROM "Favorite" WHERE "postId" = p.id)
          ) as _count
        FROM "Post" p
        JOIN "User" u ON p."authorId" = u.id
        WHERE ${Prisma.raw(whereClause)}
        ORDER BY ${Prisma.raw(orderByClause)}
        LIMIT 20
      `

      results.posts = (postsRaw as any[]).map(post => ({
        ...post,
        createdAt: new Date(post.createdAt).toISOString(),
        updatedAt: new Date(post.updatedAt).toISOString()
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

    // Search tags (include both user tags and AI tags)
    if (type === 'all' || type === 'tags') {
      // Get user tags matching search term
      const userTagResults = await prisma.$queryRaw`
        SELECT DISTINCT unnest(tags) as tag, COUNT(*) as count
        FROM "Post"
        WHERE published = true
        AND EXISTS (
          SELECT 1 FROM unnest(tags) t
          WHERE LOWER(t) LIKE LOWER(${`%${searchTerm}%`})
        )
        ${Object.keys(dateFilter).length > 0 && dateFilter.gte 
          ? Prisma.raw(`AND "createdAt" >= '${dateFilter.gte.toISOString()}'`) 
          : Prisma.raw('')}
        GROUP BY unnest(tags)
        ORDER BY count DESC
        LIMIT 20
      `

      // Get AI tags matching search term
      const aiTagResults = await prisma.$queryRaw`
        SELECT DISTINCT unnest("aiTags") as tag, COUNT(*) as count
        FROM "Post"
        WHERE published = true
        AND EXISTS (
          SELECT 1 FROM unnest("aiTags") t
          WHERE LOWER(t) LIKE LOWER(${`%${searchTerm}%`})
        )
        ${Object.keys(dateFilter).length > 0 && dateFilter.gte 
          ? Prisma.raw(`AND "createdAt" >= '${dateFilter.gte.toISOString()}'`) 
          : Prisma.raw('')}
        GROUP BY unnest("aiTags")
        ORDER BY count DESC
        LIMIT 20
      `

      // Merge and deduplicate tags
      const tagMap = new Map<string, number>()
      
      ;(userTagResults as any[]).forEach((item: any) => {
        const tag = item.tag.toLowerCase()
        tagMap.set(tag, (tagMap.get(tag) || 0) + parseInt(item.count))
      })
      
      ;(aiTagResults as any[]).forEach((item: any) => {
        const tag = item.tag.toLowerCase()
        tagMap.set(tag, (tagMap.get(tag) || 0) + parseInt(item.count))
      })

      // Convert back to array and sort by count
      results.tags = Array.from(tagMap.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)
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
