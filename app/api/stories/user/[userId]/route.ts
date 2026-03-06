export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 获取指定用户的所有故事
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { userId } = await params
    const currentUserId = session.user.id
    const now = new Date()

    // 获取该用户的未过期故事
    const stories = await prisma.story.findMany({
      where: {
        authorId: userId,
        expiresAt: { gt: now }
      },
      include: {
        author: {
          select: { id: true, name: true, image: true }
        },
        views: {
          where: { viewerId: currentUserId },
          select: { id: true, viewedAt: true }
        },
        _count: {
          select: { views: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // 转换格式
    const formattedStories = stories.map(story => ({
      id: story.id,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      caption: story.caption,
      createdAt: story.createdAt.toISOString(),
      expiresAt: story.expiresAt.toISOString(),
      author: story.author,
      isViewed: story.views.length > 0,
      viewedAt: story.views[0]?.viewedAt?.toISOString() || null,
      viewCount: story._count.views
    }))

    return NextResponse.json({ stories: formattedStories })
  } catch (error) {
    console.error('Get user stories error:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}
