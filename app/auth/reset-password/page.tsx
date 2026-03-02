'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, ArrowLeft, CheckCircle, KeyRound } from 'lucide-react'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (password.length < 6) {
      setError('密码至少需要6个字符')
      return
    }

    if (!token) {
      setError('重置链接无效或已过期')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '重置失败，请重试')
      } else {
        setSuccess('密码重置成功！正在跳转到登录页面...')
        setTimeout(() => {
          router.push('/auth/signin')
        }, 2000)
      }
    } catch (err) {
      setError('网络错误，请检查连接后重试')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center py-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center"
        >
          <KeyRound className="w-8 h-8 text-red-300" />
        </motion.div>
        <h2 className="text-xl font-semibold text-white mb-2">链接无效</h2>
        <p className="text-white/70 mb-6">重置链接无效或已过期</p>
        <Link 
          href="/auth/forgot-password"
          className="inline-flex items-center gap-2 text-white hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          重新获取链接
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-red-500/20 border border-red-500/30 text-red-100 px-4 py-3 rounded-xl text-sm backdrop-blur-sm"
        >
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-green-500/20 border border-green-500/30 text-green-100 px-4 py-3 rounded-xl text-sm backdrop-blur-sm flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          {success}
        </motion.div>
      )}

      <div className="relative group">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 group-focus-within:text-white/80 transition-colors" />
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="新密码 (至少6个字符)"
          className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all backdrop-blur-sm"
        />
      </div>

      <div className="relative group">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 group-focus-within:text-white/80 transition-colors" />
        <input
          id="confirmPassword"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="确认新密码"
          className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all backdrop-blur-sm"
        />
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={loading || !!success}
        className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-white text-purple-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full"
          />
        ) : (
          <>
            重置密码
            <CheckCircle className="w-5 h-5" />
          </>
        )}
      </motion.button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-pink-400/30 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-blue-400/30 to-transparent rounded-full blur-3xl"
        />
      </div>

      {/* Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-purple-400 to-blue-400 shadow-lg"
            >
              <KeyRound className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">重置密码</h1>
            <p className="text-white/70">设置您的新密码</p>
          </div>

          {/* Form */}
          <div className="px-8 pb-8">
            <Suspense fallback={
              <div className="flex items-center justify-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full"
                />
              </div>
            }>
              <ResetPasswordForm />
            </Suspense>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-white/5 border-t border-white/10">
            <Link 
              href="/auth/signin" 
              className="flex items-center justify-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回登录
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
