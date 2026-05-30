// shared.jsx — Header, Footer, illustrations, icons used across all pages.

// ===== Icons =====
const Icon = {
  pin: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="2.8"/>
    </svg>
  ),
  phone: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z"/>
    </svg>
  ),
  clock: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3 2"/>
    </svg>
  ),
  shield: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z"/>
    </svg>
  ),
  racket: (p) => (
    <svg viewBox="0 0 64 64" width={p.size||64} height={p.size||64} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="24" cy="24" rx="16" ry="16"/>
      <path d="M12 24h24M24 12v24"/>
      <path d="M14 14l4 4M30 30l8 8 6 6"/>
      <circle cx="48" cy="48" r="5"/>
      <path d="M45 45a4 4 0 0 1 6 6"/>
    </svg>
  ),
  dumbbell: (p) => (
    <svg viewBox="0 0 64 64" width={p.size||64} height={p.size||64} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="22" width="6" height="20" rx="1.5"/>
      <rect x="52" y="22" width="6" height="20" rx="1.5"/>
      <rect x="14" y="26" width="4" height="12" rx="1"/>
      <rect x="46" y="26" width="4" height="12" rx="1"/>
      <path d="M18 32h28"/>
    </svg>
  ),
  arrowR: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  ),
  chev: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={p.dir === 'left' ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}/>
    </svg>
  ),
  cal: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2"/>
      <path d="M3 9h18M8 3v4M16 3v4"/>
    </svg>
  ),
  burger: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16"/>
    </svg>
  ),
};

// ===== Hero illustration placeholder =====
function HeroIllustration({ label = "Ilustrace krajiny & areálu", tag = true }) {
  return (
    <div className="sk-hero-illustration">
      {tag && <div className="sk-illu-tag">[ {label} ]</div>}
    </div>
  );
}

// ===== Tree-line silhouette (decorative footer band) =====
function TreeDeco() {
  return (
    <svg className="sk-tree-deco" viewBox="0 0 1440 28" preserveAspectRatio="none">
      <path d="M0 28 L0 18 L40 18 L46 8 L52 18 L80 18 L92 6 L104 18 L160 18 L168 12 L176 18 L240 18 L250 4 L260 18 L340 18 L350 14 L360 18 L420 18 L432 6 L444 18 L520 18 L528 12 L536 18 L620 18 L632 4 L644 18 L720 18 L730 14 L740 18 L820 18 L830 6 L840 18 L900 18 L912 12 L924 18 L990 18 L1000 4 L1010 18 L1080 18 L1090 14 L1100 18 L1170 18 L1180 6 L1190 18 L1260 18 L1270 12 L1280 18 L1340 18 L1352 4 L1364 18 L1410 18 L1420 14 L1430 18 L1440 18 L1440 28 Z"
            fill="#6e8d6e" opacity="0.55"/>
    </svg>
  );
}

// ===== Header (desktop) =====
function SokolHeader({ active, withDeco = false }) {
  const items = ['Tenis', 'Posilovna', 'Akce & Turnaje', 'Nábor', 'O nás', 'Aktuality', 'Kontakt'];
  return (
    <header className="sk-header">
      <div className="sk-logo">
        <div className="sk-logo-mark">S</div>
        <div className="sk-logo-text">
          <div>SOKOL</div>
          <div>KRAMOLNA</div>
        </div>
      </div>
      <nav className="sk-nav">
        {items.map(label => (
          <a key={label} className={'sk-navlink' + (label === active ? ' is-active' : '')}>
            {label}
          </a>
        ))}
      </nav>
      {withDeco && (
        <div className="sk-header-deco">[ panorama Kramolny ]</div>
      )}
    </header>
  );
}

// ===== Footer =====
function SokolFooter() {
  return (
    <footer className="sk-footer">
      <span>Sokol Kramolna © 2024</span>
      <div className="sk-footer-links">
        <a>Ochrana osobních údajů</a>
        <a>Provozní řád areálu</a>
      </div>
    </footer>
  );
}

// ===== Subnav (page-level tab bar) =====
function SubNav({ items, active }) {
  return (
    <nav className="sk-subnav">
      {items.map(label => (
        <a key={label} className={label === active ? 'is-active' : ''}>{label}</a>
      ))}
    </nav>
  );
}

// expose globally so other babel files can use them
Object.assign(window, {
  Icon, HeroIllustration, TreeDeco, SokolHeader, SokolFooter, SubNav,
});
