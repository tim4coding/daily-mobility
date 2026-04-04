import { useState } from 'react'
import HomeScreen from './components/HomeScreen'
import ExerciseScreen from './components/ExerciseScreen'
import CompletionScreen from './components/CompletionScreen'
import EditRoutineScreen from './components/EditRoutineScreen'
import StatsScreen from './components/StatsScreen'
import { completeRoutine, getInProgress, saveInProgress } from './utils/storage'
import { unlockAudio } from './utils/audio'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [currentDay, setCurrentDay] = useState(null)
  const [streak, setStreak] = useState(0)
  const [initialStep, setInitialStep] = useState(0)

  function handleStart(day) {
    unlockAudio()
    const saved = getInProgress()
    if (saved && saved.day === day) {
      setInitialStep(saved.stepIndex)
    } else {
      setInitialStep(0)
      saveInProgress({ day, stepIndex: 0 })
    }
    setCurrentDay(day)
    setScreen('exercise')
  }

  function handleComplete() {
    const newStreak = completeRoutine(currentDay)
    setStreak(newStreak)
    setScreen('complete')
  }

  function handleQuit() {
    setScreen('home')
    setCurrentDay(null)
  }

  function handleFinish() {
    setScreen('home')
    setCurrentDay(null)
  }

  if (screen === 'exercise') {
    return (
      <ExerciseScreen
        day={currentDay}
        initialStep={initialStep}
        onComplete={handleComplete}
        onQuit={handleQuit}
      />
    )
  }

  if (screen === 'complete') {
    return <CompletionScreen streak={streak} onFinish={handleFinish} />
  }

  if (screen === 'stats') {
    return <StatsScreen onBack={() => setScreen('home')} />
  }

  if (screen === 'edit') {
    return <EditRoutineScreen onBack={() => setScreen('home')} />
  }

  return (
    <HomeScreen
      onStart={handleStart}
      onEdit={() => setScreen('edit')}
      onStats={() => setScreen('stats')}
    />
  )
}
