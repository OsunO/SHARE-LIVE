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

    const postId = params.id
    const userId = session.user.id

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: { userId, postId }
      }
    })

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id }
      })
      
      const likeCount = await prisma.like.count({
        where: { postId }
      })
      
      return NextResponse.json({ liked: false, likeCount })
    } else {
      await prisma.like.create({
        data: { userId, postId }
      })
      
      // 获取帖子作者，发送通知
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true }
      })
      
      if (post && post.authorId !== userId) {
        await prisma.notification.create({
          data: {
            type: 'LIKE',
            title: '赞了你的帖子',
            recipientId: post.authorId,
            actorId: userId,
            postId
          }
        })
      }
      
      const likeCount = await prisma.like.count({
        where: { postId }
      })
      
      return NextResponse.json({ liked: true, likeCount })
    }
  } catch (error) {
    console.error('Like error:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
