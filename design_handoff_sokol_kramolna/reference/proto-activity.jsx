// proto-activity.jsx — Tenis a Posilovna. Sdílený shell, obsah řízený configem.
// Taby: Přehled · Ceník · Rezervace (kurtu/vstupu → ReservationFlow).

const ACT = {
  tenis: {
    nav: 'Tenis',
    title: 'Tenis',
    intro: 'Jeden antukový kurt v klidném prostředí areálu. Rezervace online v hodinových blocích — jednoduše, bez registrace.',
    resvTab: 'Rezervace kurtu',
    heroEyebrow: 'Antukový kurt · Sokol Kramolna',
    heroTitle: 'Zahrajte si na našem kurtu',
    heroText: 'Udržovaná antuka, osvětlení pro hru do večera a online rezervace na pár kliknutí. K dispozici je jeden kurt — proto doporučujeme rezervovat předem.',
    stats: [
      { v: '1', k: 'Antukový kurt' },
      { v: '8–21', k: 'Otevřeno denně' },
      { v: 'od 160', k: 'Kč / hodina' },
    ],
    ctaLabel: 'Rezervovat kurt',
    rules: [
      'Rezervovat lze nejdříve 21 dní a nejpozději 1 hodinu předem.',
      'Hodinové bloky lze spojit do delší hry.',
      'Storno zdarma nejpozději 24 hodin před začátkem.',
      'Při dešti správce kurt uzavře a rezervaci bezplatně zruší.',
    ],
    hours: [
      ['Pondělí – Pátek', '8:00 – 21:00'],
      ['Sobota – Neděle', '9:00 – 20:00'],
    ],
    hoursNote: 'V hlavní sezóně (květen–září). Mimo sezónu dle dohody se správcem.',
    price: {
      rows: [
        { lbl: 'Mimo špičku', sub: 'Po–Pá 8:00–16:00', val: '160 Kč' },
        { lbl: 'Špička', sub: 'Po–Pá 16:00–21:00', val: '220 Kč' },
        { lbl: 'Víkend a svátky', sub: 'So–Ne celý den', val: '220 Kč' },
      ],
      noteTitle: 'Co je v ceně',
      note: 'Cena je za hodinu hry na celém kurtu, bez ohledu na počet hráčů. Síť a značení jsou připravené. Členové Sokola Kramolna mají 20 % slevu po přihlášení.',
    },
  },
  gym: {
    nav: 'Posilovna',
    title: 'Posilovna',
    intro: 'Plně vybavená posilovna v budově sokolovny. Rezervujte si hodinový vstup online — vidíte volnou kapacitu i dopředu.',
    resvTab: 'Rezervace vstupu',
    heroEyebrow: 'Posilovna · Sokol Kramolna',
    heroTitle: 'Cvičte, kdy se vám to hodí',
    heroText: 'Činky, multifunkční klec, kardio zóna i kladkový stroj na ploše 80 m². Rezervací vstupu máte jistotu místa — kapacita je 15 osob v jednom bloku.',
    stats: [
      { v: '80 m²', k: 'Plocha posilovny' },
      { v: '15', k: 'Míst v bloku' },
      { v: 'od 100', k: 'Kč / vstup' },
    ],
    ctaLabel: 'Rezervovat vstup',
    rules: [
      'Vstup se rezervuje v hodinových blocích, kapacita 15 osob.',
      'Členové s čipem mají přístup i mimo přítomnost správce.',
      'První návštěvu doporučujeme s instruktorem — seznámení zdarma.',
      'Storno zdarma nejpozději 24 hodin před začátkem.',
    ],
    hours: [
      ['Pondělí – Pátek', '6:00 – 22:00'],
      ['Sobota – Neděle', '8:00 – 20:00'],
    ],
    hoursNote: 'Rezervovat online lze v provozních hodinách správce (8:00–20:00).',
    price: {
      rows: [
        { lbl: 'Jednorázový vstup', sub: 'Hodinový blok', val: '100 Kč' },
        { lbl: 'Permanentka 10 vstupů', sub: 'Platnost 6 měsíců', val: '800 Kč' },
        { lbl: 'Měsíční permanentka', sub: 'Neomezený vstup', val: '700 Kč' },
        { lbl: 'Roční členství', sub: 'Jen členové Sokola', val: '3 900 Kč' },
      ],
      noteTitle: 'Dobré vědět',
      note: 'Permanentky a členství vyřídíte u správce nebo online při rezervaci. Úvodní 30minutové seznámení s instruktorem je pro nové návštěvníky zdarma.',
    },
  },
};

function ActivityPage({ mode, tab, setTab, onNavigate }) {
  const cfg = ACT[mode];
  const tabs = ['Přehled', 'Ceník', cfg.resvTab];

  return (
    <div className="sk-page skp-page" data-screen-label={cfg.title}>
      <ProtoHeader active={cfg.nav} onNavigate={onNavigate} />

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

      <SokolFooter />
    </div>
  );
}

function ActivityOverview({ cfg, onReserve }) {
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

function ActivityPricing({ cfg, onReserve }) {
  return (
    <div className="skp-scroll">
      <div className="skp-cenik-grid">
        <section className="sk-panel">
          <h3>Ceník</h3>
          <div className="sk-pricelist skp-price-big">
            <div className="row head"><span>Položka</span><span>Cena</span></div>
            {cfg.price.rows.map((r, i) => (
              <div key={i} className="row" style={i === cfg.price.rows.length - 1 ? { borderBottom: 0 } : null}>
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

window.ActivityPage = ActivityPage;
