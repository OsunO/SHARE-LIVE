'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { PlusCircle, User, LogOut, Home } from 'lucide-react'

interface NavbarProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function Navbar({ user }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="container mx-auto max-w-2xl px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-primary-600">
          SHARE LIVE
        </Link>
        
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Home className="w-6 h-6" />
          </Link>
          
          <Link 
            href="/post/new" 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <PlusCircle className="w-6 h-6" />
          </Link>
          
          <Link 
            href={`/profile/${user.id}`}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            {user.image ? (
              <img 
                src={user.image} 
                alt={user.name || 'User'} 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <User className="w-6 h-6" />
            )}
          </Link>
          
          <button 
            onClick={() => signOut()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  )
}
