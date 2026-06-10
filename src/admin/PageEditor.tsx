import { useCallback, useEffect, useState } from 'react';
import { apiGet } from './api';
import { ZoneList } from './ZoneList';
import { SECTIONS } from './schema';
import type { ContentObject } from '../content/types';

export function PageEditor({ sectionKey }: { sectionKey: string }) {
  const section = SECTIONS[sectionKey];
  const [objects, setObjects] = useState<ContentObject[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    apiGet<ContentObject[]>('/api/content')
      .then((data) => { setObjects(data); setError(null); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Načtení obsahu selhalo.'));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  if (!section) return null;
  if (error) return <p className="cms-zone-preview">{error}</p>;
  if (objects === null) return <div className="cms-loading">Načítání…</div>;

  return (
    <div className="cms-page-editor">
      <h2 className="cms-page-title">{section.title}</h2>
      {section.zones.map((def) => (
        <ZoneList
          key={def.zone}
          def={def}
          objects={objects
            .filter((o) => o.zone === def.zone)
            .sort((a, b) => a.sort - b.sort)}
          onChanged={reload}
        />
      ))}
    </div>
  );
}
