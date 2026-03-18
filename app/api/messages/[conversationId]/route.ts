import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const MESSAGES_PER_PAGE = 50

/**
 * GET /api/messages/[conversationId]
 * 获取会话中的消息列表
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { conversationId } = await params
    const userId = session.user.id

    // 验证用户是否参与该会话
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      include: {
        user1: {
          select: { id: true, name: true, image: true }
        },
        user2: {
          select: { id: true, name: true, image: true }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || String(MESSAGES_PER_PAGE))

    // 获取消息
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, name: true, image: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1
      }),
      take: limit
    })

    // 标记发给自己的消息为已读
    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        read: false
      },
      data: {
        read: true,
        readAt: new Date()
      }
    })

    // 确定对方用户
    const otherUser = conversation.user1Id === userId 
      ? conversation.user2 
      : conversation.user1

    const lastMessage = messages[messages.length - 1]
    const nextCursor = lastMessage?.id || null

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        otherUser,
        createdAt: conversation.createdAt
      },
      messages: messages.reverse(), // 反转使最新消息在底部
      nextCursor,
      hasMore: messages.length === limit
    })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json({ error: '获取消息失败' }, { status: 500 })
  }
}