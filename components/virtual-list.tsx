'use client'

import { useState, useEffect, useRef, useCallback, useMemo, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface VirtualListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  itemHeight: number | ((item: T, index: number) => number)
  overscan?: number
  className?: string
  containerClassName?: string
  onScroll?: (scrollTop: number) => void
  onEndReached?: () => void
  endReachedThreshold?: number
}

interface VirtualItem {
  index: number
  item: any
  top: number
  height: number
}

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  overscan = 5,
  className = '',
  containerClassName = '',
  onScroll,
  onEndReached,
  endReachedThreshold = 200
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const endReachedCalled = useRef(false)

  // 计算每个项目的位置和高度
  const virtualItems = useMemo(() => {
    const result: VirtualItem[] = []
    let currentTop = 0

    items.forEach((item, index) => {
      const height = typeof itemHeight === 'function' 
        ? itemHeight(item, index) 
        : itemHeight

      result.push({
        index,
        item,
        top: currentTop,
        height
      })

      currentTop += height
    })

    return result
  }, [items, itemHeight])

  // 总高度
  const totalHeight = useMemo(() => {
    if (virtualItems.length === 0) return 0
    const lastItem = virtualItems[virtualItems.length - 1]
    return lastItem.top + lastItem.height
  }, [virtualItems])

  // 可见范围
  const visibleRange = useMemo(() => {
    const start = scrollTop
    const end = scrollTop + containerHeight

    // 找到起始索引
    let startIndex = 0
    for (let i = 0; i < virtualItems.length; i++) {
      if (virtualItems[i].top + virtualItems[i].height > start - overscan * 200) {
        startIndex = Math.max(0, i - overscan)
        break
      }
    }

    // 找到结束索引
    let endIndex = virtualItems.length
    for (let i = startIndex; i < virtualItems.length; i++) {
      if (virtualItems[i].top > end + overscan * 200) {
        endIndex = Math.min(virtualItems.length, i + overscan)
        break
      }
    }

    return { startIndex, endIndex }
  }, [scrollTop, containerHeight, virtualItems, overscan])

  // 处理滚动
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop
    setScrollTop(newScrollTop)
    onScroll?.(newScrollTop)

    // 检查是否到达底部
    if (onEndReached && !endReachedCalled.current) {
      const scrollHeight = e.currentTarget.scrollHeight
      const clientHeight = e.currentTarget.clientHeight
      
      if (scrollHeight - newScrollTop - clientHeight < endReachedThreshold) {
        endReachedCalled.current = true
        onEndReached()
      }
    }
  }, [onScroll, onEndReached, endReachedThreshold])

  // 重置 endReached 当 items 变化时
  useEffect(() => {
    endReachedCalled.current = false
  }, [items.length])

  // 监听容器高度变化
  useEffect(() => {
    if (!containerRef.current) return

    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight)
      }
    }

    updateHeight()

    const resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(containerRef.current)

    return () => resizeObserver.disconnect()
  }, [])

  // 可见项目
  const visibleItems = useMemo(() => {
    return virtualItems.slice(visibleRange.startIndex, visibleRange.endIndex)
  }, [virtualItems, visibleRange])

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${containerClassName}`}
      onScroll={handleScroll}
      style={{ willChange: 'transform' }}
    >
      <div
        className={className}
        style={{
          height: totalHeight,
          position: 'relative'
        }}
      >
        <AnimatePresence mode="popLayout">
          {visibleItems.map(({ index, item, top, height }) => (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: `translateY(${top}px)`,
                height,
                willChange: 'transform'
              }}
            >
              {renderItem(item as T, index)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// 用于瀑布流的虚拟列表 (支持不同高度的项目)
interface VirtualMasonryProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  getItemHeight: (item: T, index: number) => number
  columnCount: number
  gap?: number
  overscan?: number
  className?: string
  onEndReached?: () => void
}

export function VirtualMasonry<T>({
  items,
  renderItem,
  getItemHeight,
  columnCount,
  gap = 16,
  overscan = 3,
  className = '',
  onEndReached
}: VirtualMasonryProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const endReachedCalled = useRef(false)

  // 将项目分配到各列
  const columns = useMemo(() => {
    const cols: { items: { item: T; index: number; height: number }[]; totalHeight: number }[] = 
      Array.from({ length: columnCount }, () => ({ items: [], totalHeight: 0 }))

    items.forEach((item, index) => {
      const height = getItemHeight(item, index)
      
      // 找到最短的列
      const shortestCol = cols.reduce((min, col, i) => 
        col.totalHeight < cols[min].totalHeight ? i : min, 0
      )

      cols[shortestCol].items.push({ item, index, height })
      cols[shortestCol].totalHeight += height + gap
    })

    return cols
  }, [items, getItemHeight, columnCount, gap])

  // 计算每列的可见项目
  const visibleColumns = useMemo(() => {
    return columns.map(col => {
      let currentTop = 0
      const visibleItems: { item: T; index: number; top: number; height: number }[] = []

      for (const { item, index, height } of col.items) {
        const itemBottom = currentTop + height
        const viewportTop = scrollTop - overscan * 400
        const viewportBottom = scrollTop + containerHeight + overscan * 400

        if (itemBottom >= viewportTop && currentTop <= viewportBottom) {
          visibleItems.push({ item, index, top: currentTop, height })
        }

        currentTop += height + gap
      }

      return { ...col, visibleItems }
    })
  }, [columns, scrollTop, containerHeight, overscan, gap])

  // 最大列高度
  const maxHeight = useMemo(() => {
    return Math.max(...columns.map(col => col.totalHeight))
  }, [columns])

  // 处理滚动
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop
    setScrollTop(newScrollTop)

    // 检查是否到达底部
    if (onEndReached && !endReachedCalled.current) {
      const scrollHeight = e.currentTarget.scrollHeight
      const clientHeight = e.currentTarget.clientHeight
      
      if (scrollHeight - newScrollTop - clientHeight < 200) {
        endReachedCalled.current = true
        onEndReached()
      }
    }
  }, [onEndReached])

  // 重置 endReached
  useEffect(() => {
    endReachedCalled.current = false
  }, [items.length])

  // 监听容器高度
  useEffect(() => {
    if (!containerRef.current) return

    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight)
      }
    }

    updateHeight()

    const resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(containerRef.current)

    return () => resizeObserver.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      onScroll={handleScroll}
      style={{ willChange: 'transform' }}
    >
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
          minHeight: maxHeight
        }}
      >
        {visibleColumns.map((col, colIndex) => (
          <div key={colIndex} className="relative" style={{ gap: `${gap}px` }}>
            {col.visibleItems.map(({ item, index, top, height }) => (
              <motion.div
                key={index}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  transform: `translateY(${top}px)`,
                  height,
                  willChange: 'transform'
                }}
              >
                {renderItem(item, index)}
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Hook for virtual scroll
export function useVirtualScroll() {
  const [scrollTop, setScrollTop] = useState(0)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 })

  const updateVisibleRange = useCallback((
    containerHeight: number,
    itemHeight: number,
    totalItems: number,
    overscan = 5
  ) => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const end = Math.min(totalItems, start + visibleCount + overscan * 2)
    
    setVisibleRange({ start, end })
  }, [scrollTop])

  return {
    scrollTop,
    setScrollTop,
    visibleRange,
    updateVisibleRange
  }
}
