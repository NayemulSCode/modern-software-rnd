"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"

import type { TrainRequest, TrainResponse } from "@/lib/toy/protocol"

export type TrainingState<T> =
  | { status: "idle" }
  | { status: "running"; latest: T | null }
  | { status: "done"; latest: T }
  | { status: "stopped"; latest: T | null }
  | { status: "error"; message: string }

/**
 * Runs one training job in a fresh Web Worker and streams its progress.
 * Starting a new job or unmounting terminates the previous worker, which is
 * also how Stop works: training is a tight loop that cannot be interrupted.
 */
export function useTraining<T extends Exclude<TrainResponse, { kind: "error" }>>() {
  const workerRef = useRef<Worker | null>(null)
  const [state, setState] = useState<TrainingState<T>>({ status: "idle" })
  const [lastDone, setLastDone] = useState<T | null>(null)
  const reducedMotion = useReducedMotion()

  const terminate = useCallback(() => {
    workerRef.current?.terminate()
    workerRef.current = null
  }, [])

  const start = useCallback(
    (request: TrainRequest) => {
      terminate()
      let worker: Worker
      try {
        worker = new Worker(new URL("../../lib/toy/train.worker.ts", import.meta.url), {
          type: "module",
        })
      } catch {
        setState({ status: "error", message: "This browser cannot start the training worker." })
        return
      }
      workerRef.current = worker
      setState({ status: "running", latest: null })

      worker.onmessage = (event: MessageEvent<TrainResponse>) => {
        const message = event.data
        if (message.kind === "error") {
          setState({ status: "error", message: message.message })
          terminate()
          return
        }
        const latest = message as T
        if (latest.done) {
          setState({ status: "done", latest })
          setLastDone(latest)
          terminate()
        } else {
          setState({ status: "running", latest })
        }
      }
      worker.onerror = (event) => {
        event.preventDefault()
        setState({ status: "error", message: event.message || "Training failed." })
        terminate()
      }
      worker.postMessage(request)
    },
    [terminate]
  )

  const stop = useCallback(() => {
    terminate()
    setState((current) =>
      current.status === "running" ? { status: "stopped", latest: current.latest } : current
    )
  }, [terminate])

  useEffect(() => terminate, [terminate])

  const latest = state.status === "idle" || state.status === "error" ? null : state.latest
  // With reduced motion, keep the last finished result on screen while a new
  // job trains, instead of animating every step.
  const shown = reducedMotion && state.status === "running" ? lastDone : latest
  return { state, latest, shown, start, stop }
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

function subscribeToMotion(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

/** True when the reader asked the system for less motion. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  )
}
