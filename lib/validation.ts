export function validateIsraeliId(id: string): boolean {
  const cleaned = id.replace(/\D/g, '');
  if (cleaned.length !== 9) return false;
  const padded = cleaned.padStart(9, '0');
  let total = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(padded[i], 10) * ((i % 2) + 1);
    if (digit > 9) digit -= 9;
    total += digit;
  }
  return total % 10 === 0;
}

export function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calcDuration(entry: string, exit: string): string {
  const [eh, em] = entry.split(':').map(Number);
  const [xh, xm] = exit.split(':').map(Number);
  let mins = (xh * 60 + xm) - (eh * 60 + em);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}ש ${m}ד` : `${m}ד`;
}
