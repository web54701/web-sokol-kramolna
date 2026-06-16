import { useEffect, useState, type ReactNode } from 'react';
import { apiGet, apiSend } from './api';
import { ContentContext } from '../content/hooks';
import { EditContext, type EditApi } from '../content/edit-context';
import { DEFAULT_CONTENT } from '../content/default-content.mjs';
import type { ContentObject } from '../content/types';

/** Stejný fallback jako veřejný ContentProvider — pro neseedovanou DB. */
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

/**
 * Obsah pro editační plátno: drží objekty ve stavu, vystavuje je přes existující
 * ContentContext (aby useZone/useSingleton fungovaly beze změny) a zároveň přes
 * EditContext nabízí mutátory, které volají API a optimisticky aktualizují stav.
 */
export function EditorProvider({ children }: { children: ReactNode }) {
  const [objects, setObjects] = useState<ContentObject[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<ContentObject[]>('/api/content')
      .then((data) => { if (!cancelled) setObjects(data.length > 0 ? data : defaultObjects()); })
      .catch(() => { if (!cancelled) setObjects(defaultObjects()); });
    return () => { cancelled = true; };
  }, []);

  const patchData = async (id: number, data: Record<string, unknown>) => {
    const obj = objects?.find((o) => o.id === id);
    if (!obj) return;
    if (obj.id < 0) {
      // Fallback objekt — zhmotníme POSTem a převezmeme reálné id.
      const res = await apiSend<{ id: number }>('POST', '/api/admin/content', {
        zone: obj.zone, type: obj.type, data, sort: obj.sort,
      });
      setObjects((prev) => prev?.map((o) => (o.id === id ? { ...o, id: res.id, data } : o)) ?? prev);
    } else {
      await apiSend('PATCH', `/api/admin/content/${id}`, { data });
      setObjects((prev) => prev?.map((o) => (o.id === id ? { ...o, data } : o)) ?? prev);
    }
  };

  const setHidden = async (id: number, hidden: boolean) => {
    const obj = objects?.find((o) => o.id === id);
    if (!obj) return;
    if (obj.id < 0) {
      const res = await apiSend<{ id: number }>('POST', '/api/admin/content', {
        zone: obj.zone, type: obj.type, data: obj.data, sort: obj.sort,
      });
      const realId = res.id;
      await apiSend('PATCH', `/api/admin/content/${realId}`, { hidden });
      setObjects((prev) => prev?.map((o) => (o.id === id ? { ...o, id: realId, hidden } : o)) ?? prev);
    } else {
      await apiSend('PATCH', `/api/admin/content/${id}`, { hidden });
      setObjects((prev) => prev?.map((o) => (o.id === id ? { ...o, hidden } : o)) ?? prev);
    }
  };

  const remove = async (id: number) => {
    if (id >= 0) await apiSend('DELETE', `/api/admin/content/${id}`);
    setObjects((prev) => prev?.filter((o) => o.id !== id) ?? prev);
  };

  const createInZone = async (zone: string, type: string, data: Record<string, unknown>) => {
    const res = await apiSend<{ id: number }>('POST', '/api/admin/content', { zone, type, data });
    const nextSort = Math.max(-1, ...(objects ?? []).filter((o) => o.zone === zone).map((o) => o.sort)) + 1;
    const created: ContentObject = {
      id: res.id, zone, type, sort: nextSort, hidden: false, visibility: 'all', data,
    };
    setObjects((prev) => [...(prev ?? []), created]);
  };

  if (objects === null) return <div className="cms-loading">Načítání…</div>;

  const api: EditApi = { enabled: true, patchData, setHidden, remove, createInZone };

  return (
    <ContentContext.Provider value={objects}>
      <EditContext.Provider value={api}>
        {children}
      </EditContext.Provider>
    </ContentContext.Provider>
  );
}
