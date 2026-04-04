import { useState, useEffect } from 'react'
import { getRoutines, defaultRoutines } from '../data/routines'
import { saveCustomRoutines, resetCustomRoutines, getTimerSettings, saveTimerSettings, resetTimerSettings, getVoiceName, saveVoiceName } from '../utils/storage'
import { getAvailableVoices, speakExerciseName } from '../utils/audio'

function emptyExercise() {
  return { name: '', duration: 60, reps: null, perSide: false, _type: 'duration' }
}

function ExerciseForm({ exercise, onSave, onCancel }) {
  const [name, setName] = useState(exercise.name)
  const [type, setType] = useState(exercise.reps != null ? 'reps' : 'duration')
  const [duration, setDuration] = useState(exercise.duration || 60)
  const [reps, setReps] = useState(exercise.reps || 5)
  const [perSide, setPerSide] = useState(exercise.perSide)

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    const ex = { name: name.trim(), perSide }
    if (type === 'duration') {
      ex.duration = Number(duration)
    } else {
      ex.reps = Number(reps)
    }
    onSave(ex)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-[0_20px_40px_rgba(26,28,27,0.06)]">
      <div className="mb-4">
        <label className="text-xs font-medium tracking-[0.2em] uppercase text-[#474747] mb-1 block">
          Exercise Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Dead Bugs"
          className="w-full bg-[#f4f4f2] rounded-xl px-4 py-3 text-[#1a1c1b] text-base outline-none border-b-2 border-transparent focus:border-[#1a1c1b] transition-colors"
        />
      </div>

      <div className="mb-4">
        <label className="text-xs font-medium tracking-[0.2em] uppercase text-[#474747] mb-2 block">
          Type
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType('duration')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              type === 'duration' ? 'bg-[#1a1c1b] text-white' : 'bg-[#eeeeec] text-[#474747]'
            }`}
          >
            Timed
          </button>
          <button
            type="button"
            onClick={() => setType('reps')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              type === 'reps' ? 'bg-[#1a1c1b] text-white' : 'bg-[#eeeeec] text-[#474747]'
            }`}
          >
            Reps
          </button>
        </div>
      </div>

      <div className="mb-4">
        {type === 'duration' ? (
          <div>
            <label className="text-xs font-medium tracking-[0.2em] uppercase text-[#474747] mb-1 block">
              Duration (seconds)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="5"
              max="300"
              className="w-full bg-[#f4f4f2] rounded-xl px-4 py-3 text-[#1a1c1b] text-base outline-none border-b-2 border-transparent focus:border-[#1a1c1b] transition-colors"
            />
          </div>
        ) : (
          <div>
            <label className="text-xs font-medium tracking-[0.2em] uppercase text-[#474747] mb-1 block">
              Reps
            </label>
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              min="1"
              max="100"
              className="w-full bg-[#f4f4f2] rounded-xl px-4 py-3 text-[#1a1c1b] text-base outline-none border-b-2 border-transparent focus:border-[#1a1c1b] transition-colors"
            />
          </div>
        )}
      </div>

      <div className="mb-5">
        <button
          type="button"
          onClick={() => setPerSide(!perSide)}
          className="flex items-center gap-3"
        >
          <div className={`w-11 h-6 rounded-full transition-colors relative ${perSide ? 'bg-[#1a1c1b]' : 'bg-[#dadad8]'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${perSide ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm text-[#1a1c1b] font-medium">Per side</span>
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-[#eeeeec] text-[#474747] text-sm font-semibold active:scale-[0.98] transition-transform"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 py-3 rounded-xl bg-[#1a1c1b] text-white text-sm font-semibold active:scale-[0.98] transition-transform"
        >
          Save
        </button>
      </div>
    </form>
  )
}

export default function EditRoutineScreen({ onBack }) {
  const [routines, setRoutines] = useState(() => getRoutines())
  const [activeDay, setActiveDay] = useState('A')
  const [editingIndex, setEditingIndex] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [timerSettings, setTimerSettings] = useState(() => getTimerSettings())
  const [selectedVoice, setSelectedVoice] = useState(() => getVoiceName())
  const [voices, setVoices] = useState([])

  useEffect(() => {
    function loadVoices() {
      const available = getAvailableVoices()
      if (available.length > 0) setVoices(available)
    }
    loadVoices()
    // Voices load async in some browsers
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices)
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices)
  }, [])

  const exercises = routines[activeDay]

  function handleTimerChange(key, value) {
    const num = Math.max(0, Math.min(30, Number(value)))
    const updated = { ...timerSettings, [key]: num }
    setTimerSettings(updated)
    saveTimerSettings(updated)
  }

  function persist(updated) {
    setRoutines(updated)
    saveCustomRoutines(updated)
  }

  function handleSaveExercise(exercise) {
    const updated = { ...routines }
    const list = [...updated[activeDay]]
    if (editingIndex !== null) {
      list[editingIndex] = exercise
    } else {
      list.push(exercise)
    }
    updated[activeDay] = list
    persist(updated)
    setEditingIndex(null)
    setIsAdding(false)
  }

  function handleDelete(index) {
    const updated = { ...routines }
    const list = [...updated[activeDay]]
    list.splice(index, 1)
    updated[activeDay] = list
    persist(updated)
  }

  function handleMove(index, direction) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= exercises.length) return
    const updated = { ...routines }
    const list = [...updated[activeDay]]
    const temp = list[index]
    list[index] = list[newIndex]
    list[newIndex] = temp
    updated[activeDay] = list
    persist(updated)
  }

  function handleReset() {
    resetCustomRoutines()
    resetTimerSettings()
    setRoutines(defaultRoutines)
    setTimerSettings(getTimerSettings())
    setEditingIndex(null)
    setIsAdding(false)
  }

  return (
    <div className="min-h-svh bg-[#f9f9f7] text-[#1a1c1b] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <button
          onClick={onBack}
          className="text-sm font-medium text-[#474747] active:opacity-60"
        >
          &larr; Back
        </button>
        <button
          onClick={handleReset}
          className="text-sm font-medium text-[#474747] active:opacity-60"
        >
          Reset Defaults
        </button>
      </div>

      <div className="px-6 pb-4">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Edit Routines</h1>

        {/* Day tabs */}
        <div className="flex gap-2 mb-6">
          {['A', 'B'].map((day) => (
            <button
              key={day}
              onClick={() => { setActiveDay(day); setEditingIndex(null); setIsAdding(false) }}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
                activeDay === day ? 'bg-[#1a1c1b] text-white' : 'bg-[#eeeeec] text-[#474747]'
              }`}
            >
              Day {day}
            </button>
          ))}
        </div>
        {/* Timer settings */}
        <div className="bg-[#eeeeec] rounded-2xl p-4 mb-6">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#474747] mb-3">
            Timer Settings
          </p>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-[#474747] mb-1 block">Prep countdown</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={timerSettings.prepTime}
                  onChange={(e) => handleTimerChange('prepTime', e.target.value)}
                  min="0"
                  max="30"
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-[#1a1c1b] text-base font-semibold outline-none text-center"
                />
                <span className="text-sm text-[#474747] shrink-0">sec</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs text-[#474747] mb-1 block">Rest between</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={timerSettings.restTime}
                  onChange={(e) => handleTimerChange('restTime', e.target.value)}
                  min="0"
                  max="30"
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-[#1a1c1b] text-base font-semibold outline-none text-center"
                />
                <span className="text-sm text-[#474747] shrink-0">sec</span>
              </div>
            </div>
          </div>
        </div>

        {/* Voice setting */}
        {voices.length > 0 && (
          <div className="bg-[#eeeeec] rounded-2xl p-4 mb-6">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#474747] mb-3">
              Voice
            </p>
            <select
              value={selectedVoice}
              onChange={(e) => {
                setSelectedVoice(e.target.value)
                saveVoiceName(e.target.value)
                speakExerciseName('Knee-to-Wall Ankle Rocks', e.target.value)
              }}
              className="w-full bg-white rounded-xl px-3 py-3 text-[#1a1c1b] text-sm font-medium outline-none appearance-none"
            >
              <option value="">Default</option>
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#474747] mt-2">Announces next exercise at 10s</p>
          </div>
        )}
      </div>

      {/* Exercise list */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        {exercises.map((ex, i) => (
          <div key={i}>
            {editingIndex === i ? (
              <div className="mb-4">
                <ExerciseForm
                  exercise={ex}
                  onSave={handleSaveExercise}
                  onCancel={() => setEditingIndex(null)}
                />
              </div>
            ) : (
              <div className="bg-[#eeeeec] rounded-2xl p-4 mb-3 flex items-center gap-3">
                {/* Reorder */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleMove(i, -1)}
                    disabled={i === 0}
                    className="text-[#474747] disabled:opacity-20 active:opacity-60"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMove(i, 1)}
                    disabled={i === exercises.length - 1}
                    className="text-[#474747] disabled:opacity-20 active:opacity-60"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{ex.name}</p>
                  <p className="text-xs text-[#474747]">
                    {ex.duration ? `${ex.duration}s` : `${ex.reps} reps`}
                    {ex.perSide && ' \u2022 per side'}
                  </p>
                </div>

                {/* Actions */}
                <button
                  onClick={() => { setEditingIndex(i); setIsAdding(false) }}
                  className="p-2 text-[#474747] active:opacity-60"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(i)}
                  className="p-2 text-[#474747] active:opacity-60"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Add exercise form or button */}
        {isAdding ? (
          <div className="mt-2">
            <ExerciseForm
              exercise={emptyExercise()}
              onSave={handleSaveExercise}
              onCancel={() => setIsAdding(false)}
            />
          </div>
        ) : (
          <button
            onClick={() => { setIsAdding(true); setEditingIndex(null) }}
            className="w-full py-4 rounded-xl border-2 border-dashed border-[#dadad8] text-[#474747] text-sm font-semibold active:bg-[#eeeeec] transition-colors mt-2"
          >
            + Add Exercise
          </button>
        )}
      </div>
    </div>
  )
}
