import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import * as Minio from 'minio'

// 创建 MinIO 客户端
const createMinioClient = () => {
  return new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'minio',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'sharelive',
    secretKey: process.env.MINIO_SECRET_KEY || 'sharelive2024',
  })
}

// 确保 bucket 存在
const ensureBucket = async (client: Minio.Client, bucketName: string) => {
  const exists = await client.bucketExists(bucketName)
  if (!exists) {
    await client.makeBucket(bucketName)
    // 设置 bucket 为公开可读
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    }
    await client.setBucketPolicy(bucketName, JSON.stringify(policy))
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: '没有文件' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // 生成唯一文件名
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `${uuidv4()}.${ext}`
    
    const uploadProvider = process.env.UPLOAD_PROVIDER || 'local'
    let url: string
    
    if (uploadProvider === 'minio') {
      // MinIO 上传
      const minioClient = createMinioClient()
      const bucketName = process.env.MINIO_BUCKET_NAME || 'sharelive-uploads'
      
      await ensureBucket(minioClient, bucketName)
      
      await minioClient.putObject(
        bucketName,
        filename,
        buffer,
        buffer.length,
        { 'Content-Type': file.type || 'image/jpeg' }
      )
      
      // 构建 URL
      const minioPort = process.env.MINIO_PORT || '9000'
      url = `http://101.34.245.133:${minioPort}/${bucketName}/${filename}`
    } else {
      // 本地存储
      const uploadDir = join(process.cwd(), 'public', 'uploads')
      const filepath = join(uploadDir, filename)
      await writeFile(filepath, buffer)
      url = `/uploads/${filename}`
    }
    
    // 返回 base64 用于 AI 分析
    const base64 = buffer.toString('base64')

    return NextResponse.json({ 
      url,
      base64,
      filename 
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: '上传失败' }, { status: 500 })
  }
}
