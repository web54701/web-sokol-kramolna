import { useEffect, useState, type ReactNode } from 'react';
import type { ContentObject } from './types';
import { DEFAULT_CONTENT } from './default-content.mjs';
import { ContentContext } from './hooks';

const FETCH_TIMEOUT_MS = 3000;

/** Bundlovaný výchozí obsah jako fallback při nedostupném API / prázdné DB. */
function defaultObjects(): ContentObject[] {
  const sortByZone = new Map<string, number>();
  return DEFAULT_CONTENT.map((seed, i) => {
    const sort = sortByZone.get(seed.zone) ?? 0;
    sortByZone.set(seed.zone, sort + 1);
    return {
      id: -(i + 1),
      zone: seed.zone,
      type: seed.type,
      sort,
      hidden: false,
      visibility: 'all' as const,
      data: seed.data,
    };
  });
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [objects, setObjects] = useState<ContentObject[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/content', { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as ContentObject[];
        if (!cancelled) setObjects(data.length > 0 ? data : defaultObjects());
      } catch {
        if (!cancelled) setObjects(defaultObjects());
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Render čeká na obsah (lokální worker + D1, jednotky ms); fallback po timeoutu.
  if (objects === null) return null;

  return <ContentContext.Provider value={objects}>{children}</ContentContext.Provider>;
}
