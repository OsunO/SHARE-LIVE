'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, X, Sparkles, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const MAX_CONTENT_LENGTH = 2000
const MAX_IMAGES = 9

export default function NewPostPage() {
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiTags, setAiTags] = useState<string[]>([])
  const [aiDescription, setAiDescription] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleImageUpload = useCallback(async (files: FileList | null) => {
    if (!files) return
    
    const remainingSlots = MAX_IMAGES - images.length
    if (remainingSlots <= 0) {
      toast.error(`最多上传 ${MAX_IMAGES} 张图片`)
      return
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots)
    setUploading(true)

    try {
      for (const file of filesToUpload) {
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} 不是图片文件`)
          continue
        }
        
        // 验证文件大小 (10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} 超过 10MB 限制`)
          continue
        }

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          setImages(prev => [...prev, data.url])
          toast.success('图片上传成功')
          
          // AI 分析第一张图片
          if (images.length === 0 && data.base64) {
            analyzeWithAI(data.base64)
          }
        } else {
          toast.error('图片上传失败')
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('上传过程中发生错误')
    } finally {
      setUploading(false)
    }
  }, [images.length])

  // 拖拽上传处理
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files)
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
    if (!content.trim() && images.length === 0) {
      toast.error('请填写内容或上传图片')
      return
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      toast.error(`内容不能超过 ${MAX_CONTENT_LENGTH} 字`)
      return
    }

    setPublishing(true)
    const toastId = toast.loading('正在发布...')
    
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          images,
          aiTags,
          aiDescription
        })
      })

      if (response.ok) {
        toast.success('发布成功！', { id: toastId })
        router.push('/')
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || '发布失败', { id: toastId })
      }
    } catch (error) {
      console.error('Publish error:', error)
      toast.error('发布过程中发生错误', { id: toastId })
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
            disabled={publishing || (!content.trim() && images.length === 0)}
            className="flex items-center gap-1.5 bg-primary-600 text-white px-4 py-1.5 rounded-full text-sm font-medium disabled:opacity-50 hover:bg-primary-700 transition-colors"
          >
            {publishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                发布中
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                发布
              </>
            )}
          </button>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-6">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享你的生活点滴..."
            maxLength={MAX_CONTENT_LENGTH}
            className="w-full h-40 p-4 bg-white rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {content.length}/{MAX_CONTENT_LENGTH}
          </div>
        </div>

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

        {/* 上传区域 */}
        {images.length < MAX_IMAGES && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-4 flex flex-col items-center justify-center px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              dragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-500 hover:bg-gray-50'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                <span className="mt-2 text-sm text-gray-600">上传中...</span>
              </>
            ) : (
              <>
                <ImagePlus className="w-8 h-8 text-gray-400" />
                <span className="mt-2 text-sm text-gray-600">
                  点击或拖拽上传图片
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  支持 JPG、PNG、GIF，最多 {MAX_IMAGES} 张，单张不超过 10MB
                </span>
              </>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleImageUpload(e.target.files)}
          className="hidden"
        />
      </main>
    </div>
  )
}
