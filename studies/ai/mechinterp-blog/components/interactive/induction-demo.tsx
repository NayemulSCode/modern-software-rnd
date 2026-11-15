"use client"

import { useId, useMemo, useState } from "react"

import {
  HEADS,
  type Intervention,
  MAX_POSITIONS,
  parse,
  run,
  type RunResult,
  TOKENS,
} from "@/lib/toy/induction"

type Mode = "none" | "ablate-0" | "ablate-1" | "patch-0" | "patch-1"

const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: "none", label: "No intervention", hint: "Run the model as built." },
  { value: "ablate-0", label: "Ablate head 1.0", hint: "Zero the previous-token head's output." },
  { value: "ablate-1", label: "Ablate head 2.0", hint: "Zero the induction head's output." },
  {
    value: "patch-0",
    label: "Patch head 1.0",
    hint: "Replace the previous-token head's output with its output on a second input.",
  },
  {
    value: "patch-1",
    label: "Patch head 2.0",
    hint: "Replace the induction head's output with its output on a second input.",
  },
]

const PRESETS = ["A B C D A", "E F G H E F G", "A B C D", "A E C D A"]

/** Shows a token sequence as letters, with the start token as a symbol. */
function label(token: number) {
  return token === 0 ? "⟨s⟩" : TOKENS[token]
}

function toTokens(text: string): { tokens: number[]; error: string | null } {
  const cleaned = text.toUpperCase().replace(/[\s,]/g, "")
  if (cleaned.length === 0) return { tokens: [], error: "Type at least one letter from A to H." }
  if (/[^A-H]/.test(cleaned)) return { tokens: [], error: "Use only the letters A to H." }
  if (cleaned.length > MAX_POSITIONS - 1) {
    return { tokens: [], error: `Use at most ${MAX_POSITIONS - 1} letters.` }
  }
  return { tokens: parse(cleaned), error: null }
}

