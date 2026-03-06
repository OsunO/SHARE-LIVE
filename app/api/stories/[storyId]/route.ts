export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 删除故事
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { storyId } = await params

    // 检查故事是否存在且属于当前用户
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { authorId: true }
    })

    if (!story) {
      return NextResponse.json({ error: '故事不存在' }, { status: 404 })
    }

    if (story.authorId !== session.user.id) {
      return NextResponse.json({ error: '无权删除' }, { status: 403 })
    }

    // 删除故事（关联的 views 会自动级联删除）
    await prisma.story.delete({
      where: { id: storyId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete story error:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
