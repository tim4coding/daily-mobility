import { useState, useEffect, useRef, useCallback } from 'react'

export default function useTimer(initialSeconds, onComplete) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(initialSeconds > 0)
  const intervalRef = useRef(null)
  const onCompleteRef = useRef(onComplete)

  onCompleteRef.current = onComplete

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // When initialSeconds changes, reset everything
  useEffect(() => {
    clearTimer()
    setSecondsLeft(initialSeconds)
    setIsRunning(initialSeconds > 0)
  }, [initialSeconds, clearTimer])

  // Run the interval while isRunning and secondsLeft > 0
  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) {
      clearTimer()
      return
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1
        if (next <= 0) {
          return 0
        }
        return next
      })
    }, 1000)

    return clearTimer
  }, [isRunning, secondsLeft, clearTimer])

  // Separate effect: fire onComplete when countdown reaches 0
  // Only fires when secondsLeft transitions TO 0 while isRunning
  const prevSecondsRef = useRef(initialSeconds)
  useEffect(() => {
    const wasAboveZero = prevSecondsRef.current > 0
    prevSecondsRef.current = secondsLeft

    if (secondsLeft === 0 && wasAboveZero && isRunning) {
      setIsRunning(false)
      onCompleteRef.current?.()
    }
  }, [secondsLeft, isRunning])

  const pause = useCallback(() => setIsRunning(false), [])
  const resume = useCallback(() => setIsRunning(true), [])
  const toggle = useCallback(() => setIsRunning((r) => !r), [])
  const reset = useCallback((newSeconds) => {
    setSecondsLeft(newSeconds ?? initialSeconds)
    setIsRunning(true)
  }, [initialSeconds])

  return { secondsLeft, isRunning, pause, resume, toggle, reset }
}
