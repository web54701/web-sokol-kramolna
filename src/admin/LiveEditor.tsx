import { useEffect, useState } from 'react';
import type { CmsPage, ChromeFocus } from './AdminLayout';
import './live-editor.css';

function isCmsPage(p: unknown): p is CmsPage {
  return p === 'home' || p === 'onas' || p === 'tenis' || p === 'gym' || p === 'kontakt';
}

type Device = 'desktop' | 'mobile';

const PAGE_LABELS: Record<CmsPage | 'resv', string> = {
  home: 'domovské stránky',
  onas: 'stránky O nás',
  tenis: 'stránky Tenis',
  gym: 'stránky Posilovna',
  kontakt: 'stránky Kontakt',
  resv: 'rezervačních textů',
};

const FOCUS_LABELS: Record<ChromeFocus, string> = {
  header: 'hlavičky webu',
  footer: 'patičky webu',
};

/**
 * WYSIWYG plátno stránky. Skutečná stránka běží v iframe (/admin/canvas),
 * takže přepínač desktop/mobil věrně přepíná responzivní breakpointy.
 * Kromě stránek umí i fokus na hlavičku/patičku a plátno rezervačního průvodce.
 */
export function LiveEditor({ page, focus, onNavigate, onSwitchToForm }: {
  page: CmsPage | 'resv';
  focus?: ChromeFocus;
  onNavigate: (page: CmsPage) => void;
  onSwitchToForm: () => void;
}) {
  const [device, setDevice] = useState<Device>('desktop');
  // Plátno rezervace: přepínač Tenis/Posilovna (texty se liší jen v placeholderu poznámky a kapacitě)
  const [resvMode, setResvMode] = useState<'tenis' | 'gym'>('tenis');

  // Kliknutí na odkaz uvnitř plátna (horní menu, patička) přepne editovanou stránku
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data as { type?: string; page?: unknown } | null;
      if (data?.type === 'cms-navigate' && isCmsPage(data.page)) onNavigate(data.page);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onNavigate]);

  const canvasSrc = page === 'resv'
    ? `/admin/canvas?page=resv&mode=${resvMode}`
    : `/admin/canvas?page=${page}` + (focus ? `&focus=${focus}` : '');

  return (
    <div className="cms-live">
      <div className="cms-live-bar">
        <div className="cms-live-toggle">
          <button
            className={'cms-btn-secondary' + (device === 'desktop' ? ' active' : '')}
            onClick={() => setDevice('desktop')}
          >🖥 Desktop</button>
          <button
            className={'cms-btn-secondary' + (device === 'mobile' ? ' active' : '')}
            onClick={() => setDevice('mobile')}
          >📱 Mobil</button>
        </div>
        {page === 'resv' && (
          <div className="cms-live-toggle">
            <button
              className={'cms-btn-secondary' + (resvMode === 'tenis' ? ' active' : '')}
              onClick={() => setResvMode('tenis')}
            >🎾 Tenis</button>
            <button
              className={'cms-btn-secondary' + (resvMode === 'gym' ? ' active' : '')}
              onClick={() => setResvMode('gym')}
            >🏋 Posilovna</button>
          </div>
        )}
        <span className="cms-live-hint">
          {page === 'resv'
            ? 'Panelem dole přepínejte kroky průvodce a upravte texty přímo na stránce. Rezervace se z plátna neodesílají.'
            : 'Najeďte myší na obsah a upravte ho přímo na stránce. Změny se ukládají hned.'}
        </span>
        <button className="cms-btn-secondary cms-live-form-switch" onClick={onSwitchToForm}>
          📝 Formulářové zobrazení
        </button>
      </div>
      <div className={'cms-live-stage' + (device === 'mobile' ? ' is-mobile' : '')}>
        <iframe
          // Klíč vynutí remount i při přechodu Domů ↔ Logo a menu (obojí page=home)
          key={`${page}:${focus ?? ''}:${page === 'resv' ? resvMode : ''}`}
          src={canvasSrc}
          title={`Editace ${focus ? FOCUS_LABELS[focus] : PAGE_LABELS[page]}`}
          className="cms-live-frame"
        />
      </div>
    </div>
  );
}
