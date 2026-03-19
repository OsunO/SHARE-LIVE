import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/moderation'

/**
 * GET /api/admin/stats
 * 获取平台统计数据（管理员专用）
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 检查管理员权限
    const isAdmin = await checkAdmin(session.user.email)
    if (!isAdmin) {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 })
    }

    // 获取基础统计
    const [
      totalUsers,
      totalPosts,
      totalLikes,
      totalFavorites,
      totalComments,
      totalFollows,
      totalMessages,
      totalStories,
      pendingModeration
    ] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.like.count(),
      prisma.favorite.count(),
      prisma.comment.count(),
      prisma.follow.count(),
      prisma.message.count(),
      prisma.story.count(),
      prisma.post.count({ where: { moderationStatus: 'PENDING' } })
    ])

    // 获取最近7天的用户增长
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentUsers = await prisma.user.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: true
    })

    // 按日期分组
    const userGrowth: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      userGrowth[dateStr] = 0
    }
    
    recentUsers.forEach((item: { createdAt: Date; _count: number }) => {
      const dateStr = item.createdAt.toISOString().split('T')[0]
      if (userGrowth[dateStr] !== undefined) {
        userGrowth[dateStr]++
      }
    })

    // 获取最近7天的帖子增长
    const recentPosts = await prisma.post.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: sevenDaysAgo } }
    })

    const postGrowth: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      postGrowth[dateStr] = 0
    }

    recentPosts.forEach((item: { createdAt: Date }) => {
      const dateStr = item.createdAt.toISOString().split('T')[0]
      if (postGrowth[dateStr] !== undefined) {
        postGrowth[dateStr]++
      }
    })

    // 获取热门标签
    const allPosts = await prisma.post.findMany({
      select: { tags: true }
    })
    
    const tagCounts: Record<string, number> = {}
    allPosts.forEach((post: { tags: string[] }) => {
      post.tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })

    const popularTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    // 获取活跃用户（最近7天发帖最多的）
    const activeUsers = await prisma.user.findMany({
      where: { posts: { some: { createdAt: { gte: sevenDaysAgo } } } },
      select: {
        id: true,
        name: true,
        image: true,
        _count: { select: { posts: true } }
      },
      orderBy: { posts: { _count: 'desc' } },
      take: 5
    })

    return NextResponse.json({
      overview: {
        totalUsers,
        totalPosts,
        totalLikes,
        totalFavorites,
        totalComments,
        totalFollows,
        totalMessages,
        totalStories,
        pendingModeration
      },
      charts: {
        userGrowth,
        postGrowth
      },
      popularTags,
      activeUsers
    })
  } catch (error) {
    console.error('Get admin stats error:', error)
    return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 })
  }
}