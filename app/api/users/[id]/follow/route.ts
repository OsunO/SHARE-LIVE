import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const targetUserId = params.id
    const currentUserId = session.user.id

    if (currentUserId === targetUserId) {
      return NextResponse.json({ error: '不能关注自己' }, { status: 400 })
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId
        }
      }
    })

    if (existingFollow) {
      return NextResponse.json({ error: '已关注' }, { status: 400 })
    }

    await prisma.follow.create({
      data: {
        followerId: currentUserId,
        followingId: targetUserId
      }
    })

    return NextResponse.json({ following: true })
  } catch (error) {
    console.error('Follow error:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const targetUserId = params.id
    const currentUserId = session.user.id

    await prisma.follow.deleteMany({
      where: {
        followerId: currentUserId,
        followingId: targetUserId
      }
    })

    return NextResponse.json({ following: false })
  } catch (error) {
    console.error('Unfollow error:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
