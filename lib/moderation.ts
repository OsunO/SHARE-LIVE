/**
 * AI 内容审核系统
 * 支持文本、图片、视频内容审核
 */

import { getOpenAIClient, MODEL } from './ai'

// 审核结果类型
export interface ModerationResult {
  status: 'APPROVED' | 'REJECTED' | 'PENDING'
  reason?: string
  confidence: number // 0-1
  categories?: string[] // 违规类别
}

// 审核配置
const MODERATION_CONFIG = {
  // 自动通过的置信度阈值
  autoApproveThreshold: 0.95,
  // 自动拒绝的置信度阈值
  autoRejectThreshold: 0.85,
  // 敏感类别
  sensitiveCategories: [
    'violence',      // 暴力
    'pornography',   // 色情
    'hate_speech',   // 仇恨言论
    'self_harm',     // 自残
    'harassment',    // 骚扰
    'illegal',       // 违法内容
    'spam',          // 垃圾信息
    'misinformation' // 虚假信息
  ]
}

/**
 * 文本内容审核
 */
export async function moderateText(text: string): Promise<ModerationResult> {
  const openai = await getOpenAIClient()
  
  // 如果没有配置 AI，自动通过
  if (!openai) {
    return {
      status: 'APPROVED',
      reason: 'AI审核未配置，自动通过',
      confidence: 1.0
    }
  }

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `你是一个专业的内容审核助手。请分析以下文本内容，判断是否包含违规内容。

违规类别包括：
- violence: 暴力内容
- pornography: 色情内容  
- hate_speech: 仇恨言论
- self_harm: 自残相关
- harassment: 骚扰霸凌
- illegal: 违法信息
- spam: 垃圾广告
- misinformation: 虚假信息

请以JSON格式回复：
{
  "approved": true/false,
  "confidence": 0.0-1.0,
  "categories": ["违规类别"],
  "reason": "简要说明原因"
}

如果内容安全，approved为true，categories为空数组。`
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    })

    const content = response.choices[0]?.message?.content || ''
    return parseModerationResponse(content)
  } catch (error) {
    console.error('Text moderation error:', error)
    // 出错时返回待审核状态
    return {
      status: 'PENDING',
      reason: '审核服务暂时不可用，等待人工审核',
      confidence: 0
    }
  }
}

/**
 * 图片内容审核
 */
export async function moderateImage(imageUrl: string): Promise<ModerationResult> {
  const openai = await getOpenAIClient()
  
  if (!openai) {
    return {
      status: 'APPROVED',
      reason: 'AI审核未配置，自动通过',
      confidence: 1.0
    }
  }

  // 检查是否为本地路径或相对路径（AI API 无法访问）
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    // 本地路径，跳过 AI 审核，自动通过
    return {
      status: 'APPROVED',
      reason: '本地图片，自动通过',
      confidence: 1.0
    }
  }

  try {
    // 尝试使用 vision API 分析图片
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `你是一个专业的图片内容审核助手。请分析这张图片，判断是否包含违规内容。

违规类别包括：
- violence: 暴力血腥
- pornography: 色情裸露
- hate_imagery: 仇恨符号
- self_harm: 自残相关
- illegal_content: 违法内容
- disturbing: 令人不适

请以JSON格式回复：
{
  "approved": true/false,
  "confidence": 0.0-1.0,
  "categories": ["违规类别"],
  "reason": "简要说明原因"
}

如果图片安全，approved为true，categories为空数组。`
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    })

    const content = response.choices[0]?.message?.content || ''
    return parseModerationResponse(content)
  } catch (error) {
    console.error('Image moderation error:', error)
    // Vision API 可能不支持，返回待审核
    return {
      status: 'PENDING',
      reason: '图片审核服务暂时不可用，等待人工审核',
      confidence: 0
    }
  }
}

/**
 * 批量图片审核
 */
export async function moderateImages(imageUrls: string[]): Promise<ModerationResult> {
  if (!imageUrls || imageUrls.length === 0) {
    return {
      status: 'APPROVED',
      confidence: 1.0
    }
  }

  // 审核第一张图片（主图）
  const mainResult = await moderateImage(imageUrls[0])
  
  // 如果主图有问题，直接返回
  if (mainResult.status === 'REJECTED') {
    return mainResult
  }

  // 如果有多张图片，记录需要人工复核
  if (imageUrls.length > 1 && mainResult.confidence < 0.9) {
    return {
      status: 'PENDING',
      reason: '多图内容需要人工复核',
      confidence: mainResult.confidence,
      categories: mainResult.categories
    }
  }

  return mainResult
}

