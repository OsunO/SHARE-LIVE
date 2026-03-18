import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/moderation'

/**
 * POST /api/moderation/reject
 * 拒绝内容（管理员专用）
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 检查管理员权限
    const isAdmin = await checkAdmin(session.user.email)
    if (!isAdmin) {
      return NextResponse.json({ error: '无权限操作' }, { status: 403 })
    }

    const { postId, postIds, reason } = await req.json()

    // 支持单个或批量操作
    const ids = postIds || (postId ? [postId] : [])
    if (ids.length === 0) {
      return NextResponse.json({ error: '缺少内容ID' }, { status: 400 })
    }

    if (!reason) {
      return NextResponse.json({ error: '拒绝原因不能为空' }, { status: 400 })
    }

    // 更新帖子状态
    const operations = ids.flatMap((id: string) => [
      prisma.post.update({
        where: { id },
        data: {
          moderationStatus: 'REJECTED',
          moderationReason: reason,
          moderatedAt: new Date(),
          moderatedBy: session.user.id,
          published: false // 拒绝的内容不公开
        }
      }),
      prisma.moderationLog.create({
        data: {
          postId: id,
          action: 'REJECTED',
          reason,
          reviewerId: session.user.id
        }
      })
    ])

    await prisma.$transaction(operations)

    return NextResponse.json({ 
      success: true, 
      count: ids.length,
      message: `已拒绝 ${ids.length} 条内容` 
    })
  } catch (error) {
    console.error('Reject post error:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}