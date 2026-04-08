import { useState, useCallback, useMemo, useEffect } from 'react'
import { getRoutines } from '../data/routines'
import { saveInProgress, getTimerSettings, getVoiceName } from '../utils/storage'
import useTimer from '../hooks/useTimer'
import { playCountdownBeep, speakExerciseName, speakBegin, precacheWorkoutAudio } from '../utils/audio'
import useWakeLock from '../hooks/useWakeLock'

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

function flattenExercises(day) {
  const routines = getRoutines()
  const steps = []
  for (const ex of routines[day]) {
    if (ex.perSide) {
      steps.push({ ...ex, side: 'Left' })
      steps.push({ ...ex, side: 'Right' })
    } else {
      steps.push({ ...ex, side: null })
    }
  }
  return steps
}

// phase: 'prep' | 'rest' | 'exercise'
export default function ExerciseScreen({ day, onComplete, onQuit, initialStep }) {
  const steps = useMemo(() => flattenExercises(day), [day])
  const timerSettings = useMemo(() => getTimerSettings(), [])
  const voiceName = useMemo(() => getVoiceName(), [])
  const [stepIndex, setStepIndex] = useState(initialStep || 0)
  const [phase, setPhase] = useState('prep')

  // Keep screen awake during workout
  useWakeLock(true)

  // Pre-fetch all ElevenLabs audio during prep countdown
  useEffect(() => {
    precacheWorkoutAudio(steps)
  }, [steps])

  const current = steps[stepIndex]
  const isTimedExercise = !!current.duration

  const countdownDuration =
    phase === 'prep' ? timerSettings.prepTime :
    phase === 'rest' ? timerSettings.restTime :
    (isTimedExercise ? current.duration : 0)

  const handleTimerDone = useCallback(() => {
    if (phase === 'prep' || phase === 'rest') {
      setPhase('exercise')
      return
    }
    // phase === 'exercise' and timed exercise finished
    const next = stepIndex + 1
    if (next >= steps.length) {
      onComplete()
    } else {
      setStepIndex(next)
      saveInProgress({ day, stepIndex: next })
      setPhase('rest')
    }
  }, [phase, stepIndex, steps.length, day, onComplete])

  const { secondsLeft, isRunning, toggle } = useTimer(
    countdownDuration,
    (phase === 'prep' || phase === 'rest' || isTimedExercise) ? handleTimerDone : undefined
  )

  // Say "Begin" when exercise phase starts
  useEffect(() => {
    if (phase === 'exercise') {
      speakBegin(voiceName)
    }
  }, [phase, voiceName])

  // Determine next step for voice announcement
  const nextStep = stepIndex + 1 < steps.length ? steps[stepIndex + 1] : null

  // Countdown beeps in last 5 seconds + voice announcement at 10s
  useEffect(() => {
    if (phase === 'exercise' && isTimedExercise && isRunning) {
      playCountdownBeep(secondsLeft, voiceName)

      if (secondsLeft === 10 && nextStep) {
        const label = nextStep.side
          ? `${nextStep.name}, ${nextStep.side} side`
          : nextStep.name
        speakExerciseName(label, voiceName)
      } else if (secondsLeft === 10 && !nextStep) {
        speakExerciseName('Last exercise, almost done', voiceName)
      }
    }
  }, [secondsLeft, phase, isTimedExercise, isRunning, nextStep])

  function goNext() {
    if (phase === 'prep' || phase === 'rest') {
      setPhase('exercise')
      return
    }
    const next = stepIndex + 1
    if (next >= steps.length) {
      onComplete()
    } else {
      setStepIndex(next)
      saveInProgress({ day, stepIndex: next })
      setPhase('rest')
    }
  }

  function goBack() {
    if (phase === 'rest') {
      setPhase('exercise')
      // go back to prev step's exercise phase
      if (stepIndex > 0) {
        const prev = stepIndex - 1
        setStepIndex(prev)
        saveInProgress({ day, stepIndex: prev })
      }
      return
    }
    if (stepIndex > 0) {
      const prev = stepIndex - 1
      setStepIndex(prev)
      saveInProgress({ day, stepIndex: prev })
      setPhase('exercise')
    }
  }

  // Calculate which original exercise we're on
  const exerciseNames = getRoutines()[day].map((e) => e.name)
  const currentOriginalIndex = exerciseNames.indexOf(current.name)
  const totalExercises = exerciseNames.length

  // Progress percentage
  const progress = ((stepIndex + (phase === 'exercise' ? 0.5 : 0)) / steps.length) * 100

  // Prep / Rest interstitial screen
  if (phase === 'prep' || phase === 'rest') {
    const nextExercise = current
    return (
      <div className="min-h-svh bg-[#1a1c1b] text-white flex flex-col">
        {/* Progress bar */}
        <div className="h-1.5 bg-[#2e2e2e]">
          <div
            className="h-full bg-white transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between px-6 py-4">
          <p className="text-sm font-medium text-[#9ca3af]">Day {day}</p>
          <button
            onClick={onQuit}
            className="text-sm font-medium text-[#9ca3af] active:opacity-60"
          >
            End Session
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#9ca3af] mb-6">
            {phase === 'prep' ? 'Get Ready' : 'Next Up'}
          </p>

          <h1 className="text-4xl font-bold leading-tight tracking-tight mb-3 max-w-xs">
            {nextExercise.name}
          </h1>

          {nextExercise.side && (
            <p className="text-lg italic text-[#9ca3af] mb-2">
              {nextExercise.side} side
            </p>
          )}

          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#9ca3af] mt-1 mb-12">
            {nextExercise.duration ? `${nextExercise.duration}s` : `${nextExercise.reps} reps`}
            {nextExercise.perSide ? ' \u2022 per side' : ''}
          </p>

          <p className="text-8xl font-bold tabular-nums">{secondsLeft}</p>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#9ca3af] mt-3">
            {phase === 'prep' ? 'Starting In' : 'Rest'}
          </p>
        </div>

        <div className="px-6 pb-10 pt-4">
          <button
            onClick={goNext}
            className="w-full py-4 rounded-xl bg-white text-[#1a1c1b] text-base font-semibold active:scale-[0.98] transition-transform"
          >
            Skip &rarr;
          </button>
        </div>
      </div>
    )
  }

  // Exercise screen
  return (
    <div className="min-h-svh bg-[#f9f9f7] text-[#1a1c1b] flex flex-col">
      {/* Progress bar */}
      <div className="h-1.5 bg-[#eeeeec]">
        <div
          className="h-full bg-[#1a1c1b] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <p className="text-sm font-medium text-[#474747]">
          Day {day}
        </p>
        <button
          onClick={onQuit}
          className="text-sm font-medium text-[#474747] active:opacity-60"
        >
          End Session
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#474747] mb-4">
          Current Mobility Drill
        </p>

        <h1 className="text-4xl font-bold leading-tight tracking-tight mb-3 max-w-xs">
          {current.name}
        </h1>

        {current.side && (
          <p className="text-lg italic text-[#474747] mb-2">
            {current.side} side focus
          </p>
        )}

        <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#474747] mt-1 mb-10">
          {currentOriginalIndex + 1} of {totalExercises}
        </p>

        {isTimedExercise ? (
          <div className="mb-2">
            <p className="text-7xl font-bold tracking-tight tabular-nums">
              {formatTime(secondsLeft)}
            </p>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#474747] mt-3">
              Seconds Remaining
            </p>
          </div>
        ) : (
          <div className="mb-2">
            <p className="text-7xl font-bold tracking-tight">
              {current.reps}
            </p>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#474747] mt-3">
              {current.side ? `Reps \u2022 ${current.side} Side` : 'Reps'}
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-6 pb-10 pt-4">
        <div className="bg-[#eeeeec] rounded-2xl flex items-center justify-between px-2 py-3">
          <button
            onClick={goBack}
            disabled={stepIndex === 0}
            className="flex flex-col items-center justify-center w-20 py-2 rounded-xl text-[#474747] disabled:opacity-30 active:bg-[#dadad8] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span className="text-xs font-medium mt-1 uppercase tracking-wider">Back</span>
          </button>

          {isTimedExercise ? (
            <button
              onClick={toggle}
              className="w-16 h-16 rounded-2xl bg-[#1a1c1b] text-white flex items-center justify-center active:scale-95 transition-transform"
            >
              {isRunning ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6,4 20,12 6,20" />
                </svg>
              )}
            </button>
          ) : (
            <button
              onClick={goNext}
              className="px-8 py-4 rounded-2xl bg-[#1a1c1b] text-white text-sm font-semibold uppercase tracking-wider active:scale-95 transition-transform"
            >
              Done
            </button>
          )}

          <button
            onClick={goNext}
            className="flex flex-col items-center justify-center w-20 py-2 rounded-xl text-[#474747] active:bg-[#dadad8] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
            <span className="text-xs font-medium mt-1 uppercase tracking-wider">Next</span>
          </button>
        </div>
      </div>
    </div>
  )
}
