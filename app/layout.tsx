import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/auth-provider'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'SHARE LIVE - 分享生活',
  description: '记录美好瞬间，分享生活点滴',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="font-sans">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
