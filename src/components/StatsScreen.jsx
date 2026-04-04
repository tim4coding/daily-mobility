import { useState, useCallback } from 'react'
import { getStreak, getLongestStreak, getCompletedDates, getWorkoutHistory, getLocalDateStr, toggleWorkoutDate } from '../utils/storage'

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function Calendar({ completedDates, onToggleDate }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const todayStr = getLocalDateStr(today)

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const cells = []
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} />)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const isCompleted = completedDates.has(dateStr)
    const isToday = dateStr === todayStr
    const isFuture = dateStr > todayStr

    cells.push(
      <button
        key={d}
        onClick={() => !isFuture && onToggleDate(dateStr)}
        disabled={isFuture}
        className={`aspect-square flex items-center justify-center rounded-xl text-sm font-medium relative transition-colors active:scale-95
          ${isCompleted ? 'bg-[#1a1c1b] text-white' : ''}
          ${isToday && !isCompleted ? 'ring-2 ring-[#1a1c1b] ring-inset' : ''}
          ${!isCompleted && !isToday && !isFuture ? 'text-[#474747] active:bg-[#dadad8]' : ''}
          ${isFuture ? 'text-[#c6c6c6]' : ''}
        `}
      >
        {d}
        {isCompleted && (
          <svg className="absolute bottom-0.5 w-3 h-3 text-white opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 text-[#474747] active:opacity-60">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <p className="text-base font-semibold">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </p>
        <button onClick={nextMonth} className="p-2 text-[#474747] active:opacity-60">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map((label) => (
          <div key={label} className="text-center text-xs font-medium text-[#474747] uppercase tracking-wider py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells}
      </div>

      <p className="text-xs text-[#474747] text-center mt-4">Tap a day to log or remove a workout</p>
    </div>
  )
}

export default function StatsScreen({ onBack }) {
  const [, forceUpdate] = useState(0)

  const refresh = useCallback(() => forceUpdate((n) => n + 1), [])

  const currentStreak = getStreak()
  const longestStreak = getLongestStreak()
  const completedDates = getCompletedDates()
  const totalWorkouts = getWorkoutHistory().length

  function handleToggleDate(dateStr) {
    toggleWorkoutDate(dateStr)
    refresh()
  }

  return (
    <div className="min-h-svh bg-[#f9f9f7] text-[#1a1c1b] flex flex-col">
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <button onClick={onBack} className="text-sm font-medium text-[#474747] active:opacity-60">
          &larr; Back
        </button>
      </div>

      <div className="px-6 pb-6 flex-1">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Stats</h1>

        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-[#1a1c1b] text-white rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold">{currentStreak}</p>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#9ca3af] mt-1">Current Streak</p>
          </div>
          <div className="flex-1 bg-[#eeeeec] rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold">{longestStreak}</p>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#474747] mt-1">Longest Streak</p>
          </div>
        </div>

        <div className="bg-[#eeeeec] rounded-2xl p-5 text-center mb-6">
          <p className="text-3xl font-bold">{totalWorkouts}</p>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#474747] mt-1">Total Workouts</p>
        </div>

        <div className="bg-[#eeeeec] rounded-2xl p-5">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#474747] mb-4">
            Workout Calendar
          </p>
          <Calendar completedDates={completedDates} onToggleDate={handleToggleDate} />
        </div>
      </div>
    </div>
  )
}
