// Messages between the demos (main thread) and the training worker.

import type { SaeReport } from "./sae"
import type { FeatureSummary } from "./superposition"

export type TrainRequest =
  | { kind: "superposition"; sparsity: number; steps: number }
  | { kind: "sae"; l1: number; steps: number }

export type SuperpositionProgress = {
  kind: "superposition"
  step: number
  steps: number
  loss: number
  features: FeatureSummary[]
  done: boolean
}

export type SaeProgress = {
  kind: "sae"
  step: number
  steps: number
  loss: number
  reconstruction: number
  l0: number
  report: SaeReport
  done: boolean
}

export type TrainResponse =
  | SuperpositionProgress
  | SaeProgress
  | { kind: "error"; message: string }
