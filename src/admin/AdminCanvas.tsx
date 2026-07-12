import { useState } from 'react';
import { EditorProvider } from './EditorProvider';
import { HomePage } from '../pages/HomePage';
import { OnasPage } from '../pages/OnasPage';
import { KontaktPage } from '../pages/KontaktPage';
import { ActivityPage } from '../pages/ActivityPage';
import type { CmsPage } from './AdminLayout';
import type { Route } from '../types';
import './admin.css';      // styly modálů (cms-modal-*) použité v editačních dialozích
import './live-editor.css';

// Navigaci (horní menu, patička…) přeposíláme rodičovské administraci,
// která přepne editovanou stránku i výběr v levém menu
const navigate = (route: Route) => {
  window.parent.postMessage({ type: 'cms-navigate', page: route }, window.location.origin);
};

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
      {page === 'home' && <HomePage onNavigate={navigate} />}
      {page === 'onas' && <OnasPage onNavigate={navigate} />}
      {page === 'kontakt' && <KontaktPage onNavigate={navigate} />}
      {(page === 'tenis' || page === 'gym') && (
        <ActivityPage mode={page} tab={tab} setTab={setTab} onNavigate={navigate} />
      )}
    </EditorProvider>
  );
}
