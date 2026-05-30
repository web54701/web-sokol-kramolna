import type { Route } from '../types';

const NAV_ITEMS: { label: string; route: Route }[] = [
  { label: 'O nás', route: 'onas' },
  { label: 'Tenis', route: 'tenis' },
  { label: 'Posilovna', route: 'gym' },
  { label: 'Kontakt', route: 'kontakt' },
];

type HeaderProps = {
  active: string | null;
  onNavigate: (route: Route) => void;
};

export function Header({ active, onNavigate }: HeaderProps) {
  return (
    <header className="sk-header">
      <div className="sk-logo" onClick={() => onNavigate('home')} aria-label="Sokol Kramolna">
        <img src="/logo_sokol.png" alt="" className="sk-logo-img" />
        <div className="sk-logo-text">
          <span>SOKOL</span>
          <span>KRAMOLNA</span>
        </div>
      </div>
      <nav className="sk-nav">
        {NAV_ITEMS.map((it) => (
          <a
            key={it.route}
            className={'sk-navlink' + (it.label === active ? ' is-active' : '')}
            onClick={() => onNavigate(it.route)}
          >
            {it.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
