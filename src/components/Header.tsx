import { useState } from 'react';
import { Icon } from './Icon';
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
  const [open, setOpen] = useState(false);

  const go = (route: Route) => { setOpen(false); onNavigate(route); };

  return (
    <>
      <header className="sk-header">
        <div className="sk-logo" onClick={() => go('home')} aria-label="Sokol Kramolna">
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
              onClick={() => go(it.route)}
            >
              {it.label}
            </a>
          ))}
        </nav>
        <button
          className={'sk-mob-btn' + (open ? ' is-open' : '')}
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Zavřít menu' : 'Otevřít menu'}
        >
          {open ? <Icon.close size={24} /> : <Icon.menu size={24} />}
        </button>
      </header>

      {open && (
        <div className="sk-mob-overlay" onClick={() => setOpen(false)}>
          <nav className="sk-mob-nav" onClick={(e) => e.stopPropagation()}>
            {NAV_ITEMS.map((it) => (
              <a
                key={it.route}
                className={'sk-mob-navlink' + (it.label === active ? ' is-active' : '')}
                onClick={() => go(it.route)}
              >
                {it.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
