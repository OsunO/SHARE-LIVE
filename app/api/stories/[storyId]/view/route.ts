export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 标记故事为已查看
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { storyId } = await params
    const currentUserId = session.user.id

    // 检查故事是否存在
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { authorId: true }
    })

    if (!story) {
      return NextResponse.json({ error: '故事不存在' }, { status: 404 })
    }

    // 不能标记自己的故事为已查看
    if (story.authorId === currentUserId) {
      return NextResponse.json({ error: '不能查看自己的故事' }, { status: 400 })
    }

    // 创建或更新查看记录
    await prisma.storyView.upsert({
      where: {
        storyId_viewerId: {
          storyId,
          viewerId: currentUserId
        }
      },
      update: {
        viewedAt: new Date()
      },
      create: {
        storyId,
        viewerId: currentUserId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark story viewed error:', error)
    return NextResponse.json({ error: '标记失败' }, { status: 500 })
  }
}