/**
 * 视频内容审核（简化版，审核视频缩略图）
 */
export async function moderateVideo(
  videoUrl: string, 
  thumbnailUrl?: string
): Promise<ModerationResult> {
  // 如果有缩略图，审核缩略图
  if (thumbnailUrl) {
    return moderateImage(thumbnailUrl)
  }

  // 没有缩略图，标记为待审核
  return {
    status: 'PENDING',
    reason: '视频内容需要人工审核',
    confidence: 0
  }
}

/**
 * 综合内容审核
 */
export async function moderateContent(
  content: {
    text?: string
    images?: string[]
    videos?: string[]
    videoThumbnails?: string[]
  }
): Promise<ModerationResult> {
  const results: ModerationResult[] = []

  // 1. 文本审核
  if (content.text && content.text.trim()) {
    const textResult = await moderateText(content.text)
    results.push(textResult)
    if (textResult.status === 'REJECTED') {
      return textResult
    }
  }

  // 2. 图片审核
  if (content.images && content.images.length > 0) {
    const imageResult = await moderateImages(content.images)
    results.push(imageResult)
    if (imageResult.status === 'REJECTED') {
      return imageResult
    }
  }

  // 3. 视频审核
  if (content.videos && content.videos.length > 0) {
    for (let i = 0; i < content.videos.length; i++) {
      const videoResult = await moderateVideo(
        content.videos[i],
        content.videoThumbnails?.[i]
      )
      results.push(videoResult)
      if (videoResult.status === 'REJECTED') {
        return videoResult
      }
    }
  }

  // 如果没有内容需要审核
  if (results.length === 0) {
    return {
      status: 'APPROVED',
      confidence: 1.0
    }
  }

  // 计算综合结果
  const hasPending = results.some(r => r.status === 'PENDING')
  const minConfidence = Math.min(...results.map(r => r.confidence))
  const allCategories = Array.from(new Set(results.flatMap(r => r.categories || [])))

  // 如果有任何待审核
  if (hasPending) {
    return {
      status: 'PENDING',
      reason: '部分内容需要人工审核',
      confidence: minConfidence,
      categories: allCategories
    }
  }

  // 根据置信度决定
  if (minConfidence >= MODERATION_CONFIG.autoApproveThreshold) {
    return {
      status: 'APPROVED',
      confidence: minConfidence,
      categories: allCategories
    }
  }

  if (minConfidence < MODERATION_CONFIG.autoRejectThreshold) {
    return {
      status: 'PENDING',
      reason: '置信度较低，建议人工复核',
      confidence: minConfidence,
      categories: allCategories
    }
  }

  return {
    status: 'APPROVED',
    confidence: minConfidence,
    categories: allCategories
  }
}

/**
 * 解析 AI 返回的审核结果
 */
function parseModerationResponse(content: string): ModerationResult {
  try {
    // 尝试提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      
      const confidence = typeof parsed.confidence === 'number' 
        ? parsed.confidence 
        : (parsed.approved ? 0.9 : 0.1)

      return {
        status: parsed.approved ? 'APPROVED' : 'REJECTED',
        reason: parsed.reason || (parsed.approved ? '内容安全' : '检测到违规内容'),
        confidence,
        categories: parsed.categories || []
      }
    }
  } catch (e) {
    console.error('Failed to parse moderation response:', e)
  }

  // 无法解析时，检查关键词
  const lowerContent = content.toLowerCase()
  if (lowerContent.includes('approve') || lowerContent.includes('安全') || lowerContent.includes('通过')) {
    return {
      status: 'APPROVED',
      reason: '内容安全',
      confidence: 0.8
    }
  }

  if (lowerContent.includes('reject') || lowerContent.includes('违规') || lowerContent.includes('拒绝')) {
    return {
      status: 'REJECTED',
      reason: '检测到违规内容',
      confidence: 0.8
    }
  }

  // 无法确定，返回待审核
  return {
    status: 'PENDING',
    reason: 'AI审核结果不明确，需要人工审核',
    confidence: 0.5
  }
}

/**
 * 检查用户是否为管理员
 */
export async function checkAdmin(userEmail: string | null | undefined): Promise<boolean> {
  if (!userEmail) return false
  
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
  return adminEmails.includes(userEmail)
}