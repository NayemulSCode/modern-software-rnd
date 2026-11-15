// A sparse autoencoder (SAE) at toy scale, in the style of "Towards
// Monosemanticity" (Bricken et al., 2023):
//
//   f = ReLU(W_e (h - b_d) + b_e)     encode into many sparse latents
//   ĥ = W_d f + b_d                   decode back to the activation
//   L = ‖ĥ - h‖² + λ Σ f              reconstruct well, with few latents on
//
// Decoder columns are rescaled to unit length after every step, so the L1
// penalty cannot be dodged by shrinking f and growing W_d.
//
// The activations come from a model that stores `features` features in 2
// dimensions as evenly spaced directions: the pentagon the superposition toy
// model finds for 5 sparse features.

import { Adam, column, cosine, createRng, gaussian, matrix, type Matrix } from "./linalg"
import { sampleFeatures } from "./superposition"

export type SaeConfig = {
  features: number // true features hidden in the activations
  latents: number // dictionary size
  l1: number // λ
  sparsity: number // of the true features
  batchSize: number
  learningRate: number
  seed: number
}

export const DEFAULT_SAE: SaeConfig = {
  features: 5,
  latents: 8,
  l1: 0.3,
  sparsity: 0.9,
  batchSize: 256,
  learningRate: 0.01,
  seed: 11,
}

export const ACTIVATION_DIMS = 2

/** The true feature directions: evenly spaced unit vectors. */
export function trueDirections(features: number): number[][] {
  return Array.from({ length: features }, (_, i) => {
    const angle = Math.PI / 2 + (2 * Math.PI * i) / features
    return [Math.cos(angle), Math.sin(angle)]
  })
}

/** One activation vector: the sum of each active feature times its direction. */
export function sampleActivation(
  directions: number[][],
  sparsity: number,
  rng: () => number
): Float64Array {
  const x = sampleFeatures(directions.length, sparsity, rng)
  const h = new Float64Array(ACTIVATION_DIMS)
  directions.forEach((direction, i) => {
    for (let k = 0; k < ACTIVATION_DIMS; k++) h[k] += x[i] * direction[k]
  })
  return h
}

export type Sae = {
  config: SaeConfig
  We: Matrix // latents × dims
  be: Float64Array // latents
  Wd: Matrix // dims × latents: column j is latent j's direction
  bd: Float64Array // dims
}

export function createSae(config: SaeConfig): Sae {
  const rng = createRng(config.seed)
  const Wd = matrix(ACTIVATION_DIMS, config.latents)
  for (let i = 0; i < Wd.data.length; i++) Wd.data[i] = gaussian(rng)
  normaliseDecoder(Wd)
  // Tie the encoder to the decoder at the start, a common SAE initialisation.
  const We = matrix(config.latents, ACTIVATION_DIMS)
  for (let j = 0; j < config.latents; j++) {
    for (let k = 0; k < ACTIVATION_DIMS; k++) {
      We.data[j * ACTIVATION_DIMS + k] = Wd.data[k * config.latents + j]
    }
  }
  return {
    config,
    We,
    be: new Float64Array(config.latents),
    Wd,
    bd: new Float64Array(ACTIVATION_DIMS),
  }
}

export function normaliseDecoder(Wd: Matrix): void {
  for (let j = 0; j < Wd.cols; j++) {
    let length = 0
    for (let k = 0; k < Wd.rows; k++) length += Wd.data[k * Wd.cols + j] ** 2
    length = Math.sqrt(length) || 1
    for (let k = 0; k < Wd.rows; k++) Wd.data[k * Wd.cols + j] /= length
  }
}

type Pass = { centred: Float64Array; e: Float64Array; f: Float64Array; out: Float64Array }

export function encodeDecode(sae: Sae, h: Float64Array): Pass {
  const { We, be, Wd, bd } = sae
  const L = sae.config.latents
  const centred = Float64Array.from(h, (value, k) => value - bd[k])
  const e = new Float64Array(L)
  const f = new Float64Array(L)
  for (let j = 0; j < L; j++) {
    let sum = be[j]
    for (let k = 0; k < ACTIVATION_DIMS; k++) sum += We.data[j * ACTIVATION_DIMS + k] * centred[k]
    e[j] = sum
    f[j] = Math.max(0, sum)
  }
  const out = Float64Array.from(bd)
  for (let k = 0; k < ACTIVATION_DIMS; k++) {
    for (let j = 0; j < L; j++) out[k] += Wd.data[k * L + j] * f[j]
  }
  return { centred, e, f, out }
}

export type SaeGradients = {
  We: Float64Array
  be: Float64Array
  Wd: Float64Array
  bd: Float64Array
  loss: number
  reconstruction: number
  l0: number // average number of active latents per input
}

