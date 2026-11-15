import { describe, expect, it } from "vitest"

import {
  parse,
  probabilityOf,
  run,
  TOKENS,
} from "@/lib/toy/induction"
import { createRng } from "@/lib/toy/linalg"
import {
  createSae,
  DEFAULT_SAE,
  evaluateSae,
  sampleActivation,
  saeLossAndGradients,
  trainSae,
  trueDirections,
} from "@/lib/toy/sae"
import {
  createSuperpositionModel,
  DEFAULT_SUPERPOSITION,
  lossAndGradients,
  representedCount,
  sampleFeatures,
  trainSuperposition,
} from "@/lib/toy/superposition"

/** Runs a training generator to the end. */
function drain(generator: Generator<unknown, unknown>) {
  for (;;) if (generator.next().done) return
}

/** Compares an analytic gradient with central finite differences. */
function expectGradientsMatch(
  params: Float64Array,
  analytic: Float64Array,
  lossOf: () => number,
  epsilon = 1e-5
) {
  for (let i = 0; i < params.length; i++) {
    const original = params[i]
    params[i] = original + epsilon
    const up = lossOf()
    params[i] = original - epsilon
    const down = lossOf()
    params[i] = original
    const numeric = (up - down) / (2 * epsilon)
    expect(analytic[i]).toBeCloseTo(numeric, 4)
  }
}

describe("superposition toy model", () => {
  it("has gradients that match finite differences", () => {
    const model = createSuperpositionModel({ ...DEFAULT_SUPERPOSITION, sparsity: 0.5 })
    const rng = createRng(3)
    const batch = Array.from({ length: 16 }, () => sampleFeatures(5, 0.5, rng))
    const grads = lossAndGradients(model, batch)
    const lossOf = () => lossAndGradients(model, batch).loss
    expectGradientsMatch(model.W.data, grads.W, lossOf)
    expectGradientsMatch(model.b, grads.b, lossOf)
  })

  it("stores only the two most important features when features are dense", () => {
    const model = createSuperpositionModel({ ...DEFAULT_SUPERPOSITION, sparsity: 0 })
    drain(trainSuperposition(model, 3000))
    expect(representedCount(model)).toBe(2)
  })

  it("adds a third feature at moderate sparsity", () => {
    const model = createSuperpositionModel({ ...DEFAULT_SUPERPOSITION, sparsity: 0.5 })
    drain(trainSuperposition(model, 3000))
    expect(representedCount(model)).toBe(3)
  })

  it("stores all five features in two dimensions when they are sparse", () => {
    const model = createSuperpositionModel({ ...DEFAULT_SUPERPOSITION, sparsity: 0.97 })
    drain(trainSuperposition(model, 3000))
    expect(representedCount(model)).toBe(5)
  })
})

describe("sparse autoencoder", () => {
  it("has gradients that match finite differences", () => {
    const sae = createSae({ ...DEFAULT_SAE, latents: 4 })
    const rng = createRng(5)
    const directions = trueDirections(5)
    const batch = Array.from({ length: 16 }, () => sampleActivation(directions, 0.6, rng))
    const grads = saeLossAndGradients(sae, batch)
    const lossOf = () => saeLossAndGradients(sae, batch).loss
    expectGradientsMatch(sae.We.data, grads.We, lossOf)
    expectGradientsMatch(sae.be, grads.be, lossOf)
    expectGradientsMatch(sae.Wd.data, grads.Wd, lossOf)
    expectGradientsMatch(sae.bd, grads.bd, lossOf)
  })

  it("recovers every hidden feature with the default penalty", () => {
    const sae = createSae(DEFAULT_SAE)
    drain(trainSae(sae, 3000))
    expect(evaluateSae(sae).recovered).toBe(5)
  })

  it("reconstructs well but misses features when the penalty is too low", () => {
    const sae = createSae({ ...DEFAULT_SAE, l1: 0.01 })
    drain(trainSae(sae, 3000))
    expect(evaluateSae(sae).recovered).toBeLessThan(5)
  })

  it("loses features when the penalty is far too high", () => {
    const sae = createSae({ ...DEFAULT_SAE, l1: 2 })
    drain(trainSae(sae, 3000))
    expect(evaluateSae(sae).recovered).toBeLessThan(5)
  })
})

describe("induction circuit", () => {
  const B = TOKENS.indexOf("B")
  const X = TOKENS.indexOf("E")

  it("predicts the token that followed the earlier occurrence", () => {
    const result = run(parse("A B C D A"))
    expect(result.prediction[0].token).toBe(B)
    expect(probabilityOf(result, B)).toBeGreaterThan(0.9)
  })

  it("makes no confident guess without a repeat", () => {
    const result = run(parse("A B C D"))
    expect(result.prediction[0].token).toBe(0)
  })

  it.each([0, 1] as const)("breaks when head %i is ablated", (head) => {
    const result = run(parse("A B C D A"), { kind: "ablate", head })
    expect(probabilityOf(result, B)).toBeLessThan(0.3)
  })

  it("is restored by patching the induction head from the clean run", () => {
    const clean = parse("A B C D A")
    const corrupted = parse("A E C D A")
    expect(run(corrupted).prediction[0].token).toBe(X)
    const patched = run(corrupted, { kind: "patch", head: 1, source: clean })
    expect(patched.prediction[0].token).toBe(B)
  })

  it("rejects input that is too long", () => {
    expect(() => run(parse("ABCDEFGHABCDEFGHA"))).toThrow(RangeError)
  })
})
