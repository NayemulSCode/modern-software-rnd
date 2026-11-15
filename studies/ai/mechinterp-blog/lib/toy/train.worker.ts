/// <reference lib="webworker" />
// Trains the toy models off the main thread, so scrolling and typing stay
// smooth while a demo learns. One worker runs one job; the demo terminates
// it to stop early.

import type { TrainRequest, TrainResponse } from "./protocol"
import { createSae, DEFAULT_SAE, evaluateSae, trainSae } from "./sae"
import {
  createSuperpositionModel,
  DEFAULT_SUPERPOSITION,
  summarise,
  trainSuperposition,
} from "./superposition"

declare const self: DedicatedWorkerGlobalScope

/** About 20 updates a second is enough to look live. */
const REPORT_EVERY_MS = 50

function post(message: TrainResponse) {
  self.postMessage(message)
}

function runSuperposition(sparsity: number, steps: number) {
  const model = createSuperpositionModel({ ...DEFAULT_SUPERPOSITION, sparsity })
  let lastReport = 0
  for (const { step, loss } of trainSuperposition(model, steps, 25)) {
    const now = performance.now()
    const done = step === steps
    if (done || now - lastReport >= REPORT_EVERY_MS) {
      lastReport = now
      post({ kind: "superposition", step, steps, loss, features: summarise(model), done })
    }
  }
}

function runSae(l1: number, steps: number) {
  const sae = createSae({ ...DEFAULT_SAE, l1 })
  let lastReport = 0
  for (const progress of trainSae(sae, steps, 25)) {
    const now = performance.now()
    const done = progress.step === steps
    if (done || now - lastReport >= REPORT_EVERY_MS) {
      lastReport = now
      post({ kind: "sae", steps, ...progress, report: evaluateSae(sae, done ? 2000 : 400), done })
    }
  }
}

self.onmessage = (event: MessageEvent<TrainRequest>) => {
  try {
    const request = event.data
    if (request.kind === "superposition") runSuperposition(request.sparsity, request.steps)
    else runSae(request.l1, request.steps)
  } catch (error) {
    post({ kind: "error", message: error instanceof Error ? error.message : String(error) })
  }
}
