import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { name, bio, location, website, image, coverImage } = await req.json()
    const userId = session.user.id

    // Validate website URL if provided
    if (website && !isValidUrl(website)) {
      return NextResponse.json({ error: '网站链接格式不正确' }, { status: 400 })
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        bio: bio || undefined,
        location: location || undefined,
        website: website || undefined,
        image: image || undefined,
        coverImage: coverImage || undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        coverImage: true,
        bio: true,
        location: true,
        website: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        coverImage: true,
        bio: true,
        location: true,
        website: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
