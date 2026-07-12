import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiSend } from './api';
import { SECTIONS, TYPES, previewText } from './schema';
import { RestoreModal } from './RestoreModal';

type RevisionAction = 'update' | 'create' | 'delete' | 'hide' | 'show';

type Revision = {
  id: number;
  objectId: number;
  zone: string;
  type: string;
  action: RevisionAction;
  savedBy: string;
  savedAt: string;
  /** Snímek stavu prvku v okamžiku události (u update stav před úpravou). */
  data: Record<string, unknown>;
  /** null = prvek je smazaný. */
  currentData: Record<string, unknown> | null;
  currentHidden: boolean | null;
};

/** Akce řádku výpisu: navíc syntetická „původní podoba" (stav před prvním záznamem). */
type RowAction = RevisionAction | 'original';

/** Řádek výpisu: revize + dopočítaný stav „po" pro update události. */
type HistoryRow = Omit<Revision, 'action'> & {
  action: RowAction;
  after: Record<string, unknown> | null;
  sortId: number;
};

const ACTION_LABELS: Record<RowAction, string> = {
  update: 'Změněno',
  create: 'Přidáno',
  delete: 'Smazáno',
  hide: 'Skryto',
  show: 'Zobrazeno',
  original: 'Původní podoba',
};

/** Zóna → „Stránka · Sekce" podle registru sekcí (např. „Domů · Akční karty"). */
const ZONE_LABELS: Record<string, string> = {};
for (const section of Object.values(SECTIONS)) {
  for (const z of section.zones) {
    ZONE_LABELS[z.zone] = `${section.title} · ${z.title}`;
  }
}

/** Kategorie filtru: stránky webu + „Ostatní" (globální prvky, e-maily, rezervace). */
const CATEGORIES: { key: string; label: string }[] = [
  { key: 'home', label: 'Domů' },
  { key: 'onas', label: 'O nás' },
  { key: 'tenis', label: 'Tenis' },
  { key: 'gym', label: 'Posilovna' },
  { key: 'kontakt', label: 'Kontakt' },
  { key: 'other', label: 'Ostatní' },
];

const PAGE_PREFIXES = new Set(['home', 'onas', 'tenis', 'gym', 'kontakt']);

function categoryOf(zone: string): string {
  const prefix = zone.split('.')[0];
  return PAGE_PREFIXES.has(prefix) ? prefix : 'other';
}

function zoneLabel(rev: { zone: string; type: string }): string {
  return ZONE_LABELS[rev.zone] ?? TYPES[rev.type]?.label ?? rev.zone;
}

function truncate(s: string, max = 80): string {
  const line = s.split('\n')[0];
  return line.length > max ? line.slice(0, max) + '…' : line;
}

function formatValue(v: unknown): string {
  if (v === undefined || v === null || v === '') return '(prázdné)';
  if (typeof v === 'string') return truncate(v);
  return truncate(JSON.stringify(v));
}

/** Náhled dat objektu — klíčové textové pole, jinak zkrácený JSON. */
function dataPreview(type: string, data: Record<string, unknown>): string {
  const text = previewText(type, data);
  if (text) return truncate(text);
  return truncate(JSON.stringify(data), 120);
}

/** Popisek pole z registru typů; neznámý klíč zůstane surový. */
function fieldLabel(type: string, key: string): string {
  return TYPES[type]?.fields.find((f) => f.key === key)?.label ?? key;
}

/** Klíče, jejichž hodnota se mezi před/po liší. */
function changedKeys(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
}

/**
 * Sestaví řádky výpisu. U update událostí dopočítá stav „po": každá událost nese
 * snímek stavu po předchozí události téhož prvku, takže „po" = snímek nejbližší
 * novější události, u nejnovější události aktuální stav prvku. Historické no-op
 * záznamy (před == po) se vynechají. Pokud ke stavu před nejstarším záznamem
 * prvku žádný řádek nevede, přidá se syntetický řádek „Původní podoba".
 */
