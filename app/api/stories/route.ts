export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 获取故事列表 - 返回关注用户的最新故事
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const currentUserId = session.user.id
    const now = new Date()

    // 获取当前用户关注的人
    const following = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true }
    })
    const followingIds = following.map(f => f.followingId)

    // 包括自己
    const userIds = [currentUserId, ...followingIds]

    // 获取这些用户的未过期故事，按用户分组取最新的
    const stories = await prisma.story.findMany({
      where: {
        authorId: { in: userIds },
        expiresAt: { gt: now }
      },
      include: {
        author: {
          select: { id: true, name: true, image: true }
        },
        views: {
          where: { viewerId: currentUserId },
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 按作者分组，每个作者只保留最新的一个用于展示气泡
    const authorStoriesMap = new Map()
    stories.forEach(story => {
      if (!authorStoriesMap.has(story.authorId)) {
        authorStoriesMap.set(story.authorId, {
          ...story,
          isViewed: story.views.length > 0
        })
      }
    })

    // 转换格式
    const formattedStories = Array.from(authorStoriesMap.values()).map(story => ({
      id: story.id,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      caption: story.caption,
      createdAt: story.createdAt.toISOString(),
      expiresAt: story.expiresAt.toISOString(),
      author: story.author,
      isViewed: story.isViewed
    }))

    // 排序：未查看的在前，然后是自己，最后按时间
    formattedStories.sort((a, b) => {
      const aIsMe = a.author.id === currentUserId
      const bIsMe = b.author.id === currentUserId
      
      if (aIsMe && !bIsMe) return -1
      if (!aIsMe && bIsMe) return 1
      
      if (!a.isViewed && b.isViewed) return -1
      if (a.isViewed && !b.isViewed) return 1
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json({ stories: formattedStories })
  } catch (error) {
    console.error('Get stories error:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

// 创建故事
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { mediaUrl, mediaType, caption } = await req.json()

    if (!mediaUrl || !mediaType) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    // 24小时后过期
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const story = await prisma.story.create({
      data: {
        mediaUrl,
        mediaType,
        caption,
        expiresAt,
        authorId: session.user.id
      },
      include: {
        author: {
          select: { id: true, name: true, image: true }
        }
      }
    })

    return NextResponse.json({
      ...story,
      createdAt: story.createdAt.toISOString(),
      expiresAt: story.expiresAt.toISOString(),
      isViewed: false
    })
  } catch (error) {
    console.error('Create story error:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
