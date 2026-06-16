import { useEffect, useState } from 'react';

/** Zobrazí rozměry obrázku v px (např. „1920 × 823 px"). Sdílené napříč editací obrázků. */
export function ImageDims({ src }: { src?: string }) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => { if (!cancelled) setDims({ w: img.naturalWidth, h: img.naturalHeight }); };
    img.onerror = () => { if (!cancelled) setDims(null); };
    img.src = src;
    return () => { cancelled = true; };
  }, [src]);

  if (!src) return <>bez obrázku</>;
  return <>{dims ? `${dims.w} × ${dims.h} px` : '…'}</>;
}