function AttentionGrid({ pattern, tokens, title }: { pattern: number[][]; tokens: number[]; title: string }) {
  return (
    <figure className="min-w-0">
      <figcaption className="mb-2 text-sm font-medium">{title}</figcaption>
      <div className="overflow-x-auto">
        <table className="border-collapse text-xs tabular-nums">
          <caption className="sr-only">
            {title}. Rows are the position doing the looking, columns the position looked at. Values are attention
            weights from 0 to 1.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="px-1 text-muted">
                <span className="sr-only">From \ to</span>
              </th>
              {tokens.map((token, s) => (
                <th key={s} scope="col" className="w-7 px-0.5 py-1 font-normal text-muted">
                  {label(token)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pattern.map((row, t) => (
              <tr key={t}>
                <th scope="row" className="px-1 py-0.5 text-right font-normal text-muted">
                  {label(tokens[t])}
                </th>
                {tokens.map((_, s) => {
                  const weight = s <= t ? row[s] : 0
                  return (
                    <td
                      key={s}
                      className="h-7 w-7 border border-background text-center"
                      style={{
                        background: `color-mix(in oklch, var(--accent) ${Math.round(weight * 100)}%, var(--surface))`,
                        color: weight > 0.55 ? "var(--background)" : "transparent",
                      }}
                    >
                      <span className={weight > 0.55 ? "" : "sr-only"}>{weight.toFixed(2)}</span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}

export default function InductionDemo() {
  const inputId = useId()
  const sourceId = useId()
  const [text, setText] = useState("A B C D A")
  // The default pair for patching: the same sequence with B swapped for E.
  const [sourceText, setSourceText] = useState("A B C D A")
  const [mode, setMode] = useState<Mode>("none")

  const input = toTokens(text)
  const source = toTokens(sourceText)

  const outcome = useMemo((): { result: RunResult | null; error: string | null } => {
    if (input.error) return { result: null, error: input.error }
    let intervention: Intervention = { kind: "none" }
    if (mode === "ablate-0") intervention = { kind: "ablate", head: 0 }
    if (mode === "ablate-1") intervention = { kind: "ablate", head: 1 }
    if (mode === "patch-0" || mode === "patch-1") {
      if (source.error) return { result: null, error: `Second input: ${source.error}` }
      if (source.tokens.length !== input.tokens.length) {
        return { result: null, error: "For patching, both inputs need the same number of letters." }
      }
      intervention = { kind: "patch", head: mode === "patch-0" ? 0 : 1, source: source.tokens }
    }
    try {
      return { result: run(input.tokens, intervention), error: null }
    } catch (error) {
      return { result: null, error: error instanceof Error ? error.message : "The model could not run." }
    }
  }, [input.error, input.tokens, mode, source.error, source.tokens])

  const top = outcome.result?.prediction.slice(0, 4) ?? []
  const best = top[0]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-sm font-medium">
          Input (letters A–H)
        </label>
        <input
          id={inputId}
          value={text}
          onChange={(event) => setText(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={input.error ? true : undefined}
          aria-describedby={input.error ? `${inputId}-error` : undefined}
          className="rounded-md border border-border bg-background px-3 py-2 font-mono tracking-widest uppercase"
        />
        {input.error ? (
          <p id={`${inputId}-error`} className="text-sm text-warn">
            {input.error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Example inputs">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setText(preset)}
              className="rounded-md border border-border px-2 py-1 font-mono text-xs hover:border-accent"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Intervention</legend>
        {MODES.map((option) => (
          <label key={option.value} className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name={`${inputId}-mode`}
              value={option.value}
              checked={mode === option.value}
              onChange={() => setMode(option.value)}
              className="mt-1 accent-(--accent)"
            />
            <span>
              <span className="font-medium">{option.label}</span>
              <span className="text-muted"> — {option.hint}</span>
            </span>
          </label>
        ))}
        {mode === "patch-0" || mode === "patch-1" ? (
          <div className="mt-2 flex flex-col gap-1 pl-6">
            <label htmlFor={sourceId} className="text-sm">
              Second input, to take head {mode === "patch-0" ? "1.0" : "2.0"}&apos;s output from
            </label>
            <input
              id={sourceId}
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="rounded-md border border-border bg-background px-3 py-2 font-mono tracking-widest uppercase"
            />
          </div>
        ) : null}
      </fieldset>

      {outcome.error ? (
        <p role="alert" className="text-sm text-warn">
          {outcome.error}
        </p>
      ) : null}

      {outcome.result ? (
        <>
          <div>
            <p className="text-sm font-medium">Next-token prediction</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {top.map((entry) => (
                <li key={entry.token} className="grid grid-cols-[2.5rem_minmax(0,1fr)_3.5rem] items-center gap-2 text-sm">
                  <span className="font-mono">{label(entry.token)}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-border" aria-hidden="true">
                    <span className="block h-full rounded-full bg-accent" style={{ width: `${entry.probability * 100}%` }} />
                  </span>
                  <span className="text-right text-muted tabular-nums">{(entry.probability * 100).toFixed(1)}%</span>
                </li>
              ))}
            </ul>
            <p aria-live="polite" className="mt-3 rounded-md bg-background px-3 py-2 text-sm">
              {best
                ? best.token === 0
                  ? "The model makes no confident guess: it found no earlier copy of the last letter."
                  : `The model predicts ${label(best.token)} with ${(best.probability * 100).toFixed(0)}% probability.`
                : ""}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {HEADS.map((head, index) => (
              <AttentionGrid
                key={head.name}
                title={`Head ${head.name}`}
                pattern={outcome.result!.patterns[index]}
                tokens={input.tokens}
              />
            ))}
          </div>
          <p className="text-xs text-muted">
            Darker squares: more attention. Each row is a position, looking back at earlier positions. ⟨s⟩ is the
            start token. Attention patterns are shown as computed, before any intervention replaces a head&apos;s output.
          </p>
        </>
      ) : null}
    </div>
  )
}
