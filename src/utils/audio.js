import { getElevenLabsConfig } from './storage'

let audioUnlocked = false
let elevenLabsFailed = false
const audioCache = new Map()

// Single reusable Audio element — iOS requires this to be "unlocked" by a user tap
let sharedAudio = null

function getSharedAudio() {
  if (!sharedAudio) {
    sharedAudio = new Audio()
  }
  return sharedAudio
}

// Must be called from a direct user tap (e.g. "Start Routine" button)
export function unlockAudio() {
  if (audioUnlocked) return

  try {
    // Unlock the shared Audio element with a silent play
    const audio = getSharedAudio()
    audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
    audio.volume = 0
    audio.play().then(() => {
      audio.pause()
      audio.volume = 1
    }).catch(() => {})

    // Unlock Speech Synthesis
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('')
      utterance.volume = 0
      window.speechSynthesis.speak(utterance)
    }

    audioUnlocked = true
    elevenLabsFailed = false
  } catch {
    // Fail silently
  }
}

async function speakElevenLabs(text, apiKey, voiceId) {
  // Check cache first
  if (audioCache.has(text)) {
    const audio = getSharedAudio()
    audio.src = audioCache.get(text)
    try {
      await audio.play()
    } catch {
      return false
    }
    return true
  }

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    })

    if (!res.ok) {
      elevenLabsFailed = true
      return false
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    audioCache.set(text, url)

    const audio = getSharedAudio()
    audio.src = url
    try {
      await audio.play()
    } catch {
      return false
    }
    return true
  } catch {
    elevenLabsFailed = true
    return false
  }
}

function speakBrowser(text, voiceName, rate = 1) {
  try {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = rate
    utterance.pitch = 1
    utterance.volume = 1

    if (voiceName) {
      const voices = window.speechSynthesis.getVoices()
      const match = voices.find((v) => v.name === voiceName)
      if (match) utterance.voice = match
    }

    window.speechSynthesis.speak(utterance)
  } catch {
    // Speech not available — fail silently
  }
}

async function speak(text, voiceName, rate = 1) {
  const { apiKey, voiceId } = getElevenLabsConfig()

  if (apiKey && voiceId && !elevenLabsFailed) {
    const success = await speakElevenLabs(text, apiKey, voiceId)
    if (success) return
  }

  // Fallback to browser voice
  speakBrowser(text, voiceName, rate)
}

export function playCountdownBeep(secondsLeft, voiceName) {
  if (secondsLeft <= 3 && secondsLeft >= 1) {
    speak(String(secondsLeft), voiceName, 1.1)
  }
}

export function speakBegin(voiceName) {
  speak('Begin', voiceName, 0.9)
}

export function speakExerciseName(name, voiceName) {
  speak(`Next up: ${name}`, voiceName, 0.95)
}

// For testing ElevenLabs from settings
export async function testElevenLabs(apiKey, voiceId) {
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Next up: Knee-to-Wall Ankle Rocks',
        model_id: 'eleven_monolingual_v1',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    })

    if (!res.ok) return false

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const audio = getSharedAudio()
    audio.src = url
    audio.play()
    return true
  } catch {
    return false
  }
}

// Pre-fetch all voice clips for a workout so playback is instant
export async function precacheWorkoutAudio(steps) {
  const { apiKey, voiceId } = getElevenLabsConfig()
  if (!apiKey || !voiceId || elevenLabsFailed) return

  // Collect all unique phrases that will be spoken during the workout
  const phrases = new Set(['Begin', '1', '2', '3'])

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    const nextStep = steps[i + 1]
    if (nextStep) {
      const label = nextStep.side
        ? `${nextStep.name}, ${nextStep.side} side`
        : nextStep.name
      phrases.add(`Next up: ${label}`)
    }
  }
  // Last exercise message
  phrases.add('Last exercise, almost done')

  // Fetch all uncached phrases in parallel
  const uncached = [...phrases].filter((p) => !audioCache.has(p))
  if (uncached.length === 0) return

  await Promise.allSettled(
    uncached.map(async (text) => {
      try {
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        })
        if (res.ok) {
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          audioCache.set(text, url)
        } else {
          elevenLabsFailed = true
        }
      } catch {
        elevenLabsFailed = true
      }
    })
  )
}

export function getAvailableVoices() {
  if (!('speechSynthesis' in window)) return []
  return window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'))
}
