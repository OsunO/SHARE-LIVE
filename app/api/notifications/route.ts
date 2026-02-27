import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/notifications - 获取当前用户的通知列表
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      recipientId: session.user.id
    }

    if (filter === 'unread') {
      where.read = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        actor: {
          select: { id: true, name: true, image: true }
        },
        post: {
          select: { id: true, images: true, content: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    // 序列化日期
    const serializedNotifications = notifications.map(n => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString()
    }))

    // 获取未读数量
    const unreadCount = await prisma.notification.count({
      where: { recipientId: session.user.id, read: false }
    })

    return NextResponse.json({ 
      notifications: serializedNotifications,
      unreadCount,
      hasMore: notifications.length === limit
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST /api/notifications - 创建通知（内部使用）
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { type, title, content, recipientId, postId, commentId } = body

    // 不能给自己发通知
    if (recipientId === session.user.id) {
      return NextResponse.json({ success: true }) // 静默忽略
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        content,
        recipientId,
        actorId: session.user.id,
        postId,
        commentId
      }
    })

    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Create notification error:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}
