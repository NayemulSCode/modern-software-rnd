"use client"

import { useEffect, useId, useMemo, useState } from "react"

import { createRng } from "@/lib/toy/linalg"
import type { SaeProgress } from "@/lib/toy/protocol"
import { DEFAULT_SAE, sampleActivation, trueDirections } from "@/lib/toy/sae"

import { DataTable, FEATURE_COLORS } from "./demo-frame"
import { useTraining } from "./use-training"

const PENALTIES = [0.01, 0.03, 0.1, 0.3, 1, 2]
const DEFAULT_INDEX = PENALTIES.indexOf(DEFAULT_SAE.l1)
const TRAINING_STEPS = 3000
const LATENT_NAMES = "abcdefghijkl".split("")

export default function SaeDemo() {
  const sliderId = useId()
  const [penaltyIndex, setPenaltyIndex] = useState(DEFAULT_INDEX)
  const l1 = PENALTIES[penaltyIndex]
  const { state, latest, shown, start, stop } = useTraining<SaeProgress>()

  const directions = useMemo(() => trueDirections(DEFAULT_SAE.features), [])
  // A fixed sample of the activations the SAE is trained on, for the scatter plot.
  const points = useMemo(() => {
    const rng = createRng(42)
    return Array.from({ length: 400 }, () => sampleActivation(directions, DEFAULT_SAE.sparsity, rng))
  }, [directions])

  useEffect(() => {
    const timer = setTimeout(() => start({ kind: "sae", l1, steps: TRAINING_STEPS }), 200)
    return () => clearTimeout(timer)
  }, [l1, start])

  const report = shown?.report

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor={sliderId} className="text-sm font-medium">
          Sparsity penalty λ = {l1}
        </label>
        <input
          id={sliderId}
          type="range"
          min={0}
          max={PENALTIES.length - 1}
          step={1}
          value={penaltyIndex}
          onChange={(event) => setPenaltyIndex(Number(event.target.value))}
          aria-valuetext={`lambda ${l1}`}
          className="w-full accent-(--accent)"
        />
        <div className="flex justify-between text-xs text-muted" aria-hidden="true">
          <span>reconstruct exactly</span>
          <span>use few latents</span>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:items-center">
        <svg
          viewBox="-1.5 -1.5 3 3"
          role="img"
          aria-label={`Activations of the model, its 5 true feature directions, and the directions the sparse autoencoder learned. ${
            report ? `${report.recovered} of 5 features recovered.` : "Training."
          }`}
          className="mx-auto aspect-square w-full max-w-64"
        >
          {points.map((point, index) => (
            <circle key={index} cx={point[0]} cy={-point[1]} r={0.018} fill="var(--muted)" opacity={0.35} />
          ))}
          {directions.map((direction, index) => (
            <g key={index}>
              <line
                x1={0}
                y1={0}
                x2={direction[0] * 1.25}
                y2={-direction[1] * 1.25}
                stroke={FEATURE_COLORS[index]}
                strokeWidth={0.02}
                strokeDasharray="0.06 0.04"
              />
              <text
                x={direction[0] * 1.38}
                y={-direction[1] * 1.38}
                fontSize={0.16}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--foreground)"
              >
                {index + 1}
              </text>
            </g>
          ))}
          {report?.latentDirections.map((direction, index) =>
            report.alive[index] ? (
              <g key={index}>
                <line
                  x1={0}
                  y1={0}
                  x2={direction[0]}
                  y2={-direction[1]}
                  stroke="var(--foreground)"
                  strokeWidth={0.035}
                  strokeLinecap="round"
                />
                <text
                  x={direction[0] * 0.78}
                  y={-direction[1] * 0.78 - 0.1}
                  fontSize={0.14}
                  textAnchor="middle"
                  fill="var(--foreground)"
                  fontStyle="italic"
                >
                  {LATENT_NAMES[index]}
                </text>
              </g>
            ) : null
          )}
        </svg>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-border bg-background p-3">
            <dt className="text-muted">Features recovered</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">{report ? `${report.recovered} / 5` : "–"}</dd>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <dt className="text-muted">Dead latents</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">
              {report ? `${report.dead} / ${DEFAULT_SAE.latents}` : "–"}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <dt className="text-muted">Reconstruction error</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">{shown ? shown.reconstruction.toFixed(4) : "–"}</dd>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <dt className="text-muted">Latents on per input</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">{shown ? shown.l0.toFixed(2) : "–"}</dd>
          </div>
        </dl>
      </div>

      <p className="text-xs text-muted">
        Dots: activations. Dashed, numbered: the 5 true feature directions. Solid, lettered: what the
        autoencoder learned (dead latents are hidden). Each input has about 0.5 features on.
      </p>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {state.status === "running" ? (
          <button type="button" onClick={stop} className="rounded-md border border-border px-3 py-1.5 hover:border-accent">
            Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={() => start({ kind: "sae", l1, steps: TRAINING_STEPS })}
            className="rounded-md border border-border px-3 py-1.5 hover:border-accent"
          >
            Train again
          </button>
        )}
        <span className="text-muted tabular-nums">
          {state.status === "error" ? state.message : latest ? `Step ${latest.step} of ${latest.steps}` : "Starting…"}
        </span>
      </div>

      <p aria-live="polite" className="rounded-md bg-background px-3 py-2 text-sm">
        {state.status === "done" && report
          ? `With λ = ${l1}, the autoencoder recovers ${report.recovered} of 5 features, with ${report.dead} dead ${report.dead === 1 ? "latent" : "latents"} and reconstruction error ${state.latest.reconstruction.toFixed(4)}.`
          : state.status === "stopped"
            ? "Stopped. Train again to finish."
            : "Training…"}
      </p>

      <DataTable
        caption="Best-matching latent for each true feature"
        headers={["Feature", "Best latent", "Cosine similarity", "Recovered (≥ 0.9)"]}
        rows={(report?.matches ?? []).map((match) => [
          match.feature + 1,
          match.latent >= 0 ? LATENT_NAMES[match.latent] : "none",
          match.similarity.toFixed(2),
          match.similarity >= 0.9 ? "yes" : "no",
        ])}
      />
    </div>
  )
}
