import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 获取热门标签及其使用次数
    const popularTags = await prisma.$queryRaw`
      SELECT 
        unnest(tags) as name,
        COUNT(*) as count
      FROM "Post"
      WHERE published = true
        AND createdAt > NOW() - INTERVAL '30 days'
      GROUP BY unnest(tags)
      HAVING COUNT(*) > 0
      ORDER BY count DESC
      LIMIT 30
    `

    // 添加一些预设的热门标签（如果数据库中没有足够的标签）
    const presetTags = [
      { name: '美食', count: 128, color: '#FF6B6B' },
      { name: '旅行', count: 96, color: '#4ECDC4' },
      { name: '摄影', count: 84, color: '#45B7D1' },
      { name: '日常', count: 156, color: '#96CEB4' },
      { name: '宠物', count: 72, color: '#FFEAA7' },
      { name: '穿搭', count: 64, color: '#DDA0DD' },
      { name: '运动', count: 58, color: '#98D8C8' },
      { name: '读书', count: 45, color: '#F7DC6F' },
      { name: '音乐', count: 52, color: '#BB8FCE' },
      { name: '电影', count: 48, color: '#85C1E9' },
      { name: '工作', count: 89, color: '#F8C471' },
      { name: '学习', count: 67, color: '#82E0AA' },
      { name: '咖啡', count: 43, color: '#D7BDE2' },
      { name: '风景', count: 76, color: '#AED6F1' },
      { name: '自拍', count: 112, color: '#F5B7B1' },
    ]

    // 合并数据库标签和预设标签
    const dbTags = (popularTags as any[]).map((tag: any) => ({
      name: tag.name,
      count: Number(tag.count),
      color: generateTagColor(tag.name)
    }))

    // 合并并去重
    const allTags = [...dbTags]
    for (const preset of presetTags) {
      if (!allTags.find(t => t.name === preset.name)) {
        allTags.push(preset)
      }
    }

    // 按热度排序并限制数量
    const sortedTags = allTags
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    return NextResponse.json({ tags: sortedTags })
  } catch (error) {
    console.error('Popular tags API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch popular tags' },
      { status: 500 }
    )
  }
}

// 根据标签名生成一致的颜色
function generateTagColor(name: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#D7BDE2', '#AED6F1', '#F5B7B1',
    '#A3E4D7', '#F9E79F', '#D5A6BD', '#A9DFBF', '#AED6F1'
  ]
  
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}
