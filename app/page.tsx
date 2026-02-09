import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { InfiniteFeed } from '@/components/infinite-feed'
import { Navbar } from '@/components/navbar'

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
    <div className="min-h-screen bg-gray-50">
      <Navbar user={session.user} />
      <main className="container mx-auto max-w-2xl px-4 py-6">
        <InfiniteFeed 
          initialPosts={serializedPosts}
          initialCursor={initialCursor}
          currentUserId={session.user.id}
        />
      </main>
    </div>
  )
}
