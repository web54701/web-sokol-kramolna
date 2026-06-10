import { Icon } from '../components/Icon';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ReservationFlow } from '../features/reservation/ReservationFlow';
import { AdminView } from '../features/reservation/AdminView';
import { useZone, useSingleton, visibilityClass, type ZoneObject } from '../content/hooks';
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
  const head = useSingleton<PageheadData>(`${mode}.head`);
  const meta = useSingleton<ActivityMetaData>(`${mode}.meta`) ?? EMPTY_META;
  const tabs = ['Přehled', 'Ceník', meta.resvTab, ...(isAdmin ? ['Správa'] : [])];

  return (
    <div className="sk-page skp-page">
      <Header active={mode} onNavigate={onNavigate} isAdmin={isAdmin} onAdminActivate={onAdminActivate} />

      <div className="sk-pagewrap">
        <div className="sk-pagehead">
          <div className="sk-pagehead-l">
            <h1>{head?.title}</h1>
            <p>{head?.intro}</p>
          </div>
          <nav className="sk-subnav">
            {tabs.map((t) => (
              <a key={t} className={t === tab ? 'is-active' : ''} onClick={() => setTab(t)}>{t}</a>
            ))}
          </nav>
        </div>

        {tab === 'Přehled' && <ActivityOverview mode={mode} meta={meta} onReserve={() => setTab(meta.resvTab)} />}
        {tab === 'Ceník' && <ActivityPricing mode={mode} meta={meta} onReserve={() => setTab(meta.resvTab)} />}
        {tab === meta.resvTab && <ReservationFlow mode={mode} onGoOverview={() => setTab('Přehled')} />}
        {tab === 'Správa' && <AdminView mode={mode} />}
      </div>

      <Footer />
    </div>
  );
}

type SectionProps = { mode: ActivityMode; meta: ActivityMetaData; onReserve: () => void };

function ActivityOverview({ mode, meta, onReserve }: SectionProps) {
  const stats = useZone<StatData>(`${mode}.stats`);
  const rules = useZone<RuleData>(`${mode}.rules`);
  const hours = useZone<HoursRowData>(`${mode}.hours`);

  return (
    <div className="skp-scroll">
      <div className="skp-overview">
        <div className="skp-hero-card">
          <span className="eyebrow">{meta.heroEyebrow}</span>
          <h2>{meta.heroTitle}</h2>
          <p>{meta.heroText}</p>
          <div className="skp-hero-stats">
            {stats.map((s) => (
              <div key={s.id} className={'s' + visibilityClass(s.visibility)}>
                <div className="v">{s.data.v}</div><div className="k">{s.data.k}</div>
              </div>
            ))}
          </div>
          <button className="skp-hero-cta" onClick={onReserve}>{meta.ctaLabel} <Icon.arrowR size={18} /></button>
        </div>

        <div className="skp-side">
          <section className="sk-panel">
            <h3>Pravidla rezervace</h3>
            <ul className="sk-rules">
              {rules.map((r) => (
                <li key={r.id} className={visibilityClass(r.visibility).trim() || undefined}>{r.data.text}</li>
              ))}
            </ul>
          </section>
          <section className="sk-panel sk-hours">
            <h3>Otevírací doba</h3>
            {hours.map((h) => (
              <div key={h.id} className={'row' + visibilityClass(h.visibility)}>
                <span className="d">{h.data.days}</span><span>{h.data.time}</span>
              </div>
            ))}
            <p className="note">{meta.hoursNote}</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function ActivityPricing({ mode, meta, onReserve }: SectionProps) {
  const priceRows = useZone<PriceRowData>(`${mode}.price`);

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
                className={'row' + visibilityClass(r.visibility)}
                style={i === priceRows.length - 1 ? { borderBottom: 0 } : undefined}
              >
                <span className="lbl">{r.data.lbl} <em>{r.data.sub}</em></span>
                <span className="val">{r.data.val}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="skp-side">
          <div className="skp-note-card">
            <h4>{meta.priceNoteTitle}</h4>
            {meta.priceNote}
          </div>
          <section className="sk-panel" style={{ background: 'var(--sk-green-800)', color: 'var(--sk-cream-50)', border: 'none', marginTop: 16 }}>
            <h3 style={{ color: 'var(--sk-cream-50)' }}>Rezervovat hned</h3>
            <p style={{ fontSize: 14, opacity: 0.88, lineHeight: 1.5, margin: '4px 0 16px' }}>
              Vyberte termín, vyplňte kontakt a potvrzovací kód vám dorazí na e-mail.
            </p>
            <button className="skp-btn-primary" style={{ background: 'var(--sk-rust)', width: '100%' }} onClick={onReserve}>
              {meta.ctaLabel}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
