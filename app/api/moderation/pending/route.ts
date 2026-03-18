import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/moderation'

/**
 * GET /api/moderation/pending
 * 获取待审核内容列表（管理员专用）
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

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // 获取待审核帖子
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { moderationStatus: 'PENDING' },
        include: {
          author: {
            select: { id: true, name: true, image: true, email: true }
          },
          _count: {
            select: { likes: true, comments: true }
          }
        },
        orderBy: { createdAt: 'asc' }, // 先发布的先审核
        skip,
        take: limit
      }),
      prisma.post.count({
        where: { moderationStatus: 'PENDING' }
      })
    ])

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get pending posts error:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}