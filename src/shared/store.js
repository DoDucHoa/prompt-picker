/* All storage‑related helpers live here   ----------------------------- */

const KEY = "prompts";

/* --- get --- */
export async function loadPrompts() {
  const { [KEY]: arr } = await chrome.storage.local.get(KEY);
  return Array.isArray(arr) ? arr : [];
}

/* --- set --- */
export async function savePrompts(arr) {
  return chrome.storage.local.set({ [KEY]: arr });
}

/* --- export --- */
export async function exportTxt(arr) {
  const blob = new Blob([arr.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  await chrome.downloads.download({
    url,
    filename: "prompts.txt",
    saveAs: true,
  });
  URL.revokeObjectURL(url);
}
