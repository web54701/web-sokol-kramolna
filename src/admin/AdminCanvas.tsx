import { useEffect, useState } from 'react';
import { EditorProvider } from './EditorProvider';
import { HomePage } from '../pages/HomePage';
import { OnasPage } from '../pages/OnasPage';
import { KontaktPage } from '../pages/KontaktPage';
import { ActivityPage } from '../pages/ActivityPage';
import { useSingleton } from '../content/hooks';
import type { ChromeFocus } from './AdminLayout';
import type { ActivityMetaData } from '../content/types';
import type { Route, ActivityMode } from '../types';
import './admin.css';      // styly modálů (cms-modal-*) použité v editačních dialozích
import './live-editor.css';

// Navigaci (horní menu, patička…) přeposíláme rodičovské administraci,
// která přepne editovanou stránku i výběr v levém menu
const navigate = (route: Route) => {
  window.parent.postMessage({ type: 'cms-navigate', page: route }, window.location.origin);
};

type CanvasPage = 'home' | 'onas' | 'tenis' | 'gym' | 'kontakt' | 'resv';

function readPage(): CanvasPage {
  const p = new URLSearchParams(window.location.search).get('page');
  return p === 'onas' || p === 'tenis' || p === 'gym' || p === 'kontakt' || p === 'resv' ? p : 'home';
}

function readFocus(): ChromeFocus | null {
  const f = new URLSearchParams(window.location.search).get('focus');
  return f === 'header' || f === 'footer' ? f : null;
}

function readResvMode(): ActivityMode {
  return new URLSearchParams(window.location.search).get('mode') === 'gym' ? 'gym' : 'tenis';
}

/**
 * Samostatné editační plátno načítané v iframe uvnitř LiveEditoru.
 * Díky iframe má vlastní viewport, takže responzivní breakpointy (desktop/mobil)
 * fungují věrně i při WYSIWYG editaci přímo na stránce.
 */
export default function AdminCanvas() {
  const page = readPage();
  const focus = readFocus();
  const [tab, setTab] = useState('Přehled');

  return (
    <EditorProvider chromeEditable={focus != null}>
      {focus && <ScrollToFocus target={focus} />}
      {page === 'home' && <HomePage onNavigate={navigate} />}
      {page === 'onas' && <OnasPage onNavigate={navigate} />}
      {page === 'kontakt' && <KontaktPage onNavigate={navigate} />}
      {(page === 'tenis' || page === 'gym') && (
        <ActivityPage mode={page} tab={tab} setTab={setTab} onNavigate={navigate} />
      )}
      {page === 'resv' && <ReservationCanvas mode={readResvMode()} />}
    </EditorProvider>
  );
}

/** Odscrolluje na editovanou hlavičku/patičku a krátce ji zvýrazní. */
function ScrollToFocus({ target }: { target: ChromeFocus }) {
  useEffect(() => {
    const el = document.querySelector(target === 'header' ? '.sk-header' : '.sk-footer');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: target === 'footer' ? 'end' : 'start' });
    el.classList.add('sk-ed-focus-flash');
    const t = window.setTimeout(() => el.classList.remove('sk-ed-focus-flash'), 2400);
    return () => window.clearTimeout(t);
  }, [target]);
  return null;
}

/** Plátno rezervačního průvodce: stránka aktivity s vynucenou záložkou rezervace. */
function ReservationCanvas({ mode }: { mode: ActivityMode }) {
  const meta = useSingleton<ActivityMetaData>(`${mode}.meta`);
  const [tab, setTab] = useState(meta?.resvTab ?? 'Rezervace');
  return <ActivityPage mode={mode} tab={tab} setTab={setTab} onNavigate={navigate} />;
}
