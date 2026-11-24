import { getCustomRoutines } from '../utils/storage'

export const defaultRoutines = {
  A: [
    { name: 'Knee-to-Wall Ankle Rocks', duration: 60, perSide: true },
    { name: 'Elevated Hip Flexor Lifts', duration: 60, perSide: true },
    { name: '90/90 Hip Switches', duration: 90, perSide: false },
    { name: 'Dead Bugs', duration: 60, perSide: false },
    { name: 'Supported Deep Squat', duration: 90, perSide: false },
  ],
  B: [
    { name: 'Knee-to-Wall Ankle Rocks', duration: 60, perSide: true },
    { name: 'Assisted Cossack Squats', reps: 5, perSide: true },
    { name: 'Adductor Rockbacks', duration: 60, perSide: true },
    { name: 'Glute Bridges', reps: 10, perSide: false },
    { name: '90/90 Forward Lean', duration: 60, perSide: true },
  ],
  C: [],
}

export function getRoutines() {
  const custom = getCustomRoutines()
  if (!custom) return defaultRoutines
  // Merge with defaults so any new days (e.g. C) are available even if
  // the user has older saved routines that pre-date them
  return { ...defaultRoutines, ...custom }
}
