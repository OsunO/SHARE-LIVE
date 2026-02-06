import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { analyzeImage } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { image } = await req.json()

    if (!image) {
      return NextResponse.json({ error: '缺少图片' }, { status: 400 })
    }

    const result = await analyzeImage(image)

    return NextResponse.json(result)
  } catch (error) {
    console.error('AI analyze API error:', error)
    return NextResponse.json({ error: '分析失败' }, { status: 500 })
  }
}
