'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, Lock, ArrowRight, Sparkles, CheckCircle, Eye, EyeOff, Shield } from 'lucide-react'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const router = useRouter()

  const validateForm = () => {
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return false
    }

    if (password.length < 6) {
      setError('密码至少需要6个字符')
      return false
    }

    if (name.length < 2) {
      setError('昵称至少需要2个字符')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('请输入有效的邮箱地址')
      return false
    }

    if (!agreedToTerms) {
      setError('请同意服务条款和隐私政策')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) return

    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || `注册失败 (${response.status})`)
      } else {
        setSuccess('注册成功！正在跳转到登录页面...')
        setTimeout(() => {
          router.push('/auth/signin')
        }, 2000)
      }
    } catch (err: any) {
      setError('网络错误，请检查连接后重试')
    } finally {
      setLoading(false)
    }
  }

  // Password strength indicator
  const getPasswordStrength = (pwd: string) => {
    let strength = 0
    if (pwd.length >= 6) strength++
    if (pwd.length >= 10) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^A-Za-z0-9]/.test(pwd)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(password)
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500']
  const strengthLabels = ['太弱', '较弱', '一般', '较强', '很强']

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
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/4 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl"
        />
      </div>

      {/* Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 shadow-lg shadow-pink-500/30"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-white mb-2"
            >
              创建账号
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/70"
            >
              开始分享你的生活点滴
            </motion.p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className="bg-red-500/20 border border-red-500/30 text-red-100 px-4 py-3 rounded-xl text-sm backdrop-blur-sm overflow-hidden"
                >
                  {error}
                </motion.div>
              )}

              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className="bg-green-500/20 border border-green-500/30 text-green-100 px-4 py-3 rounded-xl text-sm backdrop-blur-sm flex items-center gap-2 overflow-hidden"
                >
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Name Input */}
            <motion.div 
              className="relative group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                animate={{ 
                  scale: focusedField === 'name' ? 1.1 : 1,
                  color: focusedField === 'name' ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.5)'
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
              >
                <User className="w-5 h-5" />
              </motion.div>
              <input
                id="name"
                type="text"
                required
                minLength={2}
                maxLength={20}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                placeholder="昵称 (2-20个字符)"
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent focus:bg-white/15 transition-all backdrop-blur-sm"
              />
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: focusedField === 'name' ? 1 : 0 }}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-400 to-purple-400 origin-left"
              />
            </motion.div>

            {/* Email Input */}
            <motion.div 
              className="relative group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <motion.div
                animate={{ 
                  scale: focusedField === 'email' ? 1.1 : 1,
                  color: focusedField === 'email' ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.5)'
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
              >
                <Mail className="w-5 h-5" />
              </motion.div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="邮箱地址"
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent focus:bg-white/15 transition-all backdrop-blur-sm"
              />
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: focusedField === 'email' ? 1 : 0 }}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-400 to-purple-400 origin-left"
              />
            </motion.div>

            {/* Password Input */}
            <motion.div 
              className="relative group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <motion.div
                animate={{ 
                  scale: focusedField === 'password' ? 1.1 : 1,
                  color: focusedField === 'password' ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.5)'
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
              >
                <Lock className="w-5 h-5" />
              </motion.div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="密码 (至少6个字符)"
                className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent focus:bg-white/15 transition-all backdrop-blur-sm"
              />
              <motion.button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                whileTap={{ scale: 0.9 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </motion.button>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: focusedField === 'password' ? 1 : 0 }}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-400 to-purple-400 origin-left"
              />
              
              {/* Password strength indicator */}
              {password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2"
                >
                  <div className="flex gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: i < passwordStrength ? 1 : 0.3 }}
                        className={`flex-1 h-1 rounded-full ${i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-white/20'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-white/60">
                    密码强度: {strengthLabels[passwordStrength - 1] || '太弱'}
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Confirm Password Input */}
            <motion.div 
              className="relative group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <motion.div
                animate={{ 
                  scale: focusedField === 'confirmPassword' ? 1.1 : 1,
                  color: focusedField === 'confirmPassword' ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.5)'
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
              >
                <Shield className="w-5 h-5" />
              </motion.div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
                placeholder="确认密码"
                className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent focus:bg-white/15 transition-all backdrop-blur-sm"
              />
              <motion.button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                whileTap={{ scale: 0.9 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </motion.button>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: focusedField === 'confirmPassword' ? 1 : 0 }}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-400 to-purple-400 origin-left"
              />
            </motion.div>

            {/* Terms checkbox */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex items-start gap-2"
            >
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 rounded border-white/30 bg-white/10 text-purple-500 focus:ring-white/30 w-4 h-4 cursor-pointer"
              />
              <p className="text-sm text-white/70">
                我已阅读并同意{' '}
                <Link href="/terms" className="text-white hover:underline">服务条款</Link>
                {' '}和{' '}
                <Link href="/privacy" className="text-white hover:underline">隐私政策</Link>
              </p>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              whileHover={{ scale: 1.02, boxShadow: '0 20px 40px -10px rgba(236, 72, 153, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-white text-purple-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group mt-6"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-pink-100 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity"
              />
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full relative z-10"
                />
              ) : (
                <>
                  <span className="relative z-10">创建账号</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <motion.div 
            className="px-8 py-6 bg-white/5 border-t border-white/10 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            <p className="text-white/70">
              已有账号？{' '}
              <Link href="/auth/signin" className="text-white font-semibold hover:underline relative group">
                立即登录
                <motion.span
                  className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"
                />
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
