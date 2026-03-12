'use client'

import { useEffect, useState, useRef, ReactNode, useMemo } from 'react'
import { motion } from 'framer-motion'

interface MasonryGridProps {
  children: ReactNode[]
  className?: string
  gap?: number
}

interface ColumnItem {
  node: ReactNode
  key: string | number
  estimatedHeight: number
}

// Estimate item height based on content type
function estimateHeight(node: ReactNode): number {
  // Default estimation - can be refined based on actual content
  if (!node || typeof node !== 'object') return 200
  
  // Try to extract image count from props for better estimation
  const props = (node as any).props
  if (props?.post?.images?.length) {
    // Base height + per image height
    const imageCount = props.post.images.length
    if (imageCount === 1) return 450
    if (imageCount === 2) return 350
    if (imageCount === 3) return 400
    if (imageCount >= 4) return 450
  }
  
  // Content-based estimation
  if (props?.post?.content?.length > 200) return 350
  if (props?.post?.content?.length > 100) return 300
  
  return 250
}

// Distribute items to columns using balanced height algorithm
function distributeItemsToColumns(
  items: ReactNode[],
  columnCount: number
): ColumnItem[][] {
  const columns: ColumnItem[][] = Array.from({ length: columnCount }, () => [])
  const columnHeights = Array(columnCount).fill(0)

  items.forEach((item, index) => {
    const estimatedHeight = estimateHeight(item)
    
    // Find the shortest column
    const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
    
    columns[shortestColumnIndex].push({
      node: item,
      key: index,
      estimatedHeight
    })
    
    columnHeights[shortestColumnIndex] += estimatedHeight
  })

  return columns
}

export function MasonryGrid({ 
  children, 
  className = '',
  gap = 16
}: MasonryGridProps) {
  const [columnCount, setColumnCount] = useState(1)
  const [isMounted, setIsMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Responsive column count
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth
      if (width >= 1280) {
        setColumnCount(3)
      } else if (width >= 768) {
        setColumnCount(2)
      } else {
        setColumnCount(1)
      }
    }

    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [])

  const items = useMemo(() => {
    return Array.isArray(children) ? children : [children]
  }, [children])

  const columns = useMemo(() => {
    return distributeItemsToColumns(items, columnCount)
  }, [items, columnCount])

  // Prevent hydration mismatch by rendering single column on server
  if (!isMounted) {
    return (
      <div className={`grid grid-cols-1 gap-4 ${className}`}>
        {items.map((child, index) => (
          <div key={index}>{child}</div>
        ))}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`grid ${
        columnCount === 1 ? 'grid-cols-1' :
        columnCount === 2 ? 'grid-cols-2' :
        'grid-cols-3'
      } ${className}`}
      style={{ gap: `${gap}px` }}
    >
      {columns.map((column, columnIndex) => (
        <div 
          key={columnIndex} 
          className="flex flex-col"
          style={{ gap: `${gap}px` }}
        >
          {column.map((item) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.4, 
                delay: (columnIndex * 0.05) + (column.indexOf(item) * 0.05),
                ease: [0.34, 1.56, 0.64, 1]
              }}
              layout
            >
              {item.node}
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  )
}
