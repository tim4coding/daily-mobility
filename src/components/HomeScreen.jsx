import { useState } from 'react'
import { getNextDay, getStreak, getInProgress } from '../utils/storage'
import { getRoutines } from '../data/routines'

export default function HomeScreen({ onStart, onEdit, onStats }) {
  const suggestedDay = getNextDay()
  const [selectedDay, setSelectedDay] = useState(suggestedDay)
  const streak = getStreak()
  const inProgress = getInProgress()
  const routines = getRoutines()
  const exercises = routines[selectedDay]

  const totalSeconds = exercises.reduce((sum, ex) => {
    const base = ex.duration || 0
    return sum + (ex.perSide ? base * 2 : base)
  }, 0)
  const totalMinutes = Math.round(totalSeconds / 60)

  return (
    <div className="min-h-svh bg-[#f9f9f7] text-[#1a1c1b] flex flex-col">
      <div className="flex-1 flex flex-col px-6 pt-8 pb-8">
        {/* Top bar with stats button */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#474747]">
            Session Tracking
          </p>
          <button
            onClick={onStats}
            className="w-10 h-10 rounded-full bg-[#eeeeec] flex items-center justify-center active:scale-95 transition-transform"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1c1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </button>
        </div>

        <h1 className="text-5xl font-bold leading-tight tracking-tight mb-4">
          Today
        </h1>

        {/* Day A/B switcher */}
        <div className="flex gap-2 mb-4">
          {['A', 'B'].map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
                selectedDay === day ? 'bg-[#1a1c1b] text-white' : 'bg-[#eeeeec] text-[#474747]'
              }`}
            >
              Day {day}
            </button>
          ))}
        </div>

        {streak > 0 && (
          <div className="inline-flex items-center gap-2 bg-[#eeeeec] rounded-full px-4 py-1.5 w-fit mb-6">
            <span className="text-sm font-semibold tracking-wide uppercase">
              {streak} Day Streak
            </span>
          </div>
        )}

        <div className="bg-[#eeeeec] rounded-2xl p-6 mb-8">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#474747] mb-2">
            Current Protocol
          </p>
          <h2 className="text-2xl font-bold leading-snug mb-3">
            {selectedDay === 'A' ? 'Hip & Core Flow' : 'Ankle & Adductor Flow'}
          </h2>
          <p className="text-[#474747] text-sm leading-relaxed mb-6">
            {selectedDay === 'A'
              ? 'Ankle mobility, hip flexor activation, and core stability work with a deep squat hold.'
              : 'Ankle rocks, lateral hip mobility, adductor work, and glute activation.'}
          </p>
          <div className="flex gap-8 border-t border-[#dadad8] pt-4">
            <div>
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#474747] mb-1">Duration</p>
              <p className="text-2xl font-bold">{totalMinutes} <span className="text-sm font-normal text-[#474747]">min</span></p>
            </div>
            <div>
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#474747] mb-1">Exercises</p>
              <p className="text-2xl font-bold">{exercises.length}</p>
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <button
            onClick={() => onStart(selectedDay)}
            className="w-full py-4 rounded-xl bg-[#1a1c1b] text-[#e5e2e1] text-base font-semibold active:scale-[0.98] transition-transform"
          >
            {inProgress ? 'Resume Routine' : 'Start Routine'} &rarr;
          </button>
          <button
            onClick={onEdit}
            className="w-full py-4 rounded-xl bg-[#eeeeec] text-[#1a1c1b] text-base font-semibold active:scale-[0.98] transition-transform"
          >
            Edit Routines
          </button>
        </div>
      </div>
    </div>
  )
}
