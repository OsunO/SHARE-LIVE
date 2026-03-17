'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ImagePlus, X, Sparkles, Send, Loader2, ArrowLeft, 
  Type, Hash, Smile, MapPin, Clock, CheckCircle2, Video,
  Film
} from 'lucide-react'
import { toast } from 'sonner'

const MAX_CONTENT_LENGTH = 2000
const MAX_IMAGES = 9
const MAX_VIDEOS = 3
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

// Emoji suggestions
const EMOJI_SUGGESTIONS = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '✨', '📸', '🌟', '💫']

export default function NewPostPage() {
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [videos, setVideos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiTags, setAiTags] = useState<string[]>([])
  const [aiDescription, setAiDescription] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
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
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} 不是图片文件`)
          continue
        }
        
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

  const handleVideoUpload = useCallback(async (files: FileList | null) => {
    if (!files) return
    
    const remainingSlots = MAX_VIDEOS - videos.length
    if (remainingSlots <= 0) {
      toast.error(`最多上传 ${MAX_VIDEOS} 个视频`)
      return
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots)
    setUploading(true)

    try {
      for (const file of filesToUpload) {
        if (!file.type.startsWith('video/')) {
          toast.error(`${file.name} 不是视频文件`)
          continue
        }
        
        if (file.size > MAX_VIDEO_SIZE) {
          toast.error(`${file.name} 超过 50MB 限制`)
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
          setVideos(prev => [...prev, data.url])
          toast.success('视频上传成功')
        } else {
          toast.error('视频上传失败')
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('上传过程中发生错误')
    } finally {
      setUploading(false)
    }
  }, [videos.length])

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

  const addEmoji = (emoji: string) => {
    setContent(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handlePublish = async () => {
    if (!content.trim() && images.length === 0 && videos.length === 0) {
      toast.error('请填写内容或上传图片/视频')
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
          videos,
          aiTags,
          aiDescription,
          tags: selectedTags
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

  const progress = Math.min((content.length / MAX_CONTENT_LENGTH) * 100, 100)
  const isNearLimit = content.length > MAX_CONTENT_LENGTH * 0.9

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50"
      >
        <div className="container mx-auto max-w-2xl px-4 h-16 flex items-center justify-between">
          <motion.button 
            onClick={() => router.back()} 
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">返回</span>
          </motion.button>
          
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
          >
            发布动态
          </motion.h1>
          
          <motion.button
            onClick={handlePublish}
            disabled={publishing || (!content.trim() && images.length === 0 && videos.length === 0)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-2 rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all"
          >
            {publishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">发布中</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">发布</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.header>

      <main className="container mx-auto max-w-2xl px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Content Input */}
          <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="分享你的生活点滴..."
              maxLength={MAX_CONTENT_LENGTH}
              className="w-full h-48 p-5 resize-none focus:outline-none text-gray-700 placeholder-gray-400 leading-relaxed"
            />
            
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
              <motion.div 
                className={`h-full transition-colors ${isNearLimit ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Character count */}
            <div className={`absolute bottom-3 right-4 text-xs font-medium transition-colors ${isNearLimit ? 'text-red-500' : 'text-gray-400'}`}>
              {content.length}/{MAX_CONTENT_LENGTH}
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 mt-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2.5 rounded-xl transition-colors ${showEmojiPicker ? 'bg-purple-100 text-purple-600' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              <Smile className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= MAX_IMAGES}
              className="p-2.5 bg-white text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
            >
              <ImagePlus className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => videoInputRef.current?.click()}
              disabled={videos.length >= MAX_VIDEOS}
              className="p-2.5 bg-white text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
            >
              <Video className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2.5 bg-white text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <MapPin className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2.5 bg-white text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Clock className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Emoji Picker */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mt-3 p-3 bg-white rounded-xl shadow-lg border border-gray-100 flex flex-wrap gap-2"
              >
                {EMOJI_SUGGESTIONS.map((emoji, index) => (
                  <motion.button
                    key={emoji}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => addEmoji(emoji)}
                    className="text-2xl p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI 分析结果 */}
          <AnimatePresence>
            {aiAnalyzing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 text-purple-600 mt-4 p-4 bg-purple-50 rounded-xl overflow-hidden"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
                <span className="text-sm font-medium">AI 正在分析图片内容...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {aiTags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100"
            >
              <p className="text-sm text-purple-700 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">AI 识别标签：</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {aiTags.map((tag, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-white text-purple-600 hover:bg-purple-100'
                    }`}
                  >
                    {selectedTags.includes(tag) && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                    #{tag}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* 图片预览 */}
          <AnimatePresence>
            {images.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-3 gap-3 mt-4"
              >
                {images.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative aspect-square group"
                  >
                    <img
                      src={image}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <motion.button
                      initial={{ opacity: 0 }}
                      whileHover={{ scale: 1.1 }}
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                    {index === 0 && (
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                        封面
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 上传区域 */}
          <AnimatePresence>
            {images.length < MAX_IMAGES && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    mt-4 flex flex-col items-center justify-center px-4 py-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300
                    ${dragActive
                      ? 'border-purple-500 bg-purple-50 scale-[1.02]'
                      : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                    }
                  `}
                >
                  <AnimatePresence mode="wait">
                    {uploading ? (
                      <motion.div
                        key="uploading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 className="w-10 h-10 text-purple-500" />
                        </motion.div>
                        <span className="mt-3 text-sm text-gray-600">上传中...</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center"
                      >
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <ImagePlus className="w-12 h-12 text-gray-400" />
                        </motion.div>
                        <span className="mt-3 text-sm font-medium text-gray-600">
                          点击或拖拽上传图片
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          支持 JPG、PNG、GIF，最多 {MAX_IMAGES} 张，单张不超过 10MB
                        </span>
                        <span className="text-xs text-purple-500 mt-2">
                          已上传 {images.length}/{MAX_IMAGES} 张
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleImageUpload(e.target.files)}
            className="hidden"
          />

          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            onChange={(e) => handleVideoUpload(e.target.files)}
            className="hidden"
          />
        </motion.div>
      </main>
    </div>
  )
}
