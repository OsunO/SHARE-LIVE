import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const posts = await prisma.post.findMany({
      where: { published: true },
      include: {
        author: {
          select: { id: true, name: true, image: true }
        },
        _count: {
          select: { likes: true, comments: true, favorites: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Get posts error:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { content, images, aiTags, aiDescription } = await req.json()

    if (!content && (!images || images.length === 0)) {
      return NextResponse.json(
        { error: '内容和图片不能同时为空' },
        { status: 400 }
      )
    }

    const post = await prisma.post.create({
      data: {
        content,
        images: images || [],
        aiTags: aiTags || [],
        aiDescription,
        authorId: session.user.id
      }
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json({ error: '发布失败' }, { status: 500 })
  }
}
