// proto-app.jsx — shell prototypu: klikatelná hlavička + jednoduchý router.
// Stav (stránka + aktivní tab) se ukládá do localStorage, ať refresh nezahodí místo.

const { useState } = React;

const NAV_ITEMS = [
  { label: 'O nás', route: 'onas' },
  { label: 'Tenis', route: 'tenis' },
  { label: 'Posilovna', route: 'gym' },
  { label: 'Kontakt', route: 'kontakt' },
];

function ProtoHeader({ active, onNavigate }) {
  return (
    <header className="sk-header">
      <div className="sk-logo" onClick={() => onNavigate('home')}>
        <div className="sk-logo-mark">S</div>
        <div className="sk-logo-text">
          <div>SOKOL</div>
          <div>KRAMOLNA</div>
        </div>
      </div>
      <nav className="sk-nav">
        {NAV_ITEMS.map((it) => (
          <a key={it.route}
            className={'sk-navlink' + (it.label === active ? ' is-active' : '')}
            onClick={() => onNavigate(it.route)}>
            {it.label}
          </a>
        ))}
      </nav>
      <div className="sk-header-deco">[ panorama Kramolny ]</div>
    </header>
  );
}

const LS_KEY = 'sk-proto-state';

function App() {
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
  })();

  const [route, setRoute] = useState(saved.route || 'home');
  const [tenisTab, setTenisTab] = useState(saved.tenisTab || 'Přehled');
  const [gymTab, setGymTab] = useState(saved.gymTab || 'Přehled');

  React.useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ route, tenisTab, gymTab })); } catch {}
  }, [route, tenisTab, gymTab]);

  const go = (r) => setRoute(r);

  return (
    <React.Fragment>
      {route === 'home' && <HomePage onNavigate={go} />}
      {route === 'tenis' && <ActivityPage mode="tenis" tab={tenisTab} setTab={setTenisTab} onNavigate={go} />}
      {route === 'gym' && <ActivityPage mode="gym" tab={gymTab} setTab={setGymTab} onNavigate={go} />}
      {route === 'onas' && <OnasPage onNavigate={go} />}
      {route === 'kontakt' && <KontaktPage onNavigate={go} />}
    </React.Fragment>
  );
}

window.ProtoHeader = ProtoHeader;

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
