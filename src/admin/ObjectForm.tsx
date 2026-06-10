import { useState } from 'react';
import { IconByName } from '../components/IconByName';
import { TYPES, ICON_OPTIONS, type FieldDef } from './schema';
import type { ContactHoursRow } from '../content/types';

type Props = {
  title: string;
  typeKey: string;
  initial: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
};

export function ObjectForm({ title, typeKey, initial, onSave, onClose }: Props) {
  const def = TYPES[typeKey];
  const [data, setData] = useState<Record<string, unknown>>({ ...def.empty, ...initial });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string, value: unknown) => setData((d) => ({ ...d, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSave(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Uložení se nezdařilo.');
      setBusy(false);
    }
  };

  return (
    <div className="cms-modal-overlay" onClick={onClose}>
      <form className="cms-modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="cms-modal-head">
          <h3>{title}</h3>
          <button type="button" className="cms-modal-close" onClick={onClose} aria-label="Zavřít">✕</button>
        </div>
        <div className="cms-modal-body">
          {def.fields.map((f) => (
            <Field key={f.key} field={f} value={data[f.key]} onChange={(v) => set(f.key, v)} />
          ))}
          {error && <p className="cms-login-error">{error}</p>}
        </div>
        <div className="cms-modal-foot">
          <button type="button" className="cms-btn-secondary" onClick={onClose}>Zrušit</button>
          <button type="submit" className="skp-btn-primary" disabled={busy}>
            {busy ? 'Ukládání…' : 'Uložit'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ field, value, onChange }: {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const id = `cms-f-${field.key}`;

  return (
    <div className="skp-field cms-field">
      <label htmlFor={id}>{field.label}</label>

      {field.widget === 'text' && (
        <input id={id} className="skp-input" type="text"
          value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      )}

      {field.widget === 'multiline' && (
        <textarea id={id} className="skp-input cms-textarea"
          value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      )}

      {field.widget === 'select' && (
        <select id={id} className="skp-input cms-select"
          value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}

      {field.widget === 'image' && (
        <input id={id} className="skp-input" type="text" placeholder="/hero.webp"
          value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      )}

      {field.widget === 'icon' && (
        <div className="cms-icon-grid">
          {ICON_OPTIONS.map((name) => (
            <button key={name} type="button"
              className={'cms-icon-btn' + (value === name ? ' active' : '')}
              onClick={() => onChange(name)} title={name}>
              <IconByName name={name} size={20} />
            </button>
          ))}
        </div>
      )}

      {field.widget === 'lines' && (
        <textarea id={id} className="skp-input cms-textarea"
          value={Array.isArray(value) ? (value as string[]).join('\n') : ''}
          onChange={(e) => onChange(e.target.value.split('\n'))} />
      )}

      {field.widget === 'contact_hours' && (
        <HoursEditor rows={Array.isArray(value) ? value as ContactHoursRow[] : []} onChange={onChange} />
      )}

      {field.help && <p className="cms-field-help">{field.help}</p>}
    </div>
  );
}

function HoursEditor({ rows, onChange }: { rows: ContactHoursRow[]; onChange: (rows: ContactHoursRow[]) => void }) {
  const setRow = (i: number, patch: Partial<ContactHoursRow>) =>
    onChange(rows.map((r, ri) => (ri === i ? { ...r, ...patch } : r)));

  return (
    <div className="cms-hours-editor">
      <div className="cms-hours-row cms-hours-head">
        <span>Dny</span><span>Zkráceně</span><span>Čas</span><span>Víkend</span><span />
      </div>
      {rows.map((r, i) => (
        <div key={i} className="cms-hours-row">
          <input className="skp-input" value={r.days} onChange={(e) => setRow(i, { days: e.target.value })} />
          <input className="skp-input" value={r.daysShort} onChange={(e) => setRow(i, { daysShort: e.target.value })} />
          <input className="skp-input" value={r.time} onChange={(e) => setRow(i, { time: e.target.value })} />
          <input type="checkbox" checked={r.weekend} onChange={(e) => setRow(i, { weekend: e.target.checked })}
            title="Řádek platí pro víkend (zvýraznění aktuálního dne na Kontaktu)" />
          <button type="button" className="cms-row-btn" onClick={() => onChange(rows.filter((_, ri) => ri !== i))} title="Smazat řádek">🗑</button>
        </div>
      ))}
      <button type="button" className="cms-btn-secondary"
        onClick={() => onChange([...rows, { days: '', daysShort: '', time: '', weekend: false }])}>
        + Přidat řádek
      </button>
    </div>
  );
}
