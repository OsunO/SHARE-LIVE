import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { InfiniteFeed } from '@/components/infinite-feed'
import { Navbar } from '@/components/navbar'
import { StoriesBar } from '@/components/stories/StoriesBar'
import { FloatingActionButton } from '@/components/floating-action-button'
import { QuickFilter } from '@/components/quick-filter'
import { Sparkles, TrendingUp, Users, Plus, Compass } from 'lucide-react'

const POSTS_PER_PAGE = 10

// Get greeting based on time
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

// Get random tagline
function getTagline(): string {
  const taglines = [
    '分享你的生活，连接有趣的人',
    '记录美好瞬间，留住珍贵回忆',
    '发现精彩，从这里开始',
    '每一个瞬间都值得被分享',
    '与世界分享你的故事',
  ]
  return taglines[Math.floor(Math.random() * taglines.length)]
}

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
  const serializedPosts = posts.map((post: typeof posts[0]) => ({
    ...post,
    createdAt: post.createdAt.toISOString()
  }))

  const greeting = getGreeting()
  const tagline = getTagline()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar user={session.user} />
      
      {/* Stories Bar */}
      <div className="pt-16">
        <StoriesBar />
      </div>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-6 pb-8 px-4 sm:pt-8 sm:pb-12">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-pink-200/30 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-2xl mx-auto">
          <div className="text-center animate-fade-in">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              <span className="text-gray-800">{greeting}，</span>
              <span className="gradient-text">{session.user.name || '朋友'}</span>
              <span className="inline-block animate-bounce-soft ml-1">👋</span>
            </h1>
            <p className="text-gray-600 text-sm sm:text-base animate-slide-up">
              {tagline}
            </p>
          </div>

          {/* Quick Stats / Filters */}
          <div className="flex justify-center gap-3 sm:gap-4 mt-6 animate-slide-up">
            <QuickFilter iconName="Sparkles" label="新鲜事" color="purple" active />
            <QuickFilter iconName="TrendingUp" label="热门" color="pink" />
            <QuickFilter iconName="Users" label="关注" color="blue" />
            <QuickFilter iconName="Compass" label="发现" color="indigo" href="/discover" />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto max-w-2xl px-3 sm:px-4 pb-24">
        {/* New Post Button - Mobile */}
        <div className="sm:hidden mb-4 animate-scale-in">
          <a
            href="/post/new"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-medium shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 active:scale-[0.98] transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            发布新动态
          </a>
        </div>

        {/* Feed */}
        <InfiniteFeed 
          initialPosts={serializedPosts}
          initialCursor={initialCursor}
          currentUserId={session.user.id}
        />
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton />
    </div>
  )
}
