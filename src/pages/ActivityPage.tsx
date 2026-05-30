import { Icon } from '../components/Icon';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ReservationFlow } from '../features/reservation/ReservationFlow';
import { ACT, type ActivityMode, type ActivityConfig } from '../data/activities';
import type { Route } from '../types';

type Props = {
  mode: ActivityMode;
  tab: string;
  setTab: (tab: string) => void;
  onNavigate: (route: Route) => void;
};

export function ActivityPage({ mode, tab, setTab, onNavigate }: Props) {
  const cfg = ACT[mode];
  const tabs = ['Přehled', 'Ceník', cfg.resvTab];

  return (
    <div className="sk-page skp-page">
      <Header active={cfg.nav} onNavigate={onNavigate} />

      <div className="sk-pagewrap">
        <div className="sk-pagehead">
          <div className="sk-pagehead-l">
            <h1>{cfg.title}</h1>
            <p>{cfg.intro}</p>
          </div>
          <nav className="sk-subnav">
            {tabs.map((t) => (
              <a key={t} className={t === tab ? 'is-active' : ''} onClick={() => setTab(t)}>{t}</a>
            ))}
          </nav>
        </div>

        {tab === 'Přehled' && <ActivityOverview cfg={cfg} onReserve={() => setTab(cfg.resvTab)} />}
        {tab === 'Ceník' && <ActivityPricing cfg={cfg} onReserve={() => setTab(cfg.resvTab)} />}
        {tab === cfg.resvTab && <ReservationFlow mode={mode} onGoOverview={() => setTab('Přehled')} />}
      </div>

      <Footer />
    </div>
  );
}

function ActivityOverview({ cfg, onReserve }: { cfg: ActivityConfig; onReserve: () => void }) {
  return (
    <div className="skp-scroll">
      <div className="skp-overview">
        <div className="skp-hero-card">
          <span className="eyebrow">{cfg.heroEyebrow}</span>
          <h2>{cfg.heroTitle}</h2>
          <p>{cfg.heroText}</p>
          <div className="skp-hero-stats">
            {cfg.stats.map((s, i) => (
              <div key={i} className="s"><div className="v">{s.v}</div><div className="k">{s.k}</div></div>
            ))}
          </div>
          <button className="skp-hero-cta" onClick={onReserve}>{cfg.ctaLabel} <Icon.arrowR size={18} /></button>
        </div>

        <div className="skp-side">
          <section className="sk-panel">
            <h3>Pravidla rezervace</h3>
            <ul className="sk-rules">
              {cfg.rules.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </section>
          <section className="sk-panel sk-hours">
            <h3>Otevírací doba</h3>
            {cfg.hours.map(([d, h], i) => (
              <div key={i} className="row"><span className="d">{d}</span><span>{h}</span></div>
            ))}
            <p className="note">{cfg.hoursNote}</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function ActivityPricing({ cfg, onReserve }: { cfg: ActivityConfig; onReserve: () => void }) {
  return (
    <div className="skp-scroll">
      <div className="skp-cenik-grid">
        <section className="sk-panel">
          <h3>Ceník</h3>
          <div className="sk-pricelist skp-price-big">
            <div className="row head"><span>Položka</span><span>Cena</span></div>
            {cfg.price.rows.map((r, i) => (
              <div key={i} className="row" style={i === cfg.price.rows.length - 1 ? { borderBottom: 0 } : undefined}>
                <span className="lbl">{r.lbl} <em>{r.sub}</em></span>
                <span className="val">{r.val}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="skp-side">
          <div className="skp-note-card">
            <h4>{cfg.price.noteTitle}</h4>
            {cfg.price.note}
          </div>
          <section className="sk-panel" style={{ background: 'var(--sk-green-800)', color: 'var(--sk-cream-50)', border: 'none', marginTop: 16 }}>
            <h3 style={{ color: 'var(--sk-cream-50)' }}>Rezervovat hned</h3>
            <p style={{ fontSize: 14, opacity: 0.88, lineHeight: 1.5, margin: '4px 0 16px' }}>
              Vyberte termín, vyplňte kontakt a potvrzovací kód vám dorazí na e-mail.
            </p>
            <button className="skp-btn-primary" style={{ background: 'var(--sk-rust)', width: '100%' }} onClick={onReserve}>
              {cfg.ctaLabel}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
