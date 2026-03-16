'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface ProfileFormData {
  name: string
  bio: string
  location: string
  website: string
  image: string
  coverImage: string
}

export default function EditProfilePage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<ProfileFormData>({
    name: session?.user?.name || '',
    bio: '',
    location: '',
    website: '',
    image: session?.user?.image || '',
    coverImage: ''
  })

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserData()
    }
  }, [session?.user?.id])

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/users/${session?.user?.id}`)
      if (response.ok) {
        const user = await response.json()
        setFormData({
          name: user.name || '',
          bio: user.bio || '',
          location: user.location || '',
          website: user.website || '',
          image: user.image || '',
          coverImage: user.coverImage || ''
        })
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const handleImageUpload = async (file: File, type: 'avatar' | 'cover') => {
    if (!file) return
    
    setIsUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('type', type)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      })

      if (!response.ok) {
        throw new Error('上传失败')
      }

      const data = await response.json()
      
      if (type === 'avatar') {
        setFormData(prev => ({ ...prev, image: data.url }))
      } else {
        setFormData(prev => ({ ...prev, coverImage: data.url }))
      }
      
      toast.success(`${type === 'avatar' ? '头像' : '封面'}上传成功`)
    } catch (error) {
      toast.error('上传失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('更新失败')
      }

      await update({
        ...session,
        user: {
          ...session?.user,
          name: formData.name,
          image: formData.image
        }
      })

      toast.success('资料更新成功')
      router.push(`/profile/${session?.user?.id}`)
    } catch (error) {
      toast.error('更新失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">请先登录</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar user={session.user} />
      
      <main className="container mx-auto max-w-2xl px-4 pt-20 pb-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/profile/${session.user.id}`}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">编辑资料</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative h-48 rounded-2xl overflow-hidden bg-gray-200">
            {formData.coverImage ? (
              <img
                src={formData.coverImage}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200" />
            )}
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 hover:bg-white transition-colors flex items-center gap-2 shadow-lg"
            >
              <Camera className="w-4 h-4" />
              {formData.coverImage ? '更换封面' : '添加封面'}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'cover')}
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-4 -mt-8 ml-4">
            <div className="relative">
              <Avatar className="w-24 h-24 ring-4 ring-white shadow-lg">
                <AvatarImage src={formData.image} />
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white text-2xl">
                  {formData.name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:text-gray-900 border border-gray-200"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'avatar')}
                className="hidden"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div>
              <Label htmlFor="name">昵称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="输入你的昵称"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="bio">简介</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="介绍一下自己..."
                className="mt-1 resize-none"
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {formData.bio.length}/160
              </p>
            </div>

            <div>
              <Label htmlFor="location">位置</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="你在哪个城市？"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="website">网站</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://your-website.com"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isLoading || isUploading}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存更改'
              )}
            </Button>
            <Link href={`/profile/${session.user.id}`}>
              <Button type="button" variant="outline">
                取消
              </Button>
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
