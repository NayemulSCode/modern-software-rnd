// A two-layer, attention-only transformer with hand-set weights that contains
// an induction circuit: given "… A B … A" it predicts "B".
//
// Real induction heads are learned during training ("In-context Learning and
// Induction Heads", Olsson et al., 2022). Here the weights are written by
// hand, so every number has a known meaning and the reader can break it.
//
// The residual stream is split into four named subspaces:
//
//   token    which token sits at this position          (written by the embedding)
//   position which position this is                     (written by the embedding)
//   previous which token sat one position earlier       (written by head 1.0)
//   output   the token this position predicts next      (written by head 2.0)

export const TOKENS = ["⟨start⟩", "A", "B", "C", "D", "E", "F", "G", "H"] as const
export type Token = (typeof TOKENS)[number]
export const START = 0
export const MAX_POSITIONS = 16

const V = TOKENS.length
const T = MAX_POSITIONS
const OFFSET = { token: 0, position: V, previous: V + T, output: 2 * V + T }
const D = 3 * V + T

/** Sharpness of attention and of the final prediction. */
const ATTENTION_SCALE = 8
const LOGIT_SCALE = 10

type Head = {
  name: string
  layer: number
  /** D × k query and key maps, and the D × D output-value map. */
  WQ: number[][]
  WK: number[][]
  WOV: number[][]
}

function zeros(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => new Array<number>(cols).fill(0))
}

/** Head 1.0, the previous-token head: position t attends to t-1 and copies its token. */
function previousTokenHead(): Head {
  const WQ = zeros(D, T)
  const WK = zeros(D, T)
  for (let p = 1; p < T; p++) WQ[OFFSET.position + p][p - 1] = 1
  for (let p = 0; p < T; p++) WK[OFFSET.position + p][p] = 1
  const WOV = zeros(D, D)
  for (let i = 0; i < V; i++) WOV[OFFSET.token + i][OFFSET.previous + i] = 1
  return { name: "1.0 previous-token head", layer: 1, WQ, WK, WOV }
}

/**
 * Head 2.0, the induction head: position t looks for an earlier position
 * whose previous token equals t's own token, and copies that position's token
 * into the output. With no match it falls back to the start token.
 */
function inductionHead(): Head {
  const WQ = zeros(D, V + 1)
  const WK = zeros(D, V + 1)
  for (let i = 0; i < V; i++) {
    WQ[OFFSET.token + i][i] = 1 // query: my token
    WK[OFFSET.previous + i][i] = 1 // key: the token before you
    WQ[OFFSET.token + i][V] = 1 // every query has a constant 1 here…
  }
  WK[OFFSET.token + START][V] = 0.5 // …so the start token is a weak default match
  const WOV = zeros(D, D)
  for (let i = 0; i < V; i++) WOV[OFFSET.token + i][OFFSET.output + i] = 1
  return { name: "2.0 induction head", layer: 2, WQ, WK, WOV }
}

export const HEADS = [previousTokenHead(), inductionHead()] as const
export type HeadIndex = 0 | 1

function embed(tokens: number[]): number[][] {
  return tokens.map((token, position) => {
    const x = new Array<number>(D).fill(0)
    x[OFFSET.token + token] = 1
    x[OFFSET.position + position] = 1
    return x
  })
}

function multiply(x: number[], M: number[][]): number[] {
  const cols = M[0].length
  const out = new Array<number>(cols).fill(0)
  for (let r = 0; r < x.length; r++) {
    if (x[r] === 0) continue
    for (let c = 0; c < cols; c++) out[c] += x[r] * M[r][c]
  }
  return out
}

function softmax(values: number[]): number[] {
  const max = Math.max(...values)
  const exps = values.map((v) => Math.exp(v - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((v) => v / sum)
}

function runHead(head: Head, residual: number[][]) {
  const queries = residual.map((x) => multiply(x, head.WQ))
  const keys = residual.map((x) => multiply(x, head.WK))
  const values = residual.map((x) => multiply(x, head.WOV))
  // Causal: position t only sees positions 0..t.
  const pattern = queries.map((q, t) =>
    softmax(
      keys.slice(0, t + 1).map((k) => ATTENTION_SCALE * q.reduce((sum, qi, i) => sum + qi * k[i], 0))
    )
  )
  const output = pattern.map((weights) => {
    const out = new Array<number>(D).fill(0)
    weights.forEach((weight, s) => {
      for (let d = 0; d < D; d++) out[d] += weight * values[s][d]
    })
    return out
  })
  return { pattern, output }
}

export type Intervention =
  | { kind: "none" }
  /** Replace the head's output with zeros. */
  | { kind: "ablate"; head: HeadIndex }
  /** Replace the head's output with its output on another input. */
  | { kind: "patch"; head: HeadIndex; source: number[] }

export type RunResult = {
  /** Attention pattern of each head: pattern[t][s]. */
  patterns: [number[][], number[][]]
  /** Probability of each token at the last position. */
  prediction: { token: number; probability: number }[]
  headOutputs: [number[][], number[][]]
}

export function run(tokens: number[], intervention: Intervention = { kind: "none" }): RunResult {
  if (tokens.length === 0 || tokens.length > MAX_POSITIONS) {
    throw new RangeError(`Sequences must have 1 to ${MAX_POSITIONS} tokens.`)
  }
  if (tokens.some((token) => !Number.isInteger(token) || token < 0 || token >= V)) {
    throw new RangeError("Unknown token id.")
  }

  const sourceOutputs =
    intervention.kind === "patch" ? run(intervention.source).headOutputs : null
  if (sourceOutputs && intervention.kind === "patch" && intervention.source.length !== tokens.length) {
    throw new RangeError("Patching needs two inputs of the same length.")
  }

  let residual = embed(tokens)
  const patterns: number[][][] = []
  const headOutputs: number[][][] = []

  HEADS.forEach((head, index) => {
    const { pattern, output } = runHead(head, residual)
    let used = output
    if (intervention.kind === "ablate" && intervention.head === index) {
      used = output.map((row) => row.map(() => 0))
    } else if (intervention.kind === "patch" && intervention.head === index && sourceOutputs) {
      used = sourceOutputs[index]
    }
    patterns.push(pattern)
    headOutputs.push(used)
    residual = residual.map((x, t) => x.map((value, d) => value + used[t][d]))
  })

  const last = residual[residual.length - 1]
  const logits = Array.from({ length: V }, (_, i) => LOGIT_SCALE * last[OFFSET.output + i])
  const probabilities = softmax(logits)
  const prediction = probabilities
    .map((probability, token) => ({ token, probability }))
    .sort((a, b) => b.probability - a.probability)

  return {
    patterns: patterns as [number[][], number[][]],
    prediction,
    headOutputs: headOutputs as [number[][], number[][]],
  }
}

/** "A B C D A" → token ids, with the start token added in front. */
export function parse(text: string): number[] {
  const letters = text.toUpperCase().replace(/[^A-H]/g, "").split("")
  return [START, ...letters.map((letter) => TOKENS.indexOf(letter as Token))]
}

export function probabilityOf(result: RunResult, token: number): number {
  return result.prediction.find((entry) => entry.token === token)?.probability ?? 0
}
