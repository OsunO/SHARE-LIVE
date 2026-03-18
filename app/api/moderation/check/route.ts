import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { moderateContent } from '@/lib/moderation'

/**
 * POST /api/moderation/check
 * 审核内容（不保存，仅返回审核结果）
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { text, images, videos, videoThumbnails } = await req.json()

    // 执行审核
    const result = await moderateContent({
      text,
      images,
      videos,
      videoThumbnails
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Moderation check error:', error)
    return NextResponse.json({ error: '审核失败' }, { status: 500 })
  }
}