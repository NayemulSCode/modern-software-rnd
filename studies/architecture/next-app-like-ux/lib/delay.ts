import "server-only";

const DEFAULT_DELAY_MS = 900;

function configuredDelay(): number {
  const parsed = Number(process.env.DEMO_DELAY_MS ?? DEFAULT_DELAY_MS);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_DELAY_MS;
}

/**
 * Pretends the database is slow. A local SQLite file answers in under a
 * millisecond, which would hide every loading state this app exists to teach.
 * `factor` lets one read be slower than another (see the track page).
 */
export async function simulateLatency(factor = 1): Promise<void> {
  const ms = configuredDelay() * factor;
  if (ms === 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}
