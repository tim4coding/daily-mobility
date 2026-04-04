import { useState, useRef, useCallback } from 'react'

export default function useDragReorder(items, onReorder) {
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)
  const containerRef = useRef(null)
  const itemRectsRef = useRef([])
  const startYRef = useRef(0)
  const currentYRef = useRef(0)
  const dragItemRef = useRef(null)

  const captureRects = useCallback(() => {
    if (!containerRef.current) return
    const children = containerRef.current.querySelectorAll('[data-drag-item]')
    itemRectsRef.current = Array.from(children).map((el) => {
      const rect = el.getBoundingClientRect()
      return { top: rect.top, bottom: rect.bottom, mid: rect.top + rect.height / 2 }
    })
  }, [])

  const findOverIndex = useCallback((clientY) => {
    const rects = itemRectsRef.current
    for (let i = 0; i < rects.length; i++) {
      if (clientY < rects[i].mid) return i
    }
    return rects.length - 1
  }, [])

  const handleDragStart = useCallback((index, clientY) => {
    captureRects()
    setDragIndex(index)
    setOverIndex(index)
    startYRef.current = clientY
    currentYRef.current = clientY
  }, [captureRects])

  const handleDragMove = useCallback((clientY) => {
    if (dragIndex === null) return
    currentYRef.current = clientY
    const newOver = findOverIndex(clientY)
    setOverIndex(newOver)
  }, [dragIndex, findOverIndex])

  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const newItems = [...items]
      const [moved] = newItems.splice(dragIndex, 1)
      newItems.splice(overIndex, 0, moved)
      onReorder(newItems)
    }
    setDragIndex(null)
    setOverIndex(null)
  }, [dragIndex, overIndex, items, onReorder])

  // Touch handlers for the drag handle
  const getDragHandleProps = useCallback((index) => ({
    onTouchStart: (e) => {
      e.preventDefault()
      handleDragStart(index, e.touches[0].clientY)
    },
    onMouseDown: (e) => {
      e.preventDefault()
      handleDragStart(index, e.clientY)
    },
  }), [handleDragStart])

  // Container-level move/end handlers
  const getContainerProps = useCallback(() => ({
    ref: containerRef,
    onTouchMove: (e) => {
      if (dragIndex !== null) {
        e.preventDefault()
        handleDragMove(e.touches[0].clientY)
      }
    },
    onTouchEnd: () => handleDragEnd(),
    onMouseMove: (e) => handleDragMove(e.clientY),
    onMouseUp: () => handleDragEnd(),
    onMouseLeave: () => handleDragEnd(),
  }), [dragIndex, handleDragMove, handleDragEnd])

  return {
    dragIndex,
    overIndex,
    getDragHandleProps,
    getContainerProps,
  }
}
