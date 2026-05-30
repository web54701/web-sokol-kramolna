import type { Route } from '../types';

const NAV_ITEMS: { label: string; route: Route }[] = [
  { label: 'O nás', route: 'onas' },
  { label: 'Tenis', route: 'tenis' },
  { label: 'Posilovna', route: 'gym' },
  { label: 'Kontakt', route: 'kontakt' },
];

type HeaderProps = {
  active: string;
  onNavigate: (route: Route) => void;
};

export function Header({ active, onNavigate }: HeaderProps) {
  return (
    <header className="sk-header">
      <div className="sk-logo" onClick={() => onNavigate('tenis')}>
        <img src="/logo_sokol.png" alt="Sokol Kramolna" className="sk-logo-img" />
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
      <div className="sk-header-deco">[ panorama Kramolny ]</div>
    </header>
  );
}
