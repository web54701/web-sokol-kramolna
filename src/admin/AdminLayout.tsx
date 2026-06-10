import { useState } from 'react';
import { apiSend, type AdminUser } from './api';

export type CmsPage = 'home' | 'onas' | 'tenis' | 'gym' | 'kontakt';

export type CmsSection =
  | { kind: 'page'; page: CmsPage }
  | { kind: 'global'; group: 'identity' | 'contact' | 'footer' }
  | { kind: 'media' }
  | { kind: 'users' };

const PAGE_ITEMS: { page: CmsPage; label: string }[] = [
  { page: 'home', label: 'Domů' },
  { page: 'onas', label: 'O nás' },
  { page: 'tenis', label: 'Tenis' },
  { page: 'gym', label: 'Posilovna' },
  { page: 'kontakt', label: 'Kontakt' },
];

const GLOBAL_ITEMS: { group: 'identity' | 'contact' | 'footer'; label: string }[] = [
  { group: 'identity', label: 'Logo a menu' },
  { group: 'contact', label: 'Kontaktní údaje' },
  { group: 'footer', label: 'Patička' },
];

function sectionKey(s: CmsSection): string {
  if (s.kind === 'page') return `page:${s.page}`;
  if (s.kind === 'global') return `global:${s.group}`;
  return s.kind;
}

export function AdminLayout({ user, onLogout }: { user: AdminUser; onLogout: () => void }) {
  const [section, setSection] = useState<CmsSection>({ kind: 'page', page: 'home' });

  const logout = async () => {
    try { await apiSend('POST', '/api/auth/logout'); } catch { /* cookie se smaže i tak */ }
    onLogout();
  };

  const navBtn = (target: CmsSection, label: string) => (
    <button
      key={sectionKey(target)}
      className={`cms-nav-btn${sectionKey(section) === sectionKey(target) ? ' active' : ''}`}
      onClick={() => setSection(target)}
    >
      {label}
    </button>
  );

  return (
    <div className="cms-root">
      <header className="cms-topbar">
        <div className="cms-topbar-brand">
          <img src="/logo_sokol.png" alt="" />
          <span>Správa webu · Sokol Kramolna</span>
        </div>
        <div className="cms-topbar-user">
          <a href="/" target="_blank" rel="noreferrer" className="cms-topbar-link">Zobrazit web ↗</a>
          <span className="cms-topbar-email">{user.name || user.email}</span>
          <button className="cms-logout-btn" onClick={logout}>Odhlásit</button>
        </div>
      </header>
      <div className="cms-body">
        <nav className="cms-sidebar">
          <div className="cms-nav-group">
            <div className="cms-nav-title">Stránky</div>
            {PAGE_ITEMS.map((it) => navBtn({ kind: 'page', page: it.page }, it.label))}
          </div>
          <div className="cms-nav-group">
            <div className="cms-nav-title">Globální</div>
            {GLOBAL_ITEMS.map((it) => navBtn({ kind: 'global', group: it.group }, it.label))}
          </div>
          <div className="cms-nav-group">
            <div className="cms-nav-title">Systém</div>
            {navBtn({ kind: 'media' }, 'Knihovna médií')}
            {navBtn({ kind: 'users' }, 'Uživatelé')}
          </div>
        </nav>
        <main className="cms-content">
          <div className="cms-placeholder">
            <h2>Editor obsahu</h2>
            <p>Tato sekce bude doplněna v další fázi implementace CMS.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
