import { Icon } from '../components/Icon';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ReservationFlow } from '../features/reservation/ReservationFlow';
import { AdminView } from '../features/reservation/AdminView';
import { useZoneAll, useSingletonObject, visibilityClass, type ZoneObject } from '../content/hooks';
import { useEdit } from '../content/edit-context';
import { EditableText, RowActions, AddRowSlot } from '../content/editable';
import type { PageheadData, ActivityMetaData, StatData, RuleData, HoursRowData, PriceRowData } from '../content/types';
import type { Route, ActivityMode } from '../types';

type Props = {
  mode: ActivityMode;
  tab: string;
  setTab: (tab: string) => void;
  onNavigate: (route: Route) => void;
  isAdmin?: boolean;
  onAdminActivate?: () => void;
};

const EMPTY_META: ActivityMetaData = {
  resvTab: 'Rezervace', heroEyebrow: '', heroTitle: '', heroText: '',
  ctaLabel: '', hoursNote: '', priceNoteTitle: '', priceNote: '',
};

export function ActivityPage({ mode, tab, setTab, onNavigate, isAdmin, onAdminActivate }: Props) {
  const edit = useEdit();
  const head = useSingletonObject<PageheadData>(`${mode}.head`);
  const metaObj = useSingletonObject<ActivityMetaData>(`${mode}.meta`);
  const meta = metaObj?.data ?? EMPTY_META;
  const tabs = ['Přehled', 'Ceník', meta.resvTab, ...(isAdmin ? ['Správa'] : [])];

  const saveHead = (patch: Partial<PageheadData>) => {
    if (head) void edit.patchData(head.id, { ...head.data, ...patch });
  };
  const saveMeta = (patch: Partial<ActivityMetaData>) => {
    if (metaObj) void edit.patchData(metaObj.id, { ...metaObj.data, ...patch });
  };

  return (
    <div className="sk-page skp-page">
      <Header active={mode} onNavigate={onNavigate} isAdmin={isAdmin} onAdminActivate={onAdminActivate} />

      <div className="sk-pagewrap">
        <div className="sk-pagehead">
          <div className="sk-pagehead-l">
            <EditableText as="h1" value={head?.data.title ?? ''} onSave={(t) => saveHead({ title: t })} />
            <EditableText as="p" multiline value={head?.data.intro ?? ''} onSave={(t) => saveHead({ intro: t })} />
          </div>
          <nav className="sk-subnav">
            {tabs.map((t) => (
              <a key={t} className={t === tab ? 'is-active' : ''} onClick={() => setTab(t)}>{t}</a>
            ))}
          </nav>
        </div>

        {tab === 'Přehled' && <ActivityOverview mode={mode} meta={meta} saveMeta={saveMeta} onReserve={() => setTab(meta.resvTab)} />}
        {tab === 'Ceník' && <ActivityPricing mode={mode} meta={meta} saveMeta={saveMeta} onReserve={() => setTab(meta.resvTab)} />}
        {tab === meta.resvTab && <ReservationFlow mode={mode} onGoOverview={() => setTab('Přehled')} />}
        {tab === 'Správa' && <AdminView mode={mode} />}
      </div>

      <Footer />
    </div>
  );
}

type SectionProps = {
  mode: ActivityMode;
  meta: ActivityMetaData;
  saveMeta: (patch: Partial<ActivityMetaData>) => void;
  onReserve: () => void;
};

