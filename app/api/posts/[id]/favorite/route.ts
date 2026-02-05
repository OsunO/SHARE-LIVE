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

    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_postId: { userId, postId }
      }
    })

    if (existingFavorite) {
      await prisma.favorite.delete({
        where: { id: existingFavorite.id }
      })
      
      return NextResponse.json({ favorited: false })
    } else {
      await prisma.favorite.create({
        data: { userId, postId }
      })
      
      return NextResponse.json({ favorited: true })
    }
  } catch (error) {
    console.error('Favorite error:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
