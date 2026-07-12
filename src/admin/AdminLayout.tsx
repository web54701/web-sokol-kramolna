import { useState } from 'react';
import { apiSend, type AdminUser } from './api';
import { PageEditor } from './PageEditor';
import { UsersScreen } from './UsersScreen';
import { MediaLibrary } from './MediaLibrary';
import { PreviewPane } from './PreviewPane';
import { LiveEditor } from './LiveEditor';
import { HistoryScreen } from './HistoryScreen';

export type CmsPage = 'home' | 'onas' | 'tenis' | 'gym' | 'kontakt';

export type CmsGlobalGroup = 'identity' | 'contact' | 'footer' | 'emails' | 'reservation';

export type CmsSection =
  | { kind: 'live'; page: CmsPage }
  | { kind: 'page'; page: CmsPage }
  | { kind: 'global'; group: CmsGlobalGroup }
  | { kind: 'media' }
  | { kind: 'history' }
  | { kind: 'users' };

const PAGE_ITEMS: { page: CmsPage; label: string }[] = [
  { page: 'home', label: 'Domů' },
  { page: 'onas', label: 'O nás' },
  { page: 'tenis', label: 'Tenis' },
  { page: 'gym', label: 'Posilovna' },
  { page: 'kontakt', label: 'Kontakt' },
];

const GLOBAL_ITEMS: { group: CmsGlobalGroup; label: string }[] = [
  { group: 'identity', label: 'Logo a menu' },
  { group: 'contact', label: 'Kontaktní údaje' },
  { group: 'footer', label: 'Patička' },
  { group: 'emails', label: 'E-maily' },
  { group: 'reservation', label: 'Rezervace — texty' },
];

function sectionKey(s: CmsSection): string {
  if (s.kind === 'live') return `live:${s.page}`;
  if (s.kind === 'page') return `page:${s.page}`;
  if (s.kind === 'global') return `global:${s.group}`;
  return s.kind;
}

export function AdminLayout({ user, onLogout }: { user: AdminUser; onLogout: () => void }) {
  const [section, setSection] = useState<CmsSection>({ kind: 'live', page: 'home' });
  // Režim editace stránek: primárně živě, formulář je alternativa (drží se při přepínání stránek)
  const [pageMode, setPageMode] = useState<'live' | 'page'>('live');
  const [previewOpen, setPreviewOpen] = useState(false);

  // Náhled otevíráme na stránce, která se právě edituje; u sekcí bez stránky na úvodu
  const previewPage: CmsPage = section.kind === 'live' || section.kind === 'page' ? section.page : 'home';

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
          <button className="cms-logout-btn" onClick={() => setPreviewOpen(true)}>Náhled</button>
          <a href="/" target="_blank" rel="noreferrer" className="cms-topbar-link">Zobrazit web ↗</a>
          <span className="cms-topbar-email">{user.name || user.email}</span>
          <button className="cms-logout-btn" onClick={logout}>Odhlásit</button>
        </div>
      </header>
      <div className="cms-body">
        <nav className="cms-sidebar">
          <div className="cms-nav-group">
            <div className="cms-nav-title">Stránky</div>
            {PAGE_ITEMS.map((it) => {
              const active = (section.kind === 'live' || section.kind === 'page') && section.page === it.page;
              return (
                <button
                  key={it.page}
                  className={`cms-nav-btn${active ? ' active' : ''}`}
                  onClick={() => setSection({ kind: pageMode, page: it.page })}
                >
                  {it.label}
                </button>
              );
            })}
          </div>
          <div className="cms-nav-group">
            <div className="cms-nav-title">Globální</div>
            {GLOBAL_ITEMS.map((it) => navBtn({ kind: 'global', group: it.group }, it.label))}
          </div>
          <div className="cms-nav-group">
            <div className="cms-nav-title">Systém</div>
            {navBtn({ kind: 'media' }, 'Knihovna médií')}
            {navBtn({ kind: 'history' }, 'Historie změn')}
            {navBtn({ kind: 'users' }, 'Uživatelé')}
          </div>
        </nav>
        <main className={'cms-content' + (section.kind === 'live' ? ' cms-content-live' : '')}>
          {section.kind === 'live' && (
            <LiveEditor
              page={section.page}
              onNavigate={(p) => setSection({ kind: 'live', page: p })}
              onSwitchToForm={() => { setPageMode('page'); setSection({ kind: 'page', page: section.page }); }}
            />
          )}
          {(section.kind === 'page' || section.kind === 'global') && (
            <PageEditor
              sectionKey={sectionKey(section)}
              onSwitchToLive={
                section.kind === 'page'
                  ? () => { setPageMode('live'); setSection({ kind: 'live', page: section.page }); }
                  : undefined
              }
            />
          )}
          {section.kind === 'users' && <UsersScreen currentUser={user} />}
          {section.kind === 'media' && <MediaLibrary />}
          {section.kind === 'history' && <HistoryScreen />}
        </main>
      </div>
      {previewOpen && <PreviewPane page={previewPage} onClose={() => setPreviewOpen(false)} />}
    </div>
  );
}
