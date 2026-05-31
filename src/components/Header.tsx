import { useState, useRef } from 'react';
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
  isAdmin?: boolean;
  onAdminActivate?: () => void;
};

export function Header({ active, onNavigate, isAdmin, onAdminActivate }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const tapTimes = useRef<number[]>([]);

  const go = (route: Route) => { setOpen(false); onNavigate(route); };

  const handleLogoImgClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    tapTimes.current = [...tapTimes.current.filter(t => now - t < 2000), now];
    if (tapTimes.current.length >= 5) {
      tapTimes.current = [];
      onAdminActivate?.();
    }
  };

  return (
    <>
      <header className="sk-header">
        <div className="sk-logo" onClick={() => go('home')} aria-label="Sokol Kramolna">
          <img src="/logo_sokol.png" alt="" className="sk-logo-img" onClick={handleLogoImgClick} />
          <div className="sk-logo-text">
            <span>SOKOL</span>
            <span>KRAMOLNA</span>
          </div>
          {isAdmin && <span className="sk-admin-chip"><Icon.shield size={11} /> Správce</span>}
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
