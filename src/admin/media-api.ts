import { ApiError } from './api';

export type MediaRow = {
  id: number;
  key: string;
  filename: string;
  content_type: string;
  size: number;
  uploaded_by: string;
  created_at: string;
};

/** Obrázky bundlované s webem — nabízejí se vedle nahraných médií. */
export const BUNDLED_IMAGES = ['/hero.webp', '/raketa.webp', '/cinka.webp', '/logo_sokol.png'];

export async function uploadMedia(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/admin/media', { method: 'POST', body: form, credentials: 'same-origin' });
  if (!res.ok) {
    let message = `Chyba ${res.status}`;
    try {
      const data = await res.json() as { error?: string };
      if (data.error) message = data.error;
    } catch { /* odpověď nemusí být JSON */ }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<{ url: string }>;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
