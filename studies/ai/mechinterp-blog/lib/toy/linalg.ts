// Small helpers for the toy models. The models have tens of parameters, so
// plain loops over Float64Array are fast enough and easy to read.

export type Matrix = { rows: number; cols: number; data: Float64Array }

export function matrix(rows: number, cols: number, fill = 0): Matrix {
  return { rows, cols, data: new Float64Array(rows * cols).fill(fill) }
}

export function get(m: Matrix, r: number, c: number): number {
  return m.data[r * m.cols + c]
}

export function set(m: Matrix, r: number, c: number, value: number): void {
  m.data[r * m.cols + c] = value
}

export function cloneMatrix(m: Matrix): Matrix {
  return { rows: m.rows, cols: m.cols, data: new Float64Array(m.data) }
}

/** Column `c` as a new array. */
export function column(m: Matrix, c: number): number[] {
  return Array.from({ length: m.rows }, (_, r) => get(m, r, c))
}

export function dot(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i]
  return sum
}

export function norm(a: ArrayLike<number>): number {
  return Math.sqrt(dot(a, a))
}

export function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  const denominator = norm(a) * norm(b)
  return denominator === 0 ? 0 : dot(a, b) / denominator
}

/** Seeded random numbers (mulberry32), so every run of a demo is repeatable. */
export function createRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Standard normal sample (Box-Muller). */
export function gaussian(rng: () => number): number {
  const u = Math.max(rng(), Number.EPSILON)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng())
}

/**
 * Adam optimiser state for one flat parameter array. Adam is used instead of
 * plain gradient descent so the demos converge in a second or two.
 */
export class Adam {
  private readonly m: Float64Array
  private readonly v: Float64Array
  private step = 0

  constructor(
    size: number,
    private readonly learningRate: number,
    private readonly beta1 = 0.9,
    private readonly beta2 = 0.999,
    private readonly epsilon = 1e-8
  ) {
    this.m = new Float64Array(size)
    this.v = new Float64Array(size)
  }

  apply(params: Float64Array, grads: Float64Array): void {
    this.step += 1
    const correction1 = 1 - this.beta1 ** this.step
    const correction2 = 1 - this.beta2 ** this.step
    for (let i = 0; i < params.length; i++) {
      this.m[i] = this.beta1 * this.m[i] + (1 - this.beta1) * grads[i]
      this.v[i] = this.beta2 * this.v[i] + (1 - this.beta2) * grads[i] ** 2
      const mHat = this.m[i] / correction1
      const vHat = this.v[i] / correction2
      params[i] -= (this.learningRate * mHat) / (Math.sqrt(vHat) + this.epsilon)
    }
  }
}
