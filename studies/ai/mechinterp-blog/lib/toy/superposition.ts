// The toy model from "Toy Models of Superposition" (Elhage et al., 2022):
//
//   h  = W x               squeeze n features into m dimensions (m < n)
//   x' = ReLU(Wᵀ h + b)    try to get the n features back
//
// Each feature is zero with probability `sparsity`, otherwise uniform in
// [0, 1]. Features have decreasing importance, so the loss cares more about
// getting the first ones right.

import {
  Adam,
  createRng,
  gaussian,
  get,
  matrix,
  norm,
  column,
  type Matrix,
} from "./linalg"

export type SuperpositionConfig = {
  features: number // n
  dims: number // m
  sparsity: number // probability that a feature is zero, 0..1
  importanceDecay: number // importance of feature i is decay^i
  batchSize: number
  learningRate: number
  seed: number
}

export const DEFAULT_SUPERPOSITION: SuperpositionConfig = {
  features: 5,
  dims: 2,
  sparsity: 0,
  importanceDecay: 0.7,
  batchSize: 256,
  learningRate: 0.01,
  seed: 7,
}

export type SuperpositionModel = {
  config: SuperpositionConfig
  W: Matrix // m × n: column i is where feature i is stored
  b: Float64Array // n
  importance: Float64Array // n
}

export function createSuperpositionModel(
  config: SuperpositionConfig
): SuperpositionModel {
  const rng = createRng(config.seed)
  const W = matrix(config.dims, config.features)
  const scale = Math.sqrt(2 / (config.dims + config.features))
  for (let i = 0; i < W.data.length; i++) W.data[i] = gaussian(rng) * scale
  const importance = Float64Array.from(
    { length: config.features },
    (_, i) => config.importanceDecay ** i
  )
  return { config, W, b: new Float64Array(config.features), importance }
}

export function sampleFeatures(
  features: number,
  sparsity: number,
  rng: () => number
): Float64Array {
  const x = new Float64Array(features)
  for (let i = 0; i < features; i++) x[i] = rng() < sparsity ? 0 : rng()
  return x
}

type Forward = { h: Float64Array; z: Float64Array; out: Float64Array }

export function forward(model: SuperpositionModel, x: Float64Array): Forward {
  const { W, b } = model
  const h = new Float64Array(W.rows)
  for (let k = 0; k < W.rows; k++) {
    for (let j = 0; j < W.cols; j++) h[k] += get(W, k, j) * x[j]
  }
  const z = new Float64Array(W.cols)
  const out = new Float64Array(W.cols)
  for (let i = 0; i < W.cols; i++) {
    let sum = b[i]
    for (let k = 0; k < W.rows; k++) sum += get(W, k, i) * h[k]
    z[i] = sum
    out[i] = Math.max(0, sum)
  }
  return { h, z, out }
}

export type Gradients = { W: Float64Array; b: Float64Array; loss: number }

/**
 * Loss and gradients for a batch, derived by hand:
 *
 *   L      = mean over batch of Σᵢ Iᵢ (x'ᵢ - xᵢ)²
 *   g      = ∂L/∂z = 2 I ⊙ (x' - x) ⊙ [z > 0]
 *   ∂L/∂b  = g
 *   ∂L/∂W  = h gᵀ + (W g) xᵀ     (W appears twice: in h = Wx and in Wᵀh)
 */
export function lossAndGradients(
  model: SuperpositionModel,
  batch: Float64Array[]
): Gradients {
  const { W, importance } = model
  const gradW = new Float64Array(W.data.length)
  const gradB = new Float64Array(W.cols)
  let loss = 0

  for (const x of batch) {
    const { h, z, out } = forward(model, x)
    const g = new Float64Array(W.cols)
    for (let i = 0; i < W.cols; i++) {
      const error = out[i] - x[i]
      loss += importance[i] * error * error
      g[i] = z[i] > 0 ? 2 * importance[i] * error : 0
      gradB[i] += g[i]
    }
    // W g, an m-vector
    const Wg = new Float64Array(W.rows)
    for (let k = 0; k < W.rows; k++) {
      for (let i = 0; i < W.cols; i++) Wg[k] += get(W, k, i) * g[i]
    }
    for (let k = 0; k < W.rows; k++) {
      for (let i = 0; i < W.cols; i++) {
        gradW[k * W.cols + i] += h[k] * g[i] + Wg[k] * x[i]
      }
    }
  }

  const n = batch.length
  for (let i = 0; i < gradW.length; i++) gradW[i] /= n
  for (let i = 0; i < gradB.length; i++) gradB[i] /= n
  return { W: gradW, b: gradB, loss: loss / n }
}

/** Trains in place and reports progress. Returns the final loss. */
export function* trainSuperposition(
  model: SuperpositionModel,
  steps: number,
  reportEvery = 50
): Generator<{ step: number; loss: number }, number> {
  const { config } = model
  const rng = createRng(config.seed + 1)
  const adamW = new Adam(model.W.data.length, config.learningRate)
  const adamB = new Adam(model.b.length, config.learningRate)
  let loss = Number.NaN

  for (let step = 1; step <= steps; step++) {
    const batch = Array.from({ length: config.batchSize }, () =>
      sampleFeatures(config.features, config.sparsity, rng)
    )
    const grads = lossAndGradients(model, batch)
    adamW.apply(model.W.data, grads.W)
    adamB.apply(model.b, grads.b)
    loss = grads.loss
    if (step % reportEvery === 0 || step === steps) yield { step, loss }
  }
  return loss
}

export type FeatureSummary = {
  index: number
  importance: number
  direction: number[] // column of W
  length: number // ‖Wᵢ‖: near 1 means the feature is represented
  interference: number // Σⱼ≠ᵢ (Ŵᵢ·Wⱼ)²: how much other features overlap it
  bias: number // bᵢ: the output when nothing reaches feature i
}

/** How the model stores each feature: the numbers the demo plots. */
export function summarise(model: SuperpositionModel): FeatureSummary[] {
  const { W, importance } = model
  const columns = Array.from({ length: W.cols }, (_, i) => column(W, i))
  return columns.map((direction, i) => {
    const length = norm(direction)
    let interference = 0
    if (length > 0) {
      for (let j = 0; j < columns.length; j++) {
        if (j === i) continue
        let projection = 0
        for (let k = 0; k < direction.length; k++) {
          projection += (direction[k] / length) * columns[j][k]
        }
        interference += projection ** 2
      }
    }
    return { index: i, importance: importance[i], direction, length, interference, bias: model.b[i] }
  })
}

/** Features stored with a length above the threshold. */
export function representedCount(
  model: SuperpositionModel,
  threshold = 0.5
): number {
  return summarise(model).filter((feature) => feature.length > threshold).length
}
