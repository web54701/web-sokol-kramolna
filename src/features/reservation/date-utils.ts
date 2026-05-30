export const DOW = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
export const DAY_MS = 86400000;
export const epochDay = (d: Date): number => Math.floor(d.getTime() / DAY_MS);
export const fmtDM = (d: Date): string => `${d.getDate()}. ${d.getMonth() + 1}.`;
export const fmtDMY = (d: Date): string => `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
export const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export function seed(dayNo: number, h: number): number {
  const x = Math.sin(dayNo * 37.13 + h * 91.7 + 4.2) * 10000;
  return x - Math.floor(x);
}

export function weekStart(now: Date, offset: number): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() + offset * 7);
  return d;
}
