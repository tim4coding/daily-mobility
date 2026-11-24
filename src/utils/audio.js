let audioUnlocked = false

// Tell iOS our audio is short cues, so background music (Spotify, Apple Music)
// ducks under the voice instead of being paused. Safari 16.4+ only.
// If iOS still pauses music, try 'ambient' (mixes without ducking).
function configureAudioSession() {
  try {
    if (navigator.audioSession && navigator.audioSession.type !== 'transient') {
      navigator.audioSession.type = 'transient'
    }
  } catch {
    // Not supported — ignore
  }
}

configureAudioSession()

// Must be called from a direct user tap (e.g. "Start Routine" button)
// This unlocks Speech Synthesis on iOS
export function unlockAudio() {
  configureAudioSession()
  if (audioUnlocked) return

  try {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('')
      utterance.volume = 0
      window.speechSynthesis.speak(utterance)
    }
    audioUnlocked = true
  } catch {
    // Fail silently
  }
}

function speak(text, voiceName, rate = 1) {
  try {
    if (!('speechSynthesis' in window)) return
    configureAudioSession()
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

export function getAvailableVoices() {
  if (!('speechSynthesis' in window)) return []
  return window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'))
}
