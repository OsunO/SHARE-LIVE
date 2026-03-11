import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const POSTS_PER_PAGE = 10

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || String(POSTS_PER_PAGE))

    const sort = searchParams.get('sort')
    
    // Determine orderBy based on sort parameter
    const orderBy = sort === 'popular' 
      ? { likes: { _count: 'desc' as const } }
      : { createdAt: 'desc' as const }

    const posts = await prisma.post.findMany({
      where: { published: true },
      include: {
        author: {
          select: { id: true, name: true, image: true }
        },
        _count: {
          select: { likes: true, comments: true, favorites: true }
        },
        likes: {
          where: { userId: session.user.id },
          select: { id: true }
        },
        favorites: {
          where: { userId: session.user.id },
          select: { id: true }
        }
      },
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1
      }),
      orderBy,
      take: limit
    })

    const lastPost = posts[posts.length - 1]
    const nextCursor = lastPost?.id || null

    return NextResponse.json({
      posts,
      nextCursor,
      hasMore: posts.length === limit
    })
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
