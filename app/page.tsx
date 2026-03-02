import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { InfiniteFeed } from '@/components/infinite-feed'
import { Navbar } from '@/components/navbar'
import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Users } from 'lucide-react'

const POSTS_PER_PAGE = 10

export default async function Home() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  // Fetch initial posts for SSR
  const posts = await prisma.post.findMany({
    where: { published: true },
    include: {
      author: {
        select: { id: true, name: true, image: true }
      },
      _count: {
        select: { likes: true, comments: true, favorites: true }
      },
      likes: {
        where: { userId: session.user.id },
        select: { id: true }
      },
      favorites: {
        where: { userId: session.user.id },
        select: { id: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: POSTS_PER_PAGE
  })

  const lastPost = posts[posts.length - 1]
  const initialCursor = lastPost?.id || null

  // Serialize dates for client component
  const serializedPosts = posts.map(post => ({
    ...post,
    createdAt: post.createdAt.toISOString()
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar user={session.user} />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-6 pb-8 px-4 sm:pt-8 sm:pb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5" />
        
        <div className="relative max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
              发现精彩瞬间
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              分享你的生活，连接有趣的人
            </p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center gap-4 sm:gap-8 mt-6"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full shadow-sm">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">新鲜事</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full shadow-sm">
              <TrendingUp className="w-4 h-4 text-pink-500" />
              <span className="text-sm font-medium text-gray-700">热门</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full shadow-sm hidden sm:flex">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">关注</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto max-w-2xl px-3 sm:px-4 pb-20">
        {/* New Post Button - Mobile */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="sm:hidden mb-4"
        >
          <a
            href="/post/new"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium shadow-lg shadow-purple-500/25"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            发布新动态
          </a>
        </motion.div>

        {/* Feed */}
        <InfiniteFeed 
          initialPosts={serializedPosts}
          initialCursor={initialCursor}
          currentUserId={session.user.id}
        />
      </main>

      {/* Floating Action Button - Mobile */}
      <motion.a
        href="/post/new"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center z-40"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
      </motion.a>
    </div>
  )
}