function ActivityOverview({ mode, meta, saveMeta, onReserve }: SectionProps) {
  const edit = useEdit();
  const allStats = useZoneAll<StatData>(`${mode}.stats`);
  const allRules = useZoneAll<RuleData>(`${mode}.rules`);
  const allHours = useZoneAll<HoursRowData>(`${mode}.hours`);
  const stats = edit.enabled ? allStats : allStats.filter((s) => !s.hidden);
  const rules = edit.enabled ? allRules : allRules.filter((r) => !r.hidden);
  const hours = edit.enabled ? allHours : allHours.filter((h) => !h.hidden);

  return (
    <div className="skp-scroll">
      <div className="skp-overview">
        <div className="skp-hero-card">
          <EditableText as="span" className="eyebrow" value={meta.heroEyebrow} onSave={(t) => saveMeta({ heroEyebrow: t })} />
          <EditableText as="h2" value={meta.heroTitle} onSave={(t) => saveMeta({ heroTitle: t })} />
          <EditableText as="p" multiline value={meta.heroText} onSave={(t) => saveMeta({ heroText: t })} />
          <div className="skp-hero-stats">
            {stats.map((s) => (
              <div key={s.id} className={'s sk-ed-row' + visibilityClass(s.visibility) + (s.hidden ? ' sk-ed-hidden' : '')}>
                <EditableText as="div" className="v" value={s.data.v} onSave={(t) => void edit.patchData(s.id, { ...s.data, v: t })} />
                <EditableText as="div" className="k" value={s.data.k} onSave={(t) => void edit.patchData(s.id, { ...s.data, k: t })} />
                <RowActions
                  hidden={s.hidden}
                  onToggleHidden={() => void edit.setHidden(s.id, !s.hidden)}
                  onDelete={() => { if (window.confirm('Opravdu smazat statistiku?')) void edit.remove(s.id); }}
                />
              </div>
            ))}
          </div>
          <AddRowSlot
            label="Přidat statistiku"
            onClick={() => void edit.createInZone(`${mode}.stats`, 'stat', { v: '', k: '' })}
          />
          <button className="skp-hero-cta" onClick={edit.enabled ? undefined : onReserve}>
            <EditableText as="span" value={meta.ctaLabel} onSave={(t) => saveMeta({ ctaLabel: t })} /> <Icon.arrowR size={18} />
          </button>
        </div>

        <div className="skp-side">
          <section className="sk-panel">
            <h3>Pravidla rezervace</h3>
            <ul className="sk-rules">
              {rules.map((r) => (
                <li key={r.id} className={'sk-ed-row' + visibilityClass(r.visibility) + (r.hidden ? ' sk-ed-hidden' : '')}>
                  <EditableText as="span" multiline value={r.data.text} onSave={(t) => void edit.patchData(r.id, { text: t })} />
                  <RowActions
                    hidden={r.hidden}
                    onToggleHidden={() => void edit.setHidden(r.id, !r.hidden)}
                    onDelete={() => { if (window.confirm('Opravdu smazat pravidlo?')) void edit.remove(r.id); }}
                  />
                </li>
              ))}
            </ul>
            <AddRowSlot
              label="Přidat pravidlo"
              onClick={() => void edit.createInZone(`${mode}.rules`, 'rule', { text: 'Nové pravidlo' })}
            />
          </section>
          <section className="sk-panel sk-hours">
            <h3>Otevírací doba</h3>
            {hours.map((h) => (
              <div key={h.id} className={'row sk-ed-row' + visibilityClass(h.visibility) + (h.hidden ? ' sk-ed-hidden' : '')}>
                <EditableText as="span" className="d" value={h.data.days} onSave={(t) => void edit.patchData(h.id, { ...h.data, days: t })} />
                <EditableText as="span" value={h.data.time} onSave={(t) => void edit.patchData(h.id, { ...h.data, time: t })} />
                <RowActions
                  hidden={h.hidden}
                  onToggleHidden={() => void edit.setHidden(h.id, !h.hidden)}
                  onDelete={() => { if (window.confirm('Opravdu smazat řádek otevírací doby?')) void edit.remove(h.id); }}
                />
              </div>
            ))}
            <AddRowSlot
              label="Přidat řádek"
              onClick={() => void edit.createInZone(`${mode}.hours`, 'hours_row', { days: '', time: '' })}
            />
            <EditableText as="p" multiline className="note" value={meta.hoursNote} onSave={(t) => saveMeta({ hoursNote: t })} />
          </section>
        </div>
      </div>
    </div>
  );
}

function ActivityPricing({ mode, meta, saveMeta, onReserve }: SectionProps) {
  const edit = useEdit();
  const allPriceRows = useZoneAll<PriceRowData>(`${mode}.price`);
  const priceRows = edit.enabled ? allPriceRows : allPriceRows.filter((r) => !r.hidden);

  return (
    <div className="skp-scroll">
      <div className="skp-cenik-grid">
        <section className="sk-panel">
          <h3>Ceník</h3>
          <div className="sk-pricelist skp-price-big">
            <div className="row head"><span>Položka</span><span>Cena</span></div>
            {priceRows.map((r: ZoneObject<PriceRowData>, i: number) => (
              <div
                key={r.id}
                className={'row sk-ed-row' + visibilityClass(r.visibility) + (r.hidden ? ' sk-ed-hidden' : '')}
                style={i === priceRows.length - 1 ? { borderBottom: 0 } : undefined}
              >
                <span className="lbl">
                  <EditableText as="span" value={r.data.lbl} onSave={(t) => void edit.patchData(r.id, { ...r.data, lbl: t })} />{' '}
                  <EditableText as="em" value={r.data.sub} onSave={(t) => void edit.patchData(r.id, { ...r.data, sub: t })} />
                </span>
                <EditableText as="span" className="val" value={r.data.val} onSave={(t) => void edit.patchData(r.id, { ...r.data, val: t })} />
                <RowActions
                  hidden={r.hidden}
                  onToggleHidden={() => void edit.setHidden(r.id, !r.hidden)}
                  onDelete={() => { if (window.confirm('Opravdu smazat řádek ceníku?')) void edit.remove(r.id); }}
                />
              </div>
            ))}
          </div>
          <AddRowSlot
            label="Přidat řádek ceníku"
            onClick={() => void edit.createInZone(`${mode}.price`, 'price_row', { lbl: 'Nová položka', sub: '', val: '' })}
          />
        </section>

        <div className="skp-side">
          <div className="skp-note-card">
            <EditableText as="h4" value={meta.priceNoteTitle} onSave={(t) => saveMeta({ priceNoteTitle: t })} />
            <EditableText as="div" multiline value={meta.priceNote} onSave={(t) => saveMeta({ priceNote: t })} />
          </div>
          <section className="sk-panel" style={{ background: 'var(--sk-green-800)', color: 'var(--sk-cream-50)', border: 'none', marginTop: 16 }}>
            <h3 style={{ color: 'var(--sk-cream-50)' }}>Rezervovat hned</h3>
            <p style={{ fontSize: 14, opacity: 0.88, lineHeight: 1.5, margin: '4px 0 16px' }}>
              Vyberte termín, vyplňte kontakt a potvrzovací kód vám dorazí na e-mail.
            </p>
            <button className="skp-btn-primary" style={{ background: 'var(--sk-rust)', width: '100%' }} onClick={edit.enabled ? undefined : onReserve}>
              {meta.ctaLabel}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
