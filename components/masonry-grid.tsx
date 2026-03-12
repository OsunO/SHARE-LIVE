'use client'

import { useEffect, useState, useRef, ReactNode } from 'react'
import { motion } from 'framer-motion'

interface MasonryGridProps {
  children: ReactNode[]
  className?: string
}

// Calculate which column an item should go into based on its height
function distributeItemsToColumns(
  items: ReactNode[],
  columnCount: number
): ReactNode[][] {
  const columns: ReactNode[][] = Array.from({ length: columnCount }, () => [])
  const columnHeights = Array(columnCount).fill(0)

  items.forEach((item, index) => {
    // Find the shortest column
    const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights))
    columns[shortestColumn].push(
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
      >
        {item}
      </motion.div>
    )
    // Estimate height (items will adjust naturally in CSS Grid/Flex)
    columnHeights[shortestColumn] += 1
  })

  return columns
}

export function MasonryGrid({ children, className = '' }: MasonryGridProps) {
  const [columnCount, setColumnCount] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

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

  const items = Array.isArray(children) ? children : [children]
  const columns = distributeItemsToColumns(items, columnCount)

  return (
    <div
      ref={containerRef}
      className={`grid gap-4 ${
        columnCount === 1 ? 'grid-cols-1' :
        columnCount === 2 ? 'grid-cols-2' :
        'grid-cols-3'
      } ${className}`}
    >
      {columns.map((column, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-4">
          {column}
        </div>
      ))}
    </div>
  )
}
