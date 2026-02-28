// 测试 AI 配置
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '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',
  baseURL: process.env.OPENAI_BASE_URL || 'https://ai-01.waveterm.in/v1'
});

const MODEL = process.env.OPENAI_MODEL || 'nvidia/moonshotai/kimi-k2.5';

async function testAI() {
  try {
    console.log('Testing AI with model:', MODEL);
    console.log('Base URL:', openai.baseURL);

    // 测试文本生成
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: '你是一个有帮助的助手。' },
        { role: 'user', content: '你好，请介绍一下自己。' }
      ],
      max_tokens: 100
    });

    console.log('\n✅ Text generation test passed!');
    console.log('Response:', response.choices[0]?.message?.content);

    // 测试图片分析（如果支持）
    console.log('\n--- Testing image analysis ---');
    try {
      const imageResponse = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: '你是一个图片分析助手。'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: '描述这张图片' },
              {
                type: 'image_url',
                image_url: {
                  url: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
                }
              }
            ]
          }
        ],
        max_tokens: 100
      });
      console.log('✅ Image analysis test passed!');
      console.log('Response:', imageResponse.choices[0]?.message?.content);
    } catch (imgError) {
      console.log('❌ Image analysis test failed:', imgError.message);
      console.log('This model may not support vision capabilities.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAI();
