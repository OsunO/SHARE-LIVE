// 动态导入 OpenAI SDK，减少初始 bundle 大小
type OpenAIClient = any

let openaiClient: OpenAIClient | null = null

async function getOpenAIClient(): Promise<OpenAIClient | null> {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    const { default: OpenAI } = await import('openai')
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://coding.dashscope.aliyuncs.com/v1'
    })
  }
  return openaiClient
}

const MODEL = process.env.OPENAI_MODEL || 'kimi-k2.5'

export async function analyzeImage(base64Image: string) {
  const openai = await getOpenAIClient()
  
  // 如果没有配置 AI，返回空结果
  if (!openai) {
    console.warn('AI not configured: returning empty analysis')
    return { description: '', tags: [] }
  }
  
  try {
    // 尝试使用 vision 功能分析图片
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: '你是一个图片分析助手。请分析这张图片，生成：1. 一句话描述图片内容；2. 5-10个相关的标签（用逗号分隔）。格式：描述\n标签1,标签2,标签3...'
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            } as any
          ]
        }
      ],
      max_tokens: 500
    })

    const content = response.choices[0]?.message?.content || ''
    console.log('AI analyze result:', content)
    
    // 解析返回内容
    const lines = content.split('\n').filter((line: string) => line.trim())
    let description = ''
    let tags: string[] = []
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      // 如果行包含逗号，可能是标签行
      if (trimmedLine.includes(',') && !description) {
        tags = trimmedLine.split(',').map((t: string) => t.trim()).filter(Boolean)
      } else if (!description && !trimmedLine.includes(',')) {
        description = trimmedLine
      } else if (trimmedLine.includes(',')) {
        // 合并标签
        const newTags = trimmedLine.split(',').map((t: string) => t.trim()).filter(Boolean)
        tags = [...tags, ...newTags]
      }
    }
    
    // 如果还没有标签，把整个内容当作标签处理
    if (tags.length === 0 && content) {
      tags = content.split(/[,，]/).map((t: string) => t.trim()).filter(Boolean).slice(0, 10)
    }
    
    return {
      description: description || '用户上传的图片',
      tags: tags.slice(0, 10) // 最多返回10个标签
    }
  } catch (error) {
    console.error('AI analyze error:', error)
    // 如果 vision 不支持，返回默认结果
    return { 
      description: '用户上传的图片',
      tags: ['图片', '分享']
    }
  }
}

export async function moderateContent(text: string) {
  const openai = await getOpenAIClient()
  
  // 如果没有配置 AI，默认通过审核
  if (!openai) {
    return true
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: '你是一个内容审核助手。请判断以下文本是否包含不当内容（暴力、色情、仇恨言论等）。只回复 "APPROVE" 或 "REJECT"。'
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 10
    })

    const result = response.choices[0]?.message?.content?.trim()
    return result === 'APPROVE'
  } catch (error) {
    console.error('AI moderate error:', error)
    return true
  }
}
