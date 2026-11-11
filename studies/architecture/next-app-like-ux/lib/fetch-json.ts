/**
 * The fetcher SWR uses. `fetch` only rejects on network failure, so a 404 or
 * 500 has to be turned into an error by hand or SWR would treat it as data.
 */
export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}
