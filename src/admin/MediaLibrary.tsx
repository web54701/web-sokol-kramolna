import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet, apiSend } from './api';
import { uploadMedia, formatSize, type MediaRow } from './media-api';

export function MediaLibrary() {
  const [items, setItems] = useState<MediaRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(() => {
    apiGet<MediaRow[]>('/api/admin/media')
      .then((data) => { setItems(data); setError(null); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Načtení selhalo.'));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await uploadMedia(file);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nahrání selhalo.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: MediaRow) => {
    if (!confirm(`Opravdu smazat „${item.filename}"? Pokud je obrázek použitý na webu, přestane se zobrazovat.`)) return;
    try {
      await apiSend('DELETE', `/api/admin/media/${item.id}`);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Smazání selhalo.');
    }
  };

  const copyUrl = (item: MediaRow) => {
    navigator.clipboard?.writeText(`/media/${item.key}`).catch(() => {});
  };

  if (items === null && !error) return <div className="cms-loading">Načítání…</div>;

  return (
    <div className="cms-page-editor">
      <h2 className="cms-page-title">Knihovna médií</h2>

      <section className="cms-zone">
        <div className="cms-zone-head">
          <h3>Nahrané obrázky</h3>
          <button className="cms-btn-secondary" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? 'Nahrávání…' : '+ Nahrát obrázek'}
          </button>
          <input ref={fileRef} type="file" accept="image/webp,image/png,image/jpeg,image/svg+xml"
            style={{ display: 'none' }} onChange={onUpload} />
        </div>

        {error && <p className="cms-login-error">{error}</p>}

        {items && items.length === 0 && <p className="cms-zone-preview">Zatím žádné nahrané obrázky.</p>}

        <div className="cms-media-grid">
          {items?.map((item) => (
            <figure key={item.id} className="cms-media-item">
              <img src={`/media/${item.key}`} alt={item.filename} loading="lazy" />
              <figcaption>
                <span className="cms-media-name" title={item.filename}>{item.filename}</span>
                <span className="cms-media-meta">{formatSize(item.size)}</span>
              </figcaption>
              <div className="cms-media-actions">
                <button className="cms-row-btn" title="Zkopírovat URL" onClick={() => copyUrl(item)}>⧉</button>
                <button className="cms-row-btn" title="Smazat" onClick={() => remove(item)}>🗑</button>
              </div>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
