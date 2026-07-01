import { useState } from 'react';
import type { CmsPage } from './AdminLayout';
import './live-editor.css';

type Device = 'desktop' | 'mobile';

const PAGE_LABELS: Record<CmsPage, string> = {
  home: 'domovské stránky',
  onas: 'stránky O nás',
  tenis: 'stránky Tenis',
  gym: 'stránky Posilovna',
  kontakt: 'stránky Kontakt',
};

/**
 * WYSIWYG plátno stránky. Skutečná stránka běží v iframe (/admin/canvas),
 * takže přepínač desktop/mobil věrně přepíná responzivní breakpointy.
 */
export function LiveEditor({ page }: { page: CmsPage }) {
  const [device, setDevice] = useState<Device>('desktop');

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
        <span className="cms-live-hint">Najeďte myší na obsah a upravte ho přímo na stránce. Změny se ukládají hned.</span>
      </div>
      <div className={'cms-live-stage' + (device === 'mobile' ? ' is-mobile' : '')}>
        <iframe
          key={page}
          src={`/admin/canvas?page=${page}`}
          title={`Editace ${PAGE_LABELS[page]}`}
          className="cms-live-frame"
        />
      </div>
    </div>
  );
}
