import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// 邮箱格式验证
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password } = body

    console.log('Signup attempt:', { name, email: email?.substring(0, 3) + '***' })

    // 验证必填字段
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: '请填写所有必填项（昵称、邮箱、密码）' },
        { status: 400 }
      )
    }

    // 验证邮箱格式
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 }
      )
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码至少需要6个字符' },
        { status: 400 }
      )
    }

    // 验证昵称长度
    if (name.length < 2 || name.length > 20) {
      return NextResponse.json(
        { error: '昵称需要在2-20个字符之间' },
        { status: 400 }
      )
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已被注册，请直接登录或使用其他邮箱' },
        { status: 409 }
      )
    }

    // 检查昵称是否已存在
    const existingName = await prisma.user.findFirst({
      where: { name }
    })

    if (existingName) {
      return NextResponse.json(
        { error: '该昵称已被使用，请选择其他昵称' },
        { status: 409 }
      )
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    })

    console.log('User created successfully:', user.id)

    return NextResponse.json({
      message: '注册成功！请登录',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Signup error details:', error)
    
    // 处理 Prisma 唯一约束错误
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0]
      if (field === 'email') {
        return NextResponse.json(
          { error: '该邮箱已被注册' },
          { status: 409 }
        )
      }
      if (field === 'name') {
        return NextResponse.json(
          { error: '该昵称已被使用' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: '注册失败，请稍后重试', details: error.message },
      { status: 500 }
    )
  }
}