/**
 * Loss and gradients, derived by hand. With r = ĥ - h:
 *
 *   ∂L/∂W_d = 2 r fᵀ
 *   ∂L/∂f   = W_dᵀ (2r) + λ           (f ≥ 0, so Σ|f| = Σ f)
 *   ∂L/∂e   = ∂L/∂f ⊙ [e > 0]
 *   ∂L/∂W_e = (∂L/∂e)(h - b_d)ᵀ,  ∂L/∂b_e = ∂L/∂e
 *   ∂L/∂b_d = 2r - W_eᵀ (∂L/∂e)       (b_d is added back and subtracted first)
 */
export function saeLossAndGradients(sae: Sae, batch: Float64Array[]): SaeGradients {
  const L = sae.config.latents
  const D = ACTIVATION_DIMS
  const grads = {
    We: new Float64Array(sae.We.data.length),
    be: new Float64Array(L),
    Wd: new Float64Array(sae.Wd.data.length),
    bd: new Float64Array(D),
  }
  let reconstruction = 0
  let sparsityPenalty = 0
  let active = 0

  for (const h of batch) {
    const { centred, e, f, out } = encodeDecode(sae, h)
    const r2 = new Float64Array(D)
    for (let k = 0; k < D; k++) {
      const residual = out[k] - h[k]
      reconstruction += residual * residual
      r2[k] = 2 * residual
      grads.bd[k] += r2[k]
    }
    for (let j = 0; j < L; j++) {
      sparsityPenalty += f[j]
      if (f[j] > 0) active += 1
      let df = sae.config.l1
      for (let k = 0; k < D; k++) {
        grads.Wd[k * L + j] += r2[k] * f[j]
        df += sae.Wd.data[k * L + j] * r2[k]
      }
      const de = e[j] > 0 ? df : 0
      grads.be[j] += de
      for (let k = 0; k < D; k++) {
        grads.We[j * D + k] += de * centred[k]
        grads.bd[k] -= sae.We.data[j * D + k] * de
      }
    }
  }

  const n = batch.length
  for (const key of ["We", "be", "Wd", "bd"] as const) {
    const g = grads[key]
    for (let i = 0; i < g.length; i++) g[i] /= n
  }
  return {
    ...grads,
    loss: (reconstruction + sae.config.l1 * sparsityPenalty) / n,
    reconstruction: reconstruction / n,
    l0: active / n,
  }
}

export function* trainSae(
  sae: Sae,
  steps: number,
  reportEvery = 50
): Generator<{ step: number; loss: number; reconstruction: number; l0: number }, void> {
  const { config } = sae
  const rng = createRng(config.seed + 1)
  const directions = trueDirections(config.features)
  const optimisers = {
    We: new Adam(sae.We.data.length, config.learningRate),
    be: new Adam(sae.be.length, config.learningRate),
    Wd: new Adam(sae.Wd.data.length, config.learningRate),
    bd: new Adam(sae.bd.length, config.learningRate),
  }

  for (let step = 1; step <= steps; step++) {
    const batch = Array.from({ length: config.batchSize }, () =>
      sampleActivation(directions, config.sparsity, rng)
    )
    const grads = saeLossAndGradients(sae, batch)
    optimisers.We.apply(sae.We.data, grads.We)
    optimisers.be.apply(sae.be, grads.be)
    optimisers.Wd.apply(sae.Wd.data, grads.Wd)
    optimisers.bd.apply(sae.bd, grads.bd)
    normaliseDecoder(sae.Wd)
    if (step % reportEvery === 0 || step === steps) {
      yield { step, loss: grads.loss, reconstruction: grads.reconstruction, l0: grads.l0 }
    }
  }
}

export type SaeReport = {
  /** For each true feature, the latent whose direction matches it best. */
  matches: { feature: number; latent: number; similarity: number }[]
  recovered: number // true features matched with cosine similarity ≥ 0.9
  dead: number // latents that never fire on a sample of inputs
  latentDirections: number[][]
  alive: boolean[]
}

export function evaluateSae(sae: Sae, samples = 2000): SaeReport {
  const { config } = sae
  const directions = trueDirections(config.features)
  const rng = createRng(config.seed + 99)
  const fired = new Array<boolean>(config.latents).fill(false)
  for (let s = 0; s < samples; s++) {
    const { f } = encodeDecode(sae, sampleActivation(directions, config.sparsity, rng))
    f.forEach((value, j) => {
      if (value > 0) fired[j] = true
    })
  }
  const latentDirections = Array.from({ length: config.latents }, (_, j) => column(sae.Wd, j))
  const matches = directions.map((direction, feature) => {
    let best = { feature, latent: -1, similarity: -1 }
    latentDirections.forEach((latentDirection, latent) => {
      if (!fired[latent]) return
      const similarity = cosine(direction, latentDirection)
      if (similarity > best.similarity) best = { feature, latent, similarity }
    })
    return best
  })
  return {
    matches,
    recovered: matches.filter((match) => match.similarity >= 0.9).length,
    dead: fired.filter((value) => !value).length,
    latentDirections,
    alive: fired,
  }
}
