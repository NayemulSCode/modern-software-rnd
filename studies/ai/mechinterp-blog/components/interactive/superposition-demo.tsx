"use client"

import { useEffect, useId, useState } from "react"

import type { SuperpositionProgress } from "@/lib/toy/protocol"

import { DataTable, FEATURE_COLORS } from "./demo-frame"
import { useTraining } from "./use-training"

const SPARSITY_STEPS = [0, 0.5, 0.8, 0.9, 0.97, 0.99]
const TRAINING_STEPS = 3000
const REPRESENTED = 0.5

function percent(value: number) {
  return `${Math.round(value * 100)}%`
}

export default function SuperpositionDemo() {
  const sliderId = useId()
  const [sparsityIndex, setSparsityIndex] = useState(0)
  const sparsity = SPARSITY_STEPS[sparsityIndex]
  const { state, latest, shown, start, stop } = useTraining<SuperpositionProgress>()

  // Retrain shortly after the slider settles, so dragging it does not start
  // a job for every value it passes.
  useEffect(() => {
    const timer = setTimeout(() => start({ kind: "superposition", sparsity, steps: TRAINING_STEPS }), 200)
    return () => clearTimeout(timer)
  }, [sparsity, start])

  const features = shown?.features ?? []
  const represented = features.filter((feature) => feature.length > REPRESENTED)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor={sliderId} className="text-sm font-medium">
          Sparsity: each feature is zero {percent(sparsity)} of the time
        </label>
        <input
          id={sliderId}
          type="range"
          min={0}
          max={SPARSITY_STEPS.length - 1}
          step={1}
          value={sparsityIndex}
          onChange={(event) => setSparsityIndex(Number(event.target.value))}
          aria-valuetext={`${percent(sparsity)} sparsity, features active ${percent(1 - sparsity)} of the time`}
          className="w-full accent-(--accent)"
        />
        <div className="flex justify-between text-xs text-muted" aria-hidden="true">
          <span>dense</span>
          <span>very sparse</span>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:items-center">
        <svg
          viewBox="-1.5 -1.5 3 3"
          role="img"
          aria-label={`Where the model stores each feature in its 2 hidden dimensions. ${represented.length} of 5 features have an arrow of length above ${REPRESENTED}.`}
          className="mx-auto aspect-square w-full max-w-60"
        >
          <circle r={1} fill="none" stroke="var(--border)" strokeWidth={0.015} strokeDasharray="0.05 0.05" />
          <line x1={-1.4} x2={1.4} y1={0} y2={0} stroke="var(--border)" strokeWidth={0.01} />
          <line y1={-1.4} y2={1.4} x1={0} x2={0} stroke="var(--border)" strokeWidth={0.01} />
          {features.map((feature) => {
            const [x, y] = feature.direction
            const length = Math.hypot(x, y)
            const labelScale = length > 0.05 ? (length + 0.2) / length : 0
            return (
              <g key={feature.index} opacity={feature.length > REPRESENTED ? 1 : 0.35}>
                <line
                  x1={0}
                  y1={0}
                  x2={x}
                  y2={-y}
                  stroke={FEATURE_COLORS[feature.index]}
                  strokeWidth={0.05}
                  strokeLinecap="round"
                />
                {labelScale > 0 ? (
                  <text
                    x={x * labelScale}
                    y={-y * labelScale}
                    fontSize={0.2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="var(--foreground)"
                    fontWeight={600}
                  >
                    {feature.index + 1}
                  </text>
                ) : null}
              </g>
            )
          })}
        </svg>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">How strongly each feature is stored</p>
          <ul className="flex flex-col gap-2">
            {features.map((feature) => (
              <li key={feature.index} className="grid grid-cols-[4.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 text-sm">
                <span>Feature {feature.index + 1}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-border" aria-hidden="true">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (feature.length / 1.2) * 100)}%`,
                      background: FEATURE_COLORS[feature.index],
                    }}
                  />
                </span>
                <span className="text-right text-muted tabular-nums">{feature.length.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">
            Feature 1 matters most; each one after it matters 0.7 times as much.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {state.status === "running" ? (
          <button type="button" onClick={stop} className="rounded-md border border-border px-3 py-1.5 hover:border-accent">
            Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={() => start({ kind: "superposition", sparsity, steps: TRAINING_STEPS })}
            className="rounded-md border border-border px-3 py-1.5 hover:border-accent"
          >
            Train again
          </button>
        )}
        <span className="text-muted tabular-nums">
          {state.status === "error"
            ? state.message
            : latest
              ? `Step ${latest.step} of ${latest.steps} · loss ${latest.loss.toFixed(4)}`
              : "Starting…"}
        </span>
      </div>

      <p aria-live="polite" className="rounded-md bg-background px-3 py-2 text-sm">
        {state.status === "done"
          ? `At ${percent(sparsity)} sparsity the model stores ${represented.length} of 5 features in 2 dimensions${
              represented.length > 2 ? ", so some of them must share space" : ""
            }.`
          : state.status === "stopped"
            ? "Stopped. Train again to finish."
            : "Training…"}
      </p>

      <DataTable
        caption="Feature storage after training"
        headers={["Feature", "Importance", "Length ‖Wᵢ‖", "Overlap with others", "Bias bᵢ"]}
        rows={features.map((feature) => [
          feature.index + 1,
          feature.importance.toFixed(2),
          feature.length.toFixed(2),
          feature.interference.toFixed(2),
          feature.bias.toFixed(2),
        ])}
      />
    </div>
  )
}
