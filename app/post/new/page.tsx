'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, X, Sparkles } from 'lucide-react'

export default function NewPostPage() {
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiTags, setAiTags] = useState<string[]>([])
  const [aiDescription, setAiDescription] = useState('')
  const [publishing, setPublishing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setUploading(true)

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          setImages(prev => [...prev, data.url])
          
          // AI 分析第一张图片
          if (images.length === 0) {
            analyzeWithAI(data.base64)
          }
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  const analyzeWithAI = async (base64Image: string) => {
    setAiAnalyzing(true)
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      })

      if (response.ok) {
        const data = await response.json()
        setAiTags(data.tags)
        setAiDescription(data.description)
      }
    } catch (error) {
      console.error('AI analyze error:', error)
    } finally {
      setAiAnalyzing(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handlePublish = async () => {
    if (!content && images.length === 0) return

    setPublishing(true)
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          images,
          aiTags,
          aiDescription
        })
      })

      if (response.ok) {
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      console.error('Publish error:', error)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b z-50">
        <div className="container mx-auto max-w-2xl px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-gray-600">
            取消
          </button>
          <h1 className="font-semibold">发布动态</h1>
          <button
            onClick={handlePublish}
            disabled={publishing || (!content && images.length === 0)}
            className="bg-primary-600 text-white px-4 py-1.5 rounded-full text-sm font-medium disabled:opacity-50"
          >
            {publishing ? '发布中...' : '发布'}
          </button>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="分享你的生活点滴..."
          className="w-full h-32 p-4 bg-white rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
        />

        {/* AI 分析结果 */}
        {aiAnalyzing && (
          <div className="flex items-center gap-2 text-primary-600 mt-4">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-sm">AI 正在分析图片...</span>
          </div>
        )}

        {aiTags.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">
              <Sparkles className="w-4 h-4 inline mr-1" />
              AI 识别标签：
            </p>
            <div className="flex flex-wrap gap-2">
              {aiTags.map((tag, idx) => (
                <span 
                  key={idx}
                  className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 图片预览 */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            {images.map((image, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={image}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 上传按钮 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="mt-4 flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-500 transition-colors"
        >
          <ImagePlus className="w-5 h-5" />
          <span>{uploading ? '上传中...' : '添加图片'}</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
      </main>
    </div>
  )
}
