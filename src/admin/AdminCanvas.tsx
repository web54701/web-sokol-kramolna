import { useState } from 'react';
import { EditorProvider } from './EditorProvider';
import { HomePage } from '../pages/HomePage';
import { OnasPage } from '../pages/OnasPage';
import { KontaktPage } from '../pages/KontaktPage';
import { ActivityPage } from '../pages/ActivityPage';
import type { CmsPage } from './AdminLayout';
import './admin.css';      // styly modálů (cms-modal-*) použité v editačních dialozích
import './live-editor.css';

const noNavigate = () => { /* v editaci nenavigujeme */ };

function readPage(): CmsPage {
  const p = new URLSearchParams(window.location.search).get('page');
  return p === 'onas' || p === 'tenis' || p === 'gym' || p === 'kontakt' ? p : 'home';
}

/**
 * Samostatné editační plátno načítané v iframe uvnitř LiveEditoru.
 * Díky iframe má vlastní viewport, takže responzivní breakpointy (desktop/mobil)
 * fungují věrně i při WYSIWYG editaci přímo na stránce.
 */
export default function AdminCanvas() {
  const page = readPage();
  const [tab, setTab] = useState('Přehled');

  return (
    <EditorProvider>
      {page === 'home' && <HomePage onNavigate={noNavigate} />}
      {page === 'onas' && <OnasPage onNavigate={noNavigate} />}
      {page === 'kontakt' && <KontaktPage onNavigate={noNavigate} />}
      {(page === 'tenis' || page === 'gym') && (
        <ActivityPage mode={page} tab={tab} setTab={setTab} onNavigate={noNavigate} />
      )}
    </EditorProvider>
  );
}