function buildRows(revisions: Revision[]): HistoryRow[] {
  const byObject = new Map<number, Revision[]>();
  for (const rev of revisions) {
    const list = byObject.get(rev.objectId);
    if (list) list.push(rev); else byObject.set(rev.objectId, [rev]);
  }

  const rows: HistoryRow[] = [];
  for (const events of byObject.values()) {
    // events: od nejnovější po nejstarší (pořadí z API)
    const targets = new Set<string>();
    for (let i = 0; i < events.length; i++) {
      const rev = events[i];
      if (rev.action === 'update') {
        const after = i > 0 ? events[i - 1].data : rev.currentData;
        if (after === null) continue; // nemělo by nastat — smazání je vždy novější událost
        if (JSON.stringify(rev.data) === JSON.stringify(after)) continue;
        targets.add(JSON.stringify(after));
        rows.push({ ...rev, after, sortId: rev.id });
      } else {
        if (rev.action === 'create' || rev.action === 'delete') targets.add(JSON.stringify(rev.data));
        rows.push({ ...rev, after: null, sortId: rev.id });
      }
    }
    const oldest = events[events.length - 1];
    if (targets.size > 0 && !targets.has(JSON.stringify(oldest.data))) {
      rows.push({
        ...oldest,
        id: -oldest.objectId,
        action: 'original',
        after: null,
        savedBy: '',
        sortId: oldest.id - 0.5,
      });
    }
  }
  return rows.sort((a, b) => b.sortId - a.sortId);
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()} ${d.getHours()}:${pad(d.getMinutes())}`;
}

export function HistoryScreen() {
  const [revisions, setRevisions] = useState<Revision[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('all');
  /** Otevřený modál obnovení: řádek + cílová podoba + pole měněná daným záznamem. */
  const [restoring, setRestoring] = useState<{
    rev: HistoryRow;
    target: Record<string, unknown>;
    eventKeys: string[] | null;
  } | null>(null);

  const reload = useCallback(() => {
    apiGet<Revision[]>('/api/admin/content/revisions')
      .then((data) => { setRevisions(data); setError(null); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Načtení selhalo.'));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const perform = async (rev: { id: number }, fn: () => Promise<unknown>) => {
    setBusyId(rev.id);
    setError(null);
    try {
      await fn();
      reload();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Akce se nezdařila.');
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const run = async (rev: { id: number }, message: string, fn: () => Promise<unknown>) => {
    if (!confirm(message)) return;
    await perform(rev, fn);
  };

  /** Tlačítko akce pro řádek historie. Obnovení vždy míří na podobu, kterou řádek zobrazuje. */
  const actionButton = (rev: HistoryRow) => {
    const busy = busyId !== null;
    const deleted = rev.currentData === null;

    if (rev.action === 'hide' || rev.action === 'show') {
      const targetHidden = rev.action === 'show';
      const label = targetHidden ? 'Znovu skrýt' : 'Znovu zobrazit';
      const disabled = busy || deleted || rev.currentHidden === targetHidden;
      return (
        <button className="cms-btn-secondary" disabled={disabled}
          title={deleted ? 'Prvek už neexistuje.' : rev.currentHidden === targetHidden ? 'Prvek už v tomto stavu je.' : undefined}
          onClick={() => run(rev, `${label}: „${zoneLabel(rev)}"?`,
            () => apiSend('PATCH', `/api/admin/content/${rev.objectId}`, { hidden: targetHidden }))}>
          {busyId === rev.id ? 'Pracuji…' : label}
        </button>
      );
    }

    // Cíl obnovení: u změny podoba PO změně (zeleně zvýrazněná), jinak zobrazený snímek.
    const target = rev.action === 'update' ? rev.after : rev.data;
    if (target === null) return null;

    if (deleted) {
      // Znovuvytvoření smazaného prvku (zařadí se na konec sekce).
      return (
        <button className="cms-btn-secondary" disabled={busy}
          onClick={() => run(rev, `Znovu vytvořit „${zoneLabel(rev)}" v zobrazené podobě?\n\nPrvek se zařadí na konec sekce.`,
            () => apiSend('POST', '/api/admin/content', { zone: rev.zone, type: rev.type, data: target }))}>
          {busyId === rev.id ? 'Obnovuji…' : 'Obnovit smazané'}
        </button>
      );
    }

    if (JSON.stringify(target) === JSON.stringify(rev.currentData)) {
      return <span className="cms-badge">aktuální podoba</span>;
    }

    // U změny se předvyberou jen pole měněná tímto záznamem; create/original mění celý prvek.
    const eventKeys = rev.action === 'update' && rev.after !== null
      ? changedKeys(rev.data, rev.after)
      : null;
    return (
      <button className="cms-btn-secondary" disabled={busy}
        onClick={() => setRestoring({ rev, target, eventKeys })}>
        {busyId === rev.id ? 'Obnovuji…' : 'Obnovit'}
      </button>
    );
  };

  /** Obsahová část řádku: u update diff po polích, jinak náhled snímku. */
  const rowDetail = (rev: HistoryRow) => {
    if (rev.action === 'update' && rev.after !== null) {
      const after = rev.after;
      const keys = changedKeys(rev.data, after);
      return (
        <span className="cms-history-fields">
          {keys.slice(0, 3).map((k) => (
            <span key={k} className="cms-history-diff">
              <span className="cms-history-key">{fieldLabel(rev.type, k)}:</span>
              <span className="cms-history-old">{formatValue(rev.data[k])}</span>
              <span className="cms-history-arrow">→</span>
              <span className="cms-history-new">{formatValue(after[k])}</span>
            </span>
          ))}
          {keys.length > 3 && <span className="cms-user-meta">… a další {keys.length - 3} pole</span>}
        </span>
      );
    }
    return (
      <span className="cms-history-diff">
        <span className="cms-history-old">{dataPreview(rev.type, rev.data)}</span>
      </span>
    );
  };

  if (revisions === null && !error) return <div className="cms-loading">Načítání…</div>;

  const allRows = buildRows(revisions ?? []);
  const countByCategory = new Map<string, number>();
  for (const row of allRows) {
    const cat = categoryOf(row.zone);
    countByCategory.set(cat, (countByCategory.get(cat) ?? 0) + 1);
  }
  const rows = filter === 'all' ? allRows : allRows.filter((r) => categoryOf(r.zone) === filter);

  return (
    <div className="cms-page-editor">
      <h2 className="cms-page-title">Historie změn</h2>
      <p className="cms-history-lead">
        Změny obsahu, přidání, smazání i skrytí prvků napříč celým webem, nejnovější nahoře.
        Tlačítko „Obnovit" vrátí prvek do podoby, kterou řádek zobrazuje — u změn je to nová,
        zeleně podbarvená hodnota. Současná podoba se přitom také uloží do historie, takže
        každý krok lze vzít zpět. U každého prvku se drží nejvýše 20 posledních záznamů.
      </p>

      <div className="cms-history-filter">
        <button
          className={`cms-history-filter-btn${filter === 'all' ? ' active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Vše ({allRows.length})
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`cms-history-filter-btn${filter === c.key ? ' active' : ''}`}
            disabled={!countByCategory.has(c.key)}
            onClick={() => setFilter(c.key)}
          >
            {c.label} ({countByCategory.get(c.key) ?? 0})
          </button>
        ))}
      </div>

      <section className="cms-zone">
        <div className="cms-zone-head"><h3>Záznamy</h3></div>
        {rows.length === 0 ? (
          <p className="cms-history-empty">Zatím žádné záznamy — vzniknou při první úpravě obsahu.</p>
        ) : (
          <div className="cms-zone-list">
            {rows.map((rev) => (
              <div key={rev.id} className="cms-zone-item">
                <div className="cms-zone-item-text">
                  <span className="cms-zone-item-title">
                    {zoneLabel(rev)}
                    <span className={`cms-history-action is-${rev.action}`}>{ACTION_LABELS[rev.action]}</span>
                    {rev.currentData === null && rev.action !== 'delete' && (
                      <span className="cms-badge">prvek už neexistuje</span>
                    )}
                  </span>
                  <span className="cms-user-meta">
                    {rev.action === 'original'
                      ? `stav před ${formatDateTime(rev.savedAt)}`
                      : `${formatDateTime(rev.savedAt)}${rev.savedBy ? ` · ${rev.savedBy}` : ''}`}
                  </span>
                  {rowDetail(rev)}
                </div>
                <div className="cms-zone-item-actions">
                  {actionButton(rev)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {error && <p className="cms-login-error">{error}</p>}

      {restoring && restoring.rev.currentData !== null && (
        <RestoreModal
          title={zoneLabel(restoring.rev)}
          type={restoring.rev.type}
          current={restoring.rev.currentData}
          target={restoring.target}
          eventKeys={restoring.eventKeys}
          busy={busyId !== null}
          onConfirm={async (data) => {
            const ok = await perform(restoring.rev,
              () => apiSend('PATCH', `/api/admin/content/${restoring.rev.objectId}`, { data }));
            if (ok) setRestoring(null);
          }}
          onClose={() => setRestoring(null)}
        />
      )}
    </div>
  );
}
