'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { 
  ArrowLeft, 
  Send, 
  Image as ImageIcon, 
  User,
  MoreVertical,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Message {
  id: string
  content: string
  images: string[]
  createdAt: string
  read: boolean
  sender: {
    id: string
    name: string | null
    image: string | null
  }
}

interface ConversationData {
  id: string
  otherUser: {
    id: string
    name: string | null
    image: string | null
  }
  createdAt: string
}

export default function ConversationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const conversationId = params.conversationId as string

  const [conversation, setConversation] = useState<ConversationData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // 获取消息
  const fetchMessages = useCallback(async (isLoadMore = false) => {
    try {
      if (!isLoadMore) setLoading(true)
      
      const url = cursor && isLoadMore
        ? `/api/messages/${conversationId}?cursor=${cursor}`
        : `/api/messages/${conversationId}`
      
      const res = await fetch(url)
      if (!res.ok) throw new Error('获取失败')
      
      const data = await res.json()
      
      if (isLoadMore) {
        setMessages(prev => [...data.messages, ...prev])
      } else {
        setMessages(data.messages)
        setConversation(data.conversation)
      }
      
      setHasMore(data.hasMore)
      if (data.messages.length > 0 && isLoadMore) {
        setCursor(data.messages[0].id)
      } else if (!isLoadMore && data.messages.length > 0) {
        setCursor(data.messages[0].id)
      }
    } catch (err) {
      console.error('Fetch messages error:', err)
    } finally {
      setLoading(false)
    }
  }, [conversationId, cursor])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user && conversationId) {
      fetchMessages()
    }
  }, [session, conversationId])

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages.length])

  // 发送消息
  const sendMessage = async () => {
    if (!messageText.trim() || sending) return
    
    try {
      setSending(true)
      
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: conversation?.otherUser.id,
          content: messageText.trim()
        })
      })
      
      if (!res.ok) throw new Error('发送失败')
      
      const data = await res.json()
      setMessages(prev => [...prev, data.message])
      setMessageText('')
    } catch (err) {
      console.error('Send message error:', err)
      alert('发送失败')
    } finally {
      setSending(false)
    }
  }

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
  }

  // 按日期分组消息
  const groupedMessages = messages.reduce((groups: { date: string; messages: Message[] }[], msg) => {
    const date = formatDate(msg.createdAt)
    const existingGroup = groups.find(g => g.date === date)
    if (existingGroup) {
      existingGroup.messages.push(msg)
    } else {
      groups.push({ date, messages: [msg] })
    }
    return groups
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">会话不存在</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 头部 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push('/messages')}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3 flex-1">
            {conversation.otherUser.image ? (
              <img
                src={conversation.otherUser.image}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-400" />
              </div>
            )}
            <span className="font-medium">
              {conversation.otherUser.name || '匿名用户'}
            </span>
          </div>

          <button className="p-2 hover:bg-gray-100 rounded-full">
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </header>

      {/* 消息列表 */}
      <main 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 py-4"
      >
        {hasMore && (
          <div className="text-center mb-4">
            <button
              onClick={() => fetchMessages(true)}
              className="text-sm text-blue-500 hover:underline"
            >
              加载更多消息
            </button>
          </div>
        )}

        {groupedMessages.map((group) => (
          <div key={group.date}>
            {/* 日期分割线 */}
            <div className="text-center my-4">
              <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                {group.date}
              </span>
            </div>

            {/* 消息 */}
            {group.messages.map((msg) => {
              const isMine = msg.sender.id === session?.user?.id
              
              return (
                <div
                  key={msg.id}
                  className={`flex mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[70%] ${isMine ? 'flex-row-reverse' : ''}`}>
                    {/* 头像 */}
                    {!isMine && (
                      msg.sender.image ? (
                        <img
                          src={msg.sender.image}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                      )
                    )}

                    {/* 消息气泡 */}
                    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isMine
                            ? 'bg-blue-500 text-white rounded-br-md'
                            : 'bg-white border rounded-bl-md'
                        }`}
                      >
                        {msg.images.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {msg.images.map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt=""
                                className="max-w-[200px] rounded-lg"
                              />
                            ))}
                          </div>
                        )}
                        {msg.content && (
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 mt-1 px-1">
                        {formatTime(msg.createdAt)}
                        {isMine && msg.read && ' · 已读'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </main>

      {/* 输入框 */}
      <footer className="bg-white border-t sticky bottom-0">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <ImageIcon className="w-5 h-5 text-gray-500" />
            </button>
            
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="输入消息..."
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <Button
              onClick={sendMessage}
              disabled={!messageText.trim() || sending}
              size="icon"
              className="rounded-full"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}