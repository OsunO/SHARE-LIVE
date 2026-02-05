import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
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
