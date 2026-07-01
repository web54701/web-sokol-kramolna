import { useEffect, useState } from 'react';
import { apiGet } from './api';
import { BUNDLED_IMAGES, type MediaRow } from './media-api';

/** Dohledá název souboru obrázku podle jeho URL (nahraná média i výchozí obrázky webu). */
export function useMediaFileName(src?: string): string | null {
  // Výchozí obrázky webu poznáme z URL synchronně (bez dotazu na API).
  const bundled = src && BUNDLED_IMAGES.includes(src) ? src.replace(/^\//, '') : null;
  // Název nahraného média se dohledává asynchronně; držíme i src, ke kterému patří.
  const [resolved, setResolved] = useState<{ src: string; name: string | null } | null>(null);

  useEffect(() => {
    if (!src || bundled) return;
    let cancelled = false;
    apiGet<MediaRow[]>('/api/admin/media')
      .then((items) => {
        if (cancelled) return;
        const match = items.find((item) => `/media/${item.key}` === src);
        setResolved({ src, name: match ? match.filename : null });
      })
      .catch(() => { if (!cancelled) setResolved({ src, name: null }); });
    return () => { cancelled = true; };
  }, [src, bundled]);

  if (!src) return null;
  if (bundled) return bundled;
  return resolved && resolved.src === src ? resolved.name : null;
}
