import { useEffect, useRef } from 'react'

export default function useWakeLock(enabled) {
  const wakeLockRef = useRef(null)

  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return

    let released = false

    async function acquire() {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null
        })
      } catch {
        // Wake lock request failed (e.g. low battery)
      }
    }

    // Re-acquire on visibility change (iOS releases it when switching tabs)
    function handleVisibility() {
      if (!released && document.visibilityState === 'visible' && !wakeLockRef.current) {
        acquire()
      }
    }

    acquire()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      released = true
      document.removeEventListener('visibilitychange', handleVisibility)
      if (wakeLockRef.current) {
        wakeLockRef.current.release()
        wakeLockRef.current = null
      }
    }
  }, [enabled])
}
