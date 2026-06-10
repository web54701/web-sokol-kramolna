import { useState } from 'react';
import { apiSend } from './api';
import { ObjectForm } from './ObjectForm';
import { TYPES, previewText, type ZoneDef } from './schema';
import type { ContentObject, Visibility } from '../content/types';

type Props = {
  def: ZoneDef;
  objects: ContentObject[];   // objekty zóny vč. skrytých, seřazené dle sort
  onChanged: () => void;
};

const VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: 'all', label: 'Všude' },
  { value: 'desktop', label: 'Jen desktop' },
  { value: 'mobile', label: 'Jen mobil' },
];

export function ZoneList({ def, objects, onChanged }: Props) {
  const [editing, setEditing] = useState<ContentObject | null>(null);
  const [adding, setAdding] = useState(false);
  const typeDef = TYPES[def.type];

  const saveEdit = async (data: Record<string, unknown>) => {
    if (!editing) return;
    await apiSend('PATCH', `/api/admin/content/${editing.id}`, { data });
    onChanged();
  };

  const saveNew = async (data: Record<string, unknown>) => {
    await apiSend('POST', '/api/admin/content', { zone: def.zone, type: def.type, data });
    onChanged();
  };

  const move = async (index: number, delta: -1 | 1) => {
    const ids = objects.map((o) => o.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await apiSend('PUT', '/api/admin/content/reorder', { zone: def.zone, ids });
    onChanged();
  };

  const toggleHidden = async (obj: ContentObject) => {
    await apiSend('PATCH', `/api/admin/content/${obj.id}`, { hidden: !obj.hidden });
    onChanged();
  };

  const setVisibility = async (obj: ContentObject, visibility: string) => {
    await apiSend('PATCH', `/api/admin/content/${obj.id}`, { visibility });
    onChanged();
  };

  const remove = async (obj: ContentObject) => {
    const label = previewText(obj.type, obj.data) || typeDef.label;
    if (!confirm(`Opravdu smazat „${label}"?`)) return;
    await apiSend('DELETE', `/api/admin/content/${obj.id}`);
    onChanged();
  };

  // Singleton: jen náhled + tlačítko Upravit
  if (!def.repeatable) {
    const obj = objects[0] ?? null;
    return (
      <section className="cms-zone">
        <div className="cms-zone-head">
          <h3>{def.title}</h3>
          {obj && (
            <button className="cms-btn-secondary" onClick={() => setEditing(obj)}>Upravit</button>
          )}
        </div>
        {obj
          ? <p className="cms-zone-preview">{previewText(obj.type, obj.data) || '—'}</p>
          : <p className="cms-zone-preview">Objekt chybí v databázi.</p>}
        {editing && (
          <ObjectForm
            title={def.title}
            typeKey={def.type}
            initial={editing.data}
            onSave={saveEdit}
            onClose={() => setEditing(null)}
          />
        )}
      </section>
    );
  }

  return (
    <section className="cms-zone">
      <div className="cms-zone-head">
        <h3>{def.title}</h3>
        <button className="cms-btn-secondary" onClick={() => setAdding(true)}>+ Přidat</button>
      </div>

      <div className="cms-zone-list">
        {objects.map((obj, i) => (
          <div key={obj.id} className={'cms-zone-item' + (obj.hidden ? ' is-hidden' : '')}>
            <div className="cms-zone-item-text">
              <span className="cms-zone-item-title">{previewText(obj.type, obj.data) || typeDef.label}</span>
              {obj.hidden && <span className="cms-badge">skryto</span>}
            </div>
            <div className="cms-zone-item-actions">
              <select
                className="cms-vis-select"
                value={obj.visibility}
                onChange={(e) => setVisibility(obj, e.target.value)}
                title="Kde se objekt zobrazuje"
              >
                {VISIBILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button className="cms-row-btn" onClick={() => move(i, -1)} disabled={i === 0} title="Posunout výš">↑</button>
              <button className="cms-row-btn" onClick={() => move(i, 1)} disabled={i === objects.length - 1} title="Posunout níž">↓</button>
              <button className="cms-row-btn" onClick={() => toggleHidden(obj)} title={obj.hidden ? 'Zobrazit' : 'Skrýt'}>
                {obj.hidden ? '🚫' : '👁'}
              </button>
              <button className="cms-row-btn" onClick={() => setEditing(obj)} title="Upravit">✏</button>
              <button className="cms-row-btn" onClick={() => remove(obj)} title="Smazat">🗑</button>
            </div>
          </div>
        ))}
        {objects.length === 0 && <p className="cms-zone-preview">Zóna je prázdná.</p>}
      </div>

      {editing && (
        <ObjectForm
          title={`${def.title} — upravit`}
          typeKey={def.type}
          initial={editing.data}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
        />
      )}
      {adding && (
        <ObjectForm
          title={`${def.title} — přidat`}
          typeKey={def.type}
          initial={{}}
          onSave={saveNew}
          onClose={() => setAdding(false)}
        />
      )}
    </section>
  );
}
