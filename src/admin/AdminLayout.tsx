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

/** Fokus živé editace na globální prvek stránky (hlavička/patička). */
export type ChromeFocus = 'header' | 'footer';

export type CmsSection =
  | { kind: 'live'; page: CmsPage; focus?: ChromeFocus }
  | { kind: 'live-resv' }
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

/** Globální skupiny s živou editací: hlavička/patička se editují na plátně domovské stránky. */
const FOCUS_OF: Partial<Record<CmsGlobalGroup, ChromeFocus>> = { identity: 'header', footer: 'footer' };

/** Živá varianta globální sekce (fokus na chrome, resp. plátno rezervace); undefined = jen formulář. */
function liveSectionOf(group: CmsGlobalGroup): CmsSection | undefined {
  const focus = FOCUS_OF[group];
  if (focus) return { kind: 'live', page: 'home', focus };
  if (group === 'reservation') return { kind: 'live-resv' };
  return undefined;
}

function sectionKey(s: CmsSection): string {
  if (s.kind === 'live') return `live:${s.page}` + (s.focus ? `:${s.focus}` : '');
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
  const previewPage: CmsPage =
    section.kind === 'live' || section.kind === 'page' ? section.page
    : section.kind === 'live-resv' ? 'tenis'
    : 'home';

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
              // Při fokusu na hlavičku/patičku svítí jen globální položka, ne stránka na plátně
              const active = (section.kind === 'live' || section.kind === 'page')
                && section.page === it.page
                && !(section.kind === 'live' && section.focus);
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
            {GLOBAL_ITEMS.map((it) => {
              const live = liveSectionOf(it.group);
              if (!live) return navBtn({ kind: 'global', group: it.group }, it.label);
              // Sekce s živou variantou se chovají jako stránky: otevírají se dle pageMode
              const active = sectionKey(section) === sectionKey(live)
                || (section.kind === 'global' && section.group === it.group);
              return (
                <button
                  key={it.group}
                  className={`cms-nav-btn${active ? ' active' : ''}`}
                  onClick={() => setSection(pageMode === 'live' ? live : { kind: 'global', group: it.group })}
                >
                  {it.label}
                </button>
              );
            })}
          </div>
          <div className="cms-nav-group">
            <div className="cms-nav-title">Systém</div>
            {navBtn({ kind: 'media' }, 'Knihovna médií')}
            {navBtn({ kind: 'history' }, 'Historie změn')}
            {navBtn({ kind: 'users' }, 'Uživatelé')}
          </div>
        </nav>
        <main className={'cms-content' + (section.kind === 'live' || section.kind === 'live-resv' ? ' cms-content-live' : '')}>
          {section.kind === 'live' && (
            <LiveEditor
              page={section.page}
              focus={section.focus}
              onNavigate={(p) => setSection({ kind: 'live', page: p })}
              onSwitchToForm={() => {
                setPageMode('page');
                // Fokusovaná editace chrome se vrací do své globální sekce, ne do formuláře stránky
                if (section.focus) setSection({ kind: 'global', group: section.focus === 'header' ? 'identity' : 'footer' });
                else setSection({ kind: 'page', page: section.page });
              }}
            />
          )}
          {section.kind === 'live-resv' && (
            <LiveEditor
              page="resv"
              onNavigate={(p) => setSection({ kind: 'live', page: p })}
              onSwitchToForm={() => { setPageMode('page'); setSection({ kind: 'global', group: 'reservation' }); }}
            />
          )}
          {(section.kind === 'page' || section.kind === 'global') && (
            <PageEditor
              sectionKey={sectionKey(section)}
              onSwitchToLive={
                section.kind === 'page'
                  ? () => { setPageMode('live'); setSection({ kind: 'live', page: section.page }); }
                  : liveSectionOf(section.group)
                    ? () => { setPageMode('live'); setSection(liveSectionOf(section.group)!); }
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
