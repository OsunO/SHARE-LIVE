import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { moderateContent, checkAdmin } from '@/lib/moderation'

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
    const userId = searchParams.get('userId') // 查看特定用户的帖子

    const sort = searchParams.get('sort')
    
    // Determine orderBy based on sort parameter
    const orderBy = sort === 'popular' 
      ? { likes: { _count: 'desc' as const } }
      : { createdAt: 'desc' as const }

    // 检查是否为管理员（管理员可以看到所有状态的帖子）
    const isAdmin = await checkAdmin(session.user.email)

    // 构建查询条件
    const where: any = { published: true }
    
    // 非管理员只能看到已审核通过的帖子
    if (!isAdmin) {
      where.moderationStatus = 'APPROVED'
    }

    // 查看特定用户的帖子时，用户自己可以看到自己所有状态的帖子
    if (userId && userId === session.user.id) {
      delete where.moderationStatus
    }

    const posts = await prisma.post.findMany({
      where,
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

    const { content, images, videos, videoThumbnails, aiTags, aiDescription } = await req.json()

    if (!content && (!images || images.length === 0) && (!videos || videos.length === 0)) {
      return NextResponse.json(
        { error: '内容、图片和视频不能同时为空' },
        { status: 400 }
      )
    }

    // 执行自动审核
    const moderationResult = await moderateContent({
      text: content,
      images,
      videos,
      videoThumbnails
    })

    console.log('Moderation result:', moderationResult)

    // 创建帖子
    const post = await prisma.post.create({
      data: {
        content,
        images: images || [],
        videos: videos || [],
        videoThumbnails: videoThumbnails || [],
        aiTags: aiTags || [],
        aiDescription,
        authorId: session.user.id,
        // 设置审核状态
        moderationStatus: moderationResult.status,
        moderationReason: moderationResult.reason,
        moderatedAt: moderationResult.status !== 'PENDING' ? new Date() : null
      }
    })

    // 记录审核日志
    if (moderationResult.status !== 'PENDING') {
      await prisma.moderationLog.create({
        data: {
          postId: post.id,
          action: moderationResult.status === 'APPROVED' ? 'AUTO_APPROVED' : 'AUTO_REJECTED',
          reason: moderationResult.reason || '',
          details: JSON.stringify({
            confidence: moderationResult.confidence,
            categories: moderationResult.categories
          })
        }
      })
    }

    return NextResponse.json({
      ...post,
      moderationMessage: moderationResult.status === 'PENDING' 
        ? '内容已提交，等待审核后公开显示' 
        : moderationResult.status === 'REJECTED'
          ? `内容审核未通过：${moderationResult.reason}`
          : undefined
    })
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json({ error: '发布失败' }, { status: 500 })
  }
}