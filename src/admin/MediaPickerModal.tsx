import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiGet } from './api';
import { uploadMedia, BUNDLED_IMAGES, type MediaRow } from './media-api';
import { ImageDims } from './ImageDims';
import type { ImageSpec } from '../content/image-specs';

type Props = {
  onPick: (url: string) => void;
  onClose: () => void;
  /** Je-li zadáno, po výběru zdroje následuje krok převodu na cílovou velikost. */
  spec?: ImageSpec;
  /** Aktuální obrázek — zobrazí se jeho rozměry v px. */
  current?: string;
};

const MIN_PX = 16;
const MAX_PX = 4096;

function clampPx(n: number): number {
  if (!Number.isFinite(n)) return MIN_PX;
  return Math.min(MAX_PX, Math.max(MIN_PX, Math.round(n)));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Obrázek se nepodařilo načíst.'));
    img.src = src;
  });
}

export function MediaPickerModal({ onPick, onClose, spec, current }: Props) {
  const [items, setItems] = useState<MediaRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Krok převodu velikosti (jen když je zadán `spec`).
  const [source, setSource] = useState<string | null>(null);
  const [srcRatio, setSrcRatio] = useState(1);   // poměr stran zdroje (š/v)
  const [ready, setReady] = useState(false);     // rozměry zdroje načteny
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    apiGet<MediaRow[]>('/api/admin/media')
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Načtení selhalo.'));
  }, []);

  // Po výběru zdroje načteme jeho rozměry a přednastavíme cílovou velikost.
  useEffect(() => {
    if (!source || !spec) return;
    let cancelled = false;
    loadImage(source)
      .then((img) => {
        if (cancelled) return;
        const nw = img.naturalWidth || 1;
        const nh = img.naturalHeight || 1;
        const ratio = nw / nh;
        setSrcRatio(ratio);
        // Cílová ŠÍŘKA = zobrazovací šířka prvku, ale obrázek NIKDY nezvětšujeme nad jeho
        // nativní šířku (zvětšování jen rozmazává) → menší zdroj zůstane beze změny.
        const targetW = Math.min(spec.maxWidth, nw);
        setWidth(clampPx(targetW));
        setHeight(clampPx(targetW / ratio));
        setReady(true);
      })
      .catch(() => { if (!cancelled) setError('Obrázek se nepodařilo načíst.'); });
    return () => { cancelled = true; };
  }, [source, spec]);

  // Výběr zdroje: se `spec` přejde na krok velikosti, jinak rovnou použije.
  const choose = (url: string) => {
    if (spec) { setReady(false); setSource(url); setError(null); }
    else onPick(url);
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (spec) {
      // Originál nenahráváme — převede a nahraje se až výsledek.
      setReady(false);
      setSource(URL.createObjectURL(file));
      setError(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { url } = await uploadMedia(file);
      onPick(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nahrání selhalo.');
      setBusy(false);
    }
  };

  // Poměr stran zdroje je uzamčen → změna jednoho rozměru dopočítá druhý.
  const setW = (v: number) => { const w = clampPx(v); setWidth(w); setHeight(clampPx(w / srcRatio)); };
  const setH = (v: number) => { const h = clampPx(v); setHeight(h); setWidth(clampPx(h * srcRatio)); };

  const useResized = async () => {
    if (!spec || !source) return;
    setConverting(true);
    setError(null);
    try {
      const img = await loadImage(source);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      // Výstupní poměr = poměr zdroje → obrázek vyplní plátno bez ořezu a deformace.
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', 0.9));
      if (!blob) throw new Error('Převod obrázku selhal.');
      const { url } = await uploadMedia(new File([blob], `obrazek-${width}x${height}.webp`, { type: 'image/webp' }));
      onPick(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Převod selhal.');
      setConverting(false);
    }
  };

  // Náhled v knihovně: rozměry v px vlevo nahoře, název souboru vpravo dole.
  const thumb = (url: string, filename: string) => (
    <button key={url} type="button" className="cms-media-item cms-media-pick"
      onClick={() => choose(url)} title={filename}>
      <img src={url} alt={filename} loading="lazy" />
      <span className="sk-thumb-dims"><ImageDims src={url} /></span>
      <span className="sk-thumb-name">{filename}</span>
    </button>
  );

  return createPortal(
    <div className="cms-modal-overlay" onClick={onClose}>
      <div className="cms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cms-modal-head">
          <h3>{source ? 'Upravit velikost' : 'Vybrat obrázek'}</h3>
          <button type="button" className="cms-modal-close" onClick={onClose} aria-label="Zavřít">✕</button>
        </div>

        {source && spec ? (
          <>
            <div className="cms-modal-body">
              <p className="cms-aspect-hint">{spec.hint}</p>
              <div className="sk-resize-preview">
                <img src={source} alt="" />
              </div>
              {ready ? (
                <>
                  <div className="sk-resize-dims">
                    <label>
                      Šířka (px)
                      <input type="number" min={MIN_PX} max={MAX_PX} value={width}
                        onChange={(e) => setW(Number(e.target.value))} className="skp-input" />
                    </label>
                    <span className="sk-resize-lock" title="Poměr stran je uzamčen">🔒</span>
                    <label>
                      Výška (px)
                      <input type="number" min={MIN_PX} max={MAX_PX} value={height}
                        onChange={(e) => setH(Number(e.target.value))} className="skp-input" />
                    </label>
                  </div>
                  <p className="cms-field-help">Poměr stran vybraného obrázku je uzamčen — změna jednoho rozměru dopočítá druhý.</p>
                </>
              ) : (
                <p className="cms-field-help">Načítání rozměrů obrázku…</p>
              )}
              {error && <p className="cms-login-error">{error}</p>}
            </div>
            <div className="cms-modal-foot">
              <button type="button" className="cms-btn-secondary" disabled={converting} onClick={() => setSource(null)}>← Zpět</button>
              <button type="button" className="skp-btn-primary" disabled={converting || !ready} onClick={useResized}>
                {converting ? 'Převádím…' : 'Použít'}
              </button>
            </div>
          </>
        ) : (
          <div className="cms-modal-body">
            {spec && <p className="cms-aspect-hint">{spec.hint}</p>}
            {current && <p className="cms-field-help">Aktuální obrázek: <ImageDims src={current} /></p>}
            <div className="cms-zone-head">
              <h3>Nahraná média</h3>
              <button type="button" className="cms-btn-secondary" disabled={busy} onClick={() => fileRef.current?.click()}>
                {busy ? 'Nahrávání…' : '+ Nahrát nový'}
              </button>
              <input ref={fileRef} type="file" accept="image/webp,image/png,image/jpeg,image/svg+xml"
                style={{ display: 'none' }} onChange={onUpload} />
            </div>
            {error && <p className="cms-login-error">{error}</p>}
            <div className="cms-media-grid">
              {items.map((item) => thumb(`/media/${item.key}`, item.filename))}
            </div>
            <div className="cms-zone-head"><h3>Výchozí obrázky webu</h3></div>
            <div className="cms-media-grid">
              {BUNDLED_IMAGES.map((url) => thumb(url, url.replace(/^\//, '')))}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
