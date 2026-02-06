import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.moonshot.cn/v1'
})

const MODEL = process.env.OPENAI_MODEL || 'moonshot-v1-8k'

export async function analyzeImage(base64Image: string) {
  try {
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
            }
          ]
        }
      ],
      max_tokens: 500
    })

    const content = response.choices[0]?.message?.content || ''
    const [description, tagsStr] = content.split('\n')
    const tags = tagsStr?.split(',').map(t => t.trim()).filter(Boolean) || []

    return {
      description: description?.trim() || '',
      tags
    }
  } catch (error) {
    console.error('AI analyze error:', error)
    return { description: '', tags: [] }
  }
}

export async function moderateContent(text: string) {
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
