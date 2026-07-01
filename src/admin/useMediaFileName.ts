import { useEffect, useState } from 'react';
import { apiGet } from './api';
import { BUNDLED_IMAGES, type MediaRow } from './media-api';

/** Dohledá název souboru obrázku podle jeho URL (nahraná média i výchozí obrázky webu). */
export function useMediaFileName(src?: string): string | null {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    setName(null);
    if (!src) return;
    if (BUNDLED_IMAGES.includes(src)) { setName(src.replace(/^\//, '')); return; }
    let cancelled = false;
    apiGet<MediaRow[]>('/api/admin/media')
      .then((items) => {
        if (cancelled) return;
        const match = items.find((item) => `/media/${item.key}` === src);
        setName(match ? match.filename : null);
      })
      .catch(() => { if (!cancelled) setName(null); });
    return () => { cancelled = true; };
  }, [src]);

  return name;
}
