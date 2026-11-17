// Filled once before mounting; no mock fallback when the API is unavailable.
export let COPY: Record<string, Record<string, string>> = {};
export let RECORDS: any[] = [];
export function setContent(data: { settings: typeof COPY; content: any[] }) {
  COPY = data.settings;
  RECORDS = data.content;
}
export const collection = (key: string, featured = false) =>
  RECORDS.filter((r) => r.collection === key && (!featured || r.featured));
