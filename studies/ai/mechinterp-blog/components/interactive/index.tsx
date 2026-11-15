"use client"

// The demos as MDX sees them. Each one is a placeholder until it scrolls near
// the viewport; only then is its code downloaded. The post itself is static
// HTML and reads completely without any of this JavaScript.

import dynamic from "next/dynamic"
import { type ComponentType, type ReactNode, useEffect, useRef, useState } from "react"

import { DemoFrame } from "./demo-frame"

function Loading({ minHeight }: { minHeight: number }) {
  return (
    <p className="text-sm text-muted" style={{ minHeight: minHeight - 120 }}>
      Loading the demo…
    </p>
  )
}

/** Renders `children` once the box is within 400px of the viewport. */
function WhenNearViewport({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isNear, setIsNear] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsNear(true)
          observer.disconnect()
        }
      },
      { rootMargin: "400px 0px" }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return <div ref={ref}>{isNear ? children : fallback}</div>
}

function lazyDemo(
  load: () => Promise<{ default: ComponentType }>,
  frame: { title: string; description: string; minHeight: number }
) {
  const Demo = dynamic(load, { ssr: false, loading: () => <Loading minHeight={frame.minHeight} /> })
  function LazyDemo() {
    return (
      <DemoFrame {...frame}>
        <WhenNearViewport fallback={<Loading minHeight={frame.minHeight} />}>
          <Demo />
        </WhenNearViewport>
      </DemoFrame>
    )
  }
  return LazyDemo
}

export const SuperpositionDemo = lazyDemo(() => import("./superposition-demo"), {
  title: "Five features, two dimensions",
  description:
    "A tiny model learns to squeeze 5 features into 2 numbers and get them back. Move the slider to make features rarer and watch what it does with the space.",
  minHeight: 640,
})

export const SaeDemo = lazyDemo(() => import("./sae-demo"), {
  title: "Pulling the features back out",
  description:
    "A sparse autoencoder sees only the 2-dimensional activations and tries to find the 5 features hidden in them. The penalty λ decides how much it values using few latents.",
  minHeight: 720,
})

export const InductionDemo = lazyDemo(() => import("./induction-demo"), {
  title: "Break the induction circuit",
  description:
    "A two-layer transformer with hand-written weights. Give it a sequence with a repeat, then switch off or swap one head and see whether the prediction survives.",
  minHeight: 900,
})
