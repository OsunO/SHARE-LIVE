import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { Feed } from '@/components/feed'
import { Navbar } from '@/components/navbar'

export default async function Home() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

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
    take: 20
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={session.user} />
      <main className="container mx-auto max-w-2xl px-4 py-6">
        <Feed posts={posts} currentUserId={session.user.id} />
      </main>
    </div>
  )
}
