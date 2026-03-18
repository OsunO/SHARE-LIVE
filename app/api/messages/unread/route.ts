import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/messages/unread
 * 获取未读消息数量
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const userId = session.user.id

    // 统计未读消息数
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: userId,
        read: false
      }
    })

    // 获取每个会话的未读数
    const unreadByConversation = await prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        receiverId: userId,
        read: false
      },
      _count: true
    })

    return NextResponse.json({
      total: unreadCount,
      byConversation: unreadByConversation.reduce((acc: Record<string, number>, item: { conversationId: string; _count: number }) => {
        acc[item.conversationId] = item._count
        return acc
      }, {} as Record<string, number>)
    })
  } catch (error) {
    console.error('Get unread count error:', error)
    return NextResponse.json({ error: '获取未读数失败' }, { status: 500 })
  }
}