export const BACKEND_INTERNAL_URL =
  process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";

export async function fetchSiteData() {
  const isServer = typeof window === "undefined";
  const url = isServer
    ? `${BACKEND_INTERNAL_URL}/api/public/site`
    : "/api/public/site";

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch site data: ${res.status}`);
  }

  return res.json();
}
