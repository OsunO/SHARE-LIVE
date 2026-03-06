'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ImageIcon, Film, Upload, Loader2 } from 'lucide-react'

interface CreateStoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreateStoryModal({ isOpen, onClose, onSuccess }: CreateStoryModalProps) {
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string>('')
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO' | null>(null)
  const [caption, setCaption] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (file.type.startsWith('image/')) {
      setMediaType('IMAGE')
    } else if (file.type.startsWith('video/')) {
      setMediaType('VIDEO')
    } else {
      alert('请选择图片或视频文件')
      return
    }

    // 验证文件大小 (最大 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('文件大小不能超过 50MB')
      return
    }

    setMediaFile(file)
    const previewUrl = URL.createObjectURL(file)
    setMediaPreview(previewUrl)
  }, [])

  const handleUpload = async () => {
    if (!mediaFile || !mediaType) return

    setIsUploading(true)
    try {
      // 1. 获取预签名上传 URL
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: mediaFile.name,
          contentType: mediaFile.type
        })
      })

      if (!presignRes.ok) throw new Error('获取上传链接失败')
      const { uploadUrl, fileUrl } = await presignRes.json()

      // 2. 上传文件到存储
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: mediaFile,
        headers: { 'Content-Type': mediaFile.type }
      })

      if (!uploadRes.ok) throw new Error('文件上传失败')

      // 3. 创建故事
      const createRes = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaUrl: fileUrl,
          mediaType,
          caption: caption.trim() || undefined
        })
      })

      if (!createRes.ok) throw new Error('创建故事失败')

      // 重置状态并关闭
      resetState()
      onClose()
      onSuccess?.()
    } catch (error) {
      console.error('Upload error:', error)
      alert('上传失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  const resetState = () => {
    setMediaFile(null)
    setMediaPreview('')
    setMediaType(null)
    setCaption('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      resetState()
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">创建故事</h2>
              <button
                onClick={handleClose}
                disabled={isUploading}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {!mediaPreview ? (
                /* File Selection */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex justify-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                      <Film className="w-6 h-6 text-pink-600" />
                    </div>
                  </div>
                  <p className="text-gray-600 font-medium">点击选择图片或视频</p>
                  <p className="text-gray-400 text-sm mt-1">支持 JPG, PNG, GIF, MP4 等格式</p>
                  <p className="text-gray-400 text-xs mt-2">最大 50MB</p>
                </div>
              ) : (
                /* Preview & Caption */
                <div className="space-y-4">
                  {/* Media Preview */}
                  <div className="relative aspect-[9/16] max-h-64 mx-auto rounded-lg overflow-hidden bg-gray-100">
                    {mediaType === 'IMAGE' ? (
                      <img
                        src={mediaPreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <video
                        src={mediaPreview}
                        className="w-full h-full object-contain"
                        controls
                      />
                    )}
                    <button
                      onClick={() => {
                        setMediaFile(null)
                        setMediaPreview('')
                        setMediaType(null)
                      }}
                      disabled={isUploading}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Caption Input */}
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="添加文字说明..."
                    maxLength={200}
                    disabled={isUploading}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all disabled:opacity-50"
                    rows={3}
                  />
                  <p className="text-right text-xs text-gray-400">{caption.length}/200</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {mediaPreview && (
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => {
                    setMediaFile(null)
                    setMediaPreview('')
                    setMediaType(null)
                  }}
                  disabled={isUploading}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  重新选择
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      上传中...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      发布
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
