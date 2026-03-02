'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { PlusCircle, User, LogOut, Home, Compass, Bell, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
  const { data: session } = useSession()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { href: '/', icon: Home, label: '首页' },
    { href: '/discover', icon: Compass, label: '发现' },
    { href: '/notifications', icon: Bell, label: '通知' },
  ]

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50' 
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30"
              >
                <span className="text-white font-bold text-lg">S</span>
              </motion.div>
              <span className={`font-bold text-xl transition-colors ${scrolled ? 'text-gray-800' : 'text-white'}`}>
                SHARE LIVE
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavButton key={item.href} {...item} scrolled={scrolled} />
              ))}
              
              <Link 
                href="/post/new"
                className="ml-2 p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all hover:scale-105"
              >
                <PlusCircle className="w-5 h-5" />
              </Link>

              {/* User Menu */}
              <div className="relative ml-4">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-white/10 transition-colors"
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
                  <span className={`hidden lg:block text-sm font-medium ${scrolled ? 'text-gray-700' : 'text-white'}`}>
                    {user.name || '用户'}
                  </span>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                    >
                      <Link
                        href={`/profile/${user.id}`}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-700">个人主页</span>
                      </Link>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          signOut()
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>退出登录</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-xl transition-colors ${scrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
            >
              {mobileMenuOpen ? (
                <X className={`w-6 h-6 ${scrolled ? 'text-gray-800' : 'text-white'}`} />
              ) : (
                <Menu className={`w-6 h-6 ${scrolled ? 'text-gray-800' : 'text-white'}`} />
              )}
            </button>
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
            className="fixed inset-x-0 top-16 z-40 md:hidden"
          >
            <div className="mx-4 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                  >
                    <item.icon className="w-5 h-5 text-purple-500" />
                    <span className="text-gray-700 font-medium">{item.label}</span>
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
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

function NavButton({ href, icon: Icon, label, scrolled }: { 
  href: string
  icon: React.ElementType
  label: string
  scrolled: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
        scrolled 
          ? 'text-gray-600 hover:bg-gray-100 hover:text-purple-600' 
          : 'text-white/80 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}
