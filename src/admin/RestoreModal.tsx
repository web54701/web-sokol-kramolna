import { useState } from 'react';
import { createPortal } from 'react-dom';
import { TYPES } from './schema';

type Props = {
  /** Popisek prvku („O nás · Název stránky"). */
  title: string;
  /** Typ obsahu — kvůli popiskům polí. */
  type: string;
  /** Současný stav prvku. */
  current: Record<string, unknown>;
  /** Stav, do kterého se obnovuje. */
  target: Record<string, unknown>;
  /**
   * Pole, která měnil samotný záznam historie — jen ta se předvyberou.
   * null = záznam pokrývá celý prvek (původní podoba, vytvoření) → předvybrat vše.
   */
  eventKeys: string[] | null;
  busy: boolean;
  /** Potvrzení — dostane výsledná data (současný stav + vybraná pole z cíle). */
  onConfirm: (data: Record<string, unknown>) => void;
  onClose: () => void;
};

function fieldLabel(type: string, key: string): string {
  return TYPES[type]?.fields.find((f) => f.key === key)?.label ?? key;
}

function formatValue(v: unknown): string {
  if (v === undefined || v === null || v === '') return '(prázdné)';
  if (typeof v === 'string') return v;
  return JSON.stringify(v);
}

/**
 * Modál obnovení z historie: vlevo současný stav, vpravo stav po obnovení.
 * Checkboxy lze obnovit jen některá pole — nevybraná zůstanou v současné podobě.
 */
export function RestoreModal({ title, type, current, target, eventKeys, busy, onConfirm, onClose }: Props) {
  const keys = [...new Set([...Object.keys(current), ...Object.keys(target)])]
    .filter((k) => JSON.stringify(current[k]) !== JSON.stringify(target[k]));
  // Předvybrat jen pole měněná tímto záznamem; když žádné nezbývá, tak vše (návrat verze).
  const preselected = eventKeys === null ? keys : keys.filter((k) => eventKeys.includes(k));
  const [selected, setSelected] = useState<Set<string>>(
    new Set(preselected.length > 0 ? preselected : keys),
  );

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const confirm = () => {
    const data = { ...current };
    for (const k of selected) {
      if (target[k] === undefined) delete data[k]; else data[k] = target[k];
    }
    onConfirm(data);
  };

  return createPortal(
    <div className="cms-modal-overlay" onClick={onClose}>
      <div className="cms-modal cms-restore-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cms-modal-head">
          <h3>Obnovit — {title}</h3>
          <button type="button" className="cms-modal-close" onClick={onClose} aria-label="Zavřít">✕</button>
        </div>
        <div className="cms-modal-body">
          <p className="cms-field-help">
            Zaškrtnutá pole se obnoví do podoby vpravo, nezaškrtnutá zůstanou beze změny.
            Předvybrané jsou změny tohoto záznamu; pole se štítkem „změněno později" se
            liší kvůli pozdějším úpravám — zaškrtněte je, chcete-li vrátit celou verzi.
            Současná podoba se uloží do historie, takže se lze vrátit zpět.
          </p>
          <div className="cms-restore-row cms-restore-grid-head">
            <span />
            <span>Pole</span>
            <span>Nyní</span>
            <span />
            <span>Po obnovení</span>
          </div>
          {keys.map((k) => (
            <label key={k} className={'cms-restore-row' + (selected.has(k) ? '' : ' is-off')}>
              <input
                type="checkbox"
                checked={selected.has(k)}
                onChange={() => toggle(k)}
              />
              <span className="cms-restore-field">
                {fieldLabel(type, k)}
                {eventKeys !== null && !eventKeys.includes(k) && (
                  <span className="cms-badge">změněno později</span>
                )}
              </span>
              <span className="cms-restore-val cms-restore-val-now">{formatValue(current[k])}</span>
              <span className="cms-history-arrow">→</span>
              <span className="cms-restore-val cms-restore-val-target">{formatValue(target[k])}</span>
            </label>
          ))}
        </div>
        <div className="cms-modal-foot">
          <button type="button" className="cms-btn-secondary" onClick={onClose}>Zrušit</button>
          <button type="button" className="skp-btn-primary" disabled={busy || selected.size === 0} onClick={confirm}>
            {busy ? 'Obnovuji…' : selected.size === keys.length ? 'Obnovit vše' : `Obnovit vybraná pole (${selected.size})`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
