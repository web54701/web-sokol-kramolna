import { useEffect, useRef, useState } from 'react';
import { apiGet } from './api';
import { uploadMedia, BUNDLED_IMAGES, type MediaRow } from './media-api';

type Props = {
  onPick: (url: string) => void;
  onClose: () => void;
};

export function MediaPickerModal({ onPick, onClose }: Props) {
  const [items, setItems] = useState<MediaRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiGet<MediaRow[]>('/api/admin/media')
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Načtení selhalo.'));
  }, []);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
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

  return (
    <div className="cms-modal-overlay" onClick={onClose}>
      <div className="cms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cms-modal-head">
          <h3>Vybrat obrázek</h3>
          <button type="button" className="cms-modal-close" onClick={onClose} aria-label="Zavřít">✕</button>
        </div>
        <div className="cms-modal-body">
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
            {items.map((item) => (
              <button key={item.id} type="button" className="cms-media-item cms-media-pick"
                onClick={() => onPick(`/media/${item.key}`)} title={item.filename}>
                <img src={`/media/${item.key}`} alt={item.filename} loading="lazy" />
              </button>
            ))}
          </div>
          <div className="cms-zone-head"><h3>Výchozí obrázky webu</h3></div>
          <div className="cms-media-grid">
            {BUNDLED_IMAGES.map((url) => (
              <button key={url} type="button" className="cms-media-item cms-media-pick"
                onClick={() => onPick(url)} title={url}>
                <img src={url} alt={url} loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
