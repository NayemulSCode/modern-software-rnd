import "server-only";

export const DEMO_USER_ID = "demo-user";

/**
 * This app has one seeded user and no sign-in. The function is async on
 * purpose: in a real app this is where you would read the session cookie
 * (which is request-time data, so its caller must sit inside <Suspense>).
 * Every query takes `userId` as an argument so it becomes part of the cache key.
 */
export async function getCurrentUserId(): Promise<string> {
  return DEMO_USER_ID;
}
