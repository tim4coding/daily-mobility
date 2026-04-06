const KEYS = {
  LAST_COMPLETED_DAY: 'mobility_lastCompletedDay',
  STREAK: 'mobility_currentStreak',
  LAST_COMPLETED_DATE: 'mobility_lastCompletedDate',
  IN_PROGRESS: 'mobility_inProgressState',
  CUSTOM_ROUTINES: 'mobility_customRoutines',
  TIMER_SETTINGS: 'mobility_timerSettings',
  WORKOUT_HISTORY: 'mobility_workoutHistory',
  LONGEST_STREAK: 'mobility_longestStreak',
  VOICE_NAME: 'mobility_voiceName',
  ELEVENLABS_API_KEY: 'mobility_elevenLabsApiKey',
  ELEVENLABS_VOICE_ID: 'mobility_elevenLabsVoiceId',
}

const DEFAULT_TIMER_SETTINGS = { prepTime: 10, restTime: 5 }

// Local timezone date string (YYYY-MM-DD)
export function getLocalDateStr(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getLocalYesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return getLocalDateStr(d)
}

export function getLastCompletedDay() {
  return localStorage.getItem(KEYS.LAST_COMPLETED_DAY)
}

export function getNextDay() {
  const last = getLastCompletedDay()
  return last === 'A' ? 'B' : 'A'
}

export function getStreak() {
  return parseInt(localStorage.getItem(KEYS.STREAK) || '0', 10)
}

export function getLastCompletedDate() {
  return localStorage.getItem(KEYS.LAST_COMPLETED_DATE)
}

export function completeRoutine(day) {
  const today = getLocalDateStr()
  const lastDate = getLastCompletedDate()
  const currentStreak = getStreak()
  const yesterdayStr = getLocalYesterday()

  let newStreak
  if (!lastDate) {
    newStreak = 1
  } else if (lastDate === today) {
    newStreak = currentStreak
  } else if (lastDate === yesterdayStr) {
    newStreak = currentStreak + 1
  } else {
    newStreak = 1
  }

  localStorage.setItem(KEYS.LAST_COMPLETED_DAY, day)
  localStorage.setItem(KEYS.STREAK, String(newStreak))
  localStorage.setItem(KEYS.LAST_COMPLETED_DATE, today)

  addToHistory(today, day)
  const longest = getLongestStreak()
  if (newStreak > longest) {
    localStorage.setItem(KEYS.LONGEST_STREAK, String(newStreak))
  }

  clearInProgress()
  return newStreak
}

export function getInProgress() {
  const data = localStorage.getItem(KEYS.IN_PROGRESS)
  return data ? JSON.parse(data) : null
}

export function saveInProgress(state) {
  localStorage.setItem(KEYS.IN_PROGRESS, JSON.stringify(state))
}

export function clearInProgress() {
  localStorage.removeItem(KEYS.IN_PROGRESS)
}

// Custom routines
export function getCustomRoutines() {
  const data = localStorage.getItem(KEYS.CUSTOM_ROUTINES)
  return data ? JSON.parse(data) : null
}

export function saveCustomRoutines(routines) {
  localStorage.setItem(KEYS.CUSTOM_ROUTINES, JSON.stringify(routines))
}

export function resetCustomRoutines() {
  localStorage.removeItem(KEYS.CUSTOM_ROUTINES)
}

// Timer settings
export function getTimerSettings() {
  const data = localStorage.getItem(KEYS.TIMER_SETTINGS)
  return data ? { ...DEFAULT_TIMER_SETTINGS, ...JSON.parse(data) } : DEFAULT_TIMER_SETTINGS
}

export function saveTimerSettings(settings) {
  localStorage.setItem(KEYS.TIMER_SETTINGS, JSON.stringify(settings))
}

export function resetTimerSettings() {
  localStorage.removeItem(KEYS.TIMER_SETTINGS)
}

// Workout history — stored as array of { date, day } objects
export function getWorkoutHistory() {
  const data = localStorage.getItem(KEYS.WORKOUT_HISTORY)
  return data ? JSON.parse(data) : []
}

function addToHistory(date, day) {
  const history = getWorkoutHistory()
  if (!history.some((h) => h.date === date)) {
    history.push({ date, day })
    localStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(history))
  }
}

export function getCompletedDates() {
  return new Set(getWorkoutHistory().map((h) => h.date))
}

export function getLongestStreak() {
  return parseInt(localStorage.getItem(KEYS.LONGEST_STREAK) || '0', 10)
}

// Manual log/unlog for calendar editing
export function toggleWorkoutDate(dateStr) {
  const history = getWorkoutHistory()
  const existing = history.findIndex((h) => h.date === dateStr)

  if (existing !== -1) {
    history.splice(existing, 1)
  } else {
    history.push({ date: dateStr, day: 'Manual' })
  }

  localStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(history))
  recalculateStreak()
  return existing === -1 // true if added, false if removed
}

export function recalculateStreak() {
  const dates = [...getCompletedDates()].sort().reverse()
  if (dates.length === 0) {
    localStorage.setItem(KEYS.STREAK, '0')
    localStorage.setItem(KEYS.LONGEST_STREAK, '0')
    localStorage.removeItem(KEYS.LAST_COMPLETED_DATE)
    return
  }

  const today = getLocalDateStr()
  const yesterday = getLocalYesterday()

  // Calculate current streak (must include today or yesterday)
  let currentStreak = 0
  let checkDate = dates.includes(today) ? today : dates.includes(yesterday) ? yesterday : null

  if (checkDate) {
    const dateSet = new Set(dates)
    const d = new Date(checkDate + 'T12:00:00') // noon to avoid DST issues
    while (dateSet.has(getLocalDateStr(d))) {
      currentStreak++
      d.setDate(d.getDate() - 1)
    }
  }

  // Calculate longest streak from full history
  let longest = 0
  let run = 1
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + 'T12:00:00')
    const curr = new Date(dates[i] + 'T12:00:00')
    prev.setDate(prev.getDate() - 1)
    if (getLocalDateStr(prev) === dates[i]) {
      run++
    } else {
      run = 1
    }
    if (run > longest) longest = run
  }
  if (dates.length === 1) longest = 1
  if (currentStreak > longest) longest = currentStreak

  localStorage.setItem(KEYS.STREAK, String(currentStreak))
  localStorage.setItem(KEYS.LONGEST_STREAK, String(longest))
  if (dates.length > 0) {
    localStorage.setItem(KEYS.LAST_COMPLETED_DATE, dates[0])
  }
}

// Voice preference
export function getVoiceName() {
  return localStorage.getItem(KEYS.VOICE_NAME) || ''
}

export function saveVoiceName(name) {
  localStorage.setItem(KEYS.VOICE_NAME, name)
}

// ElevenLabs config
export function getElevenLabsConfig() {
  return {
    apiKey: localStorage.getItem(KEYS.ELEVENLABS_API_KEY) || '',
    voiceId: localStorage.getItem(KEYS.ELEVENLABS_VOICE_ID) || '',
  }
}

export function saveElevenLabsConfig(apiKey, voiceId) {
  localStorage.setItem(KEYS.ELEVENLABS_API_KEY, apiKey)
  localStorage.setItem(KEYS.ELEVENLABS_VOICE_ID, voiceId)
}
