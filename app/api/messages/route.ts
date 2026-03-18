import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Conversation, User, Message } from '@prisma/client'

// 定义返回类型
type ConversationWithUsers = Conversation & {
  user1: Pick<User, 'id' | 'name' | 'image'>
  user2: Pick<User, 'id' | 'name' | 'image'>
  messages: Pick<Message, 'id' | 'content' | 'createdAt' | 'senderId' | 'read'>[]
}

/**
 * GET /api/messages
 * 获取用户的会话列表
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const userId = session.user.id

    // 获取用户参与的所有会话
    const conversations = await prisma.conversation.findMany({
      where: {
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
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
            read: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    }) as ConversationWithUsers[]

    // 格式化返回数据，确保对方用户信息在前
    const formattedConversations = conversations.map((conv: ConversationWithUsers) => {
      const isUser1 = conv.user1Id === userId
      const otherUser = isUser1 ? conv.user2 : conv.user1
      
      // 计算未读消息数
      return {
        id: conv.id,
        otherUser,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        updatedAt: conv.updatedAt,
        latestMessage: conv.messages[0] || null
      }
    })

    return NextResponse.json({ conversations: formattedConversations })
  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json({ error: '获取会话列表失败' }, { status: 500 })
  }
}

/**
 * POST /api/messages
 * 发送消息（创建或继续会话）
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { receiverId, content, images } = await req.json()

    if (!receiverId) {
      return NextResponse.json({ error: '缺少接收者ID' }, { status: 400 })
    }

    if (!content && (!images || images.length === 0)) {
      return NextResponse.json({ error: '消息内容不能为空' }, { status: 400 })
    }

    // 不能给自己发消息
    if (receiverId === session.user.id) {
      return NextResponse.json({ error: '不能给自己发消息' }, { status: 400 })
    }

    // 检查接收者是否存在
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true }
    })

    if (!receiver) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const senderId = session.user.id

    // 确保 user1Id < user2Id 以保证会话唯一性
    const [user1Id, user2Id] = senderId < receiverId 
      ? [senderId, receiverId] 
      : [receiverId, senderId]

    // 查找或创建会话
    let conversation = await prisma.conversation.findUnique({
      where: {
        user1Id_user2Id: { user1Id, user2Id }
      }
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { user1Id, user2Id }
      })
    }

    // 创建消息
    const message = await prisma.message.create({
      data: {
        content: content || '',
        images: images || [],
        senderId,
        receiverId,
        conversationId: conversation.id
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true }
        }
      }
    })

    // 更新会话的最后消息
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: content || '[图片]',
        lastMessageAt: new Date()
      }
    })

    return NextResponse.json({ message, conversationId: conversation.id })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: '发送消息失败' }, { status: 500 })
  }
}