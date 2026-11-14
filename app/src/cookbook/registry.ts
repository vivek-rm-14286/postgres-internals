import type { Dataset, Exercise } from './types'
import { LEVELS } from './types'

// Every file in cookbook/data/ exports `dataset` and `exercises`; they are registered automatically.
const files = import.meta.glob<{ dataset: Dataset; exercises: Exercise[] }>('./data/*.ts', { eager: true })

export const DATASETS: Dataset[] = Object.values(files).map((f) => f.dataset).filter(Boolean)
export const EXERCISES: Exercise[] = Object.values(files).flatMap((f) => f.exercises ?? [])
  .sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || a.dataset.localeCompare(b.dataset))

export const datasetById = (id: string) => DATASETS.find((d) => d.id === id)
export const exerciseById = (id: string) => EXERCISES.find((e) => e.id === id)
