'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { PlusCircle, User, LogOut, Home, Compass, Bell, Menu, X, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

interface NavbarProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function Navbar({ user }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const navItems = [
    { href: '/', icon: Home, label: '首页' },
    { href: '/discover', icon: Compass, label: '发现' },
    { href: '/notifications', icon: Bell, label: '通知' },
    { href: '/messages', icon: MessageCircle, label: '私信' },
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'bg-white/90 backdrop-blur-xl shadow-lg shadow-purple-500/5 border-b border-gray-200/50' 
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ rotate: 180, scale: 1.05 }}
                transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30"
              >
                <span className="text-white font-bold text-lg">S</span>
              </motion.div>
              <span className={`font-bold text-xl transition-colors duration-300 ${
                scrolled ? 'text-gray-800' : 'text-white drop-shadow-md'
              }`}>
                SHARE LIVE
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item, index) => (
                <NavButton 
                  key={item.href} 
                  {...item} 
                  scrolled={scrolled}
                  isActive={isActive(item.href)}
                  delay={index * 0.05}
                />
              ))}
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Link 
                  href="/post/new"
                  className="ml-2 p-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <PlusCircle className="w-5 h-5" />
                </Link>
              </motion.div>

              {/* User Menu */}
              <div className="relative ml-4">
                <motion.button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-white/10 transition-colors focus-glow rounded-full"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    {user.image ? (
                      <img 
                        src={user.image} 
                        alt={user.name || 'User'} 
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-white/50"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-medium ring-2 ring-white/50">
                        {user.name?.[0] || 'U'}
                      </div>
                    )}
                  </motion.div>
                  <span className={`hidden lg:block text-sm font-medium transition-colors duration-300 ${
                    scrolled ? 'text-gray-700' : 'text-white drop-shadow-md'
                  }`}>
                    {user.name || '用户'}
                  </span>
                </motion.button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      {/* Backdrop */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setUserMenuOpen(false)}
                        className="fixed inset-0 z-40"
                      />
                      
                      {/* Menu */}
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                      >
                        <div className="p-3 border-b border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">当前登录</p>
                          <p className="font-medium text-gray-900 truncate">{user.name || '用户'}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                        
                        <Link
                          href={`/profile/${user.id}`}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all group"
                        >
                          <User className="w-5 h-5 text-gray-500 group-hover:text-purple-500 transition-colors" />
                          <span className="text-gray-700 group-hover:text-gray-900">个人主页</span>
                        </Link>
                        
                        <button
                          onClick={() => {
                            setUserMenuOpen(false)
                            signOut()
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 transition-all group"
                        >
                          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span>退出登录</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileTap={{ scale: 0.9 }}
              className={`md:hidden p-2 rounded-xl transition-colors ${
                scrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10'
              }`}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className={`w-6 h-6 ${scrolled ? 'text-gray-800' : 'text-white'}`} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className={`w-6 h-6 ${scrolled ? 'text-gray-800' : 'text-white'}`} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            className="fixed inset-x-0 top-16 z-40 md:hidden"
          >
            <div className="mx-4 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {navItems.map((item, index) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-6 py-4 transition-all border-b border-gray-100 last:border-0 ${
                        active 
                          ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-600' 
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${active ? 'text-purple-500' : 'text-gray-500'}`} />
                      <span className="font-medium">{item.label}</span>
                      {active && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="ml-auto w-2 h-2 rounded-full bg-purple-500"
                        />
                      )}
                    </Link>
                  </motion.div>
                )
              })}
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                <Link
                  href="/post/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span className="font-medium">发布动态</span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function NavButton({ 
  href, 
  icon: Icon, 
  label, 
  scrolled, 
  isActive,
  delay 
}: { 
  href: string
  icon: React.ElementType
  label: string
  scrolled: boolean
  isActive: boolean
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Link
        href={href}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
          isActive
            ? scrolled
              ? 'bg-purple-100 text-purple-600'
              : 'bg-white/20 text-white'
            : scrolled
              ? 'text-gray-600 hover:bg-gray-100 hover:text-purple-600'
              : 'text-white/80 hover:bg-white/10 hover:text-white'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{label}</span>
        {isActive && (
          <motion.div
            layoutId="navIndicator"
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
              scrolled ? 'bg-purple-500' : 'bg-white'
            }`}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </Link>
    </motion.div>
  )
}
