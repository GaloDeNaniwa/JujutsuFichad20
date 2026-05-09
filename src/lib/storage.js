const KEY = 'fm-character-v1';
export function saveCharacter(character) {
  localStorage.setItem(KEY, JSON.stringify(character));
}
export function loadCharacter() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function clearCharacter() {
  localStorage.removeItem(KEY);
}
export function downloadJson(character) {
  const blob = new Blob([JSON.stringify(character, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${character.identity.name || 'ficha-feiticeiros'}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
