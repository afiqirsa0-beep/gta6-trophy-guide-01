// Progress persistence: earned trophy ids and settings in localStorage; export/import as a JSON file.
const KEY = 'leonida-trophy-log-v1';
export function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s) return { earned: new Set(s.earned ?? []), spoil: !!s.spoil }; } catch {}
  return { earned: new Set(), spoil: false };
}
export function save(state) {
  localStorage.setItem(KEY, JSON.stringify({ earned: [...state.earned], spoil: state.spoil }));
}
export function exportFile(state) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ game: 'GTA VI', earned: [...state.earned], spoil: state.spoil }, null, 1)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
}
// Accepts our export object or a bare array of ids; ignores ids that are not numbers.
export function parseImport(text) {
  const j = JSON.parse(text);
  const ids = Array.isArray(j) ? j : j.earned;
  if (!Array.isArray(ids)) throw new Error('not a progress file');
  return { earned: new Set(ids.filter(Number.isInteger)), spoil: !!j.spoil };
}
