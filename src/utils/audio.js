import { getElevenLabsConfig } from './storage'

let audioUnlocked = false
let elevenLabsFailed = false
const audioCache = new Map()

// Must be called from a direct user tap (e.g. "Start Routine" button)
export function unlockAudio() {
  if (audioUnlocked) return

  try {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('')
      utterance.volume = 0
      window.speechSynthesis.speak(utterance)
    }
    audioUnlocked = true
    // Reset ElevenLabs failure flag on new session start
    elevenLabsFailed = false
  } catch {
    // Fail silently
  }
}

async function speakElevenLabs(text, apiKey, voiceId) {
  // Check cache first
  if (audioCache.has(text)) {
    const audio = new Audio(audioCache.get(text))
    audio.play()
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
      // 401 = bad key, 429 = rate limit — fall back for rest of session
      elevenLabsFailed = true
      return false
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    audioCache.set(text, url)

    const audio = new Audio(url)
    audio.play()
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
    const audio = new Audio(url)
    audio.play()
    return true
  } catch {
    return false
  }
}

export function getAvailableVoices() {
  if (!('speechSynthesis' in window)) return []
  return window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'))
}
