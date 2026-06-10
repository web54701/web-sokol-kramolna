import { useState, useRef } from 'react';
import { Icon } from './Icon';
import { useZone, useSingleton, visibilityClass } from '../content/hooks';
import type { NavItemData, LogoData } from '../content/types';
import type { Route } from '../types';

type HeaderProps = {
  /** Route aktivní stránky (zvýraznění v menu), null na homepage. */
  active: Route | null;
  onNavigate: (route: Route) => void;
  isAdmin?: boolean;
  onAdminActivate?: () => void;
};

export function Header({ active, onNavigate, isAdmin, onAdminActivate }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const tapTimes = useRef<number[]>([]);
  const navItems = useZone<NavItemData>('global.nav');
  const logo = useSingleton<LogoData>('global.logo');

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
          <img src={logo?.img ?? '/logo_sokol.png'} alt="" className="sk-logo-img" onClick={handleLogoImgClick} />
          <div className="sk-logo-text">
            <span>{logo?.line1 ?? ''}</span>
            <span>{logo?.line2 ?? ''}</span>
          </div>
          {isAdmin && <span className="sk-admin-chip"><Icon.shield size={11} /> Správce</span>}
        </div>
        <nav className="sk-nav">
          {navItems.map((it) => (
            <a
              key={it.id}
              className={'sk-navlink' + (it.data.route === active ? ' is-active' : '') + visibilityClass(it.visibility)}
              onClick={() => go(it.data.route as Route)}
            >
              {it.data.label}
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
            {navItems.map((it) => (
              <a
                key={it.id}
                className={'sk-mob-navlink' + (it.data.route === active ? ' is-active' : '') + visibilityClass(it.visibility)}
                onClick={() => go(it.data.route as Route)}
              >
                {it.data.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
