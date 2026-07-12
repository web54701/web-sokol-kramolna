import { useState, useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { ActivityPage } from './pages/ActivityPage';
import { OnasPage } from './pages/OnasPage';
import { KontaktPage } from './pages/KontaktPage';
import type { Route } from './types';

const LS_KEY = 'sk-proto-state';

type AppState = {
  route: Route;
  tenisTab: string;
  gymTab: string;
};

function routeFromUrl(): Route | null {
  const p = new URLSearchParams(window.location.search).get('page');
  return p === 'home' || p === 'tenis' || p === 'gym' || p === 'onas' || p === 'kontakt' ? p : null;
}

function loadState(): AppState {
  let state: AppState = { route: 'home', tenisTab: 'Přehled', gymTab: 'Přehled' };
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) ?? 'null');
    if (saved && typeof saved === 'object') state = saved as AppState;
  } catch { /* poškozený localStorage – použij výchozí stav */ }
  const fromUrl = routeFromUrl();
  return fromUrl ? { ...state, route: fromUrl } : state;
}

export default function App() {
  const [{ route, tenisTab, gymTab }, setState] = useState<AppState>(loadState);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ route, tenisTab, gymTab })); } catch { /* localStorage nedostupný – ignoruj */ }
  }, [route, tenisTab, gymTab]);

  const go = (r: Route) => setState((s) => ({
    ...s,
    route: r,
    tenisTab: r === 'tenis' ? 'Přehled' : s.tenisTab,
    gymTab: r === 'gym' ? 'Přehled' : s.gymTab,
  }));
  const setTenisTab = (t: string) => setState((s) => ({ ...s, tenisTab: t }));
  const setGymTab = (t: string) => setState((s) => ({ ...s, gymTab: t }));
  const activateAdmin = () => setIsAdmin(true);

  return (
    <>
      {route === 'home' && <HomePage onNavigate={go} isAdmin={isAdmin} onAdminActivate={activateAdmin} />}
      {route === 'tenis' && <ActivityPage mode="tenis" tab={tenisTab} setTab={setTenisTab} onNavigate={go} isAdmin={isAdmin} onAdminActivate={activateAdmin} />}
      {route === 'gym' && <ActivityPage mode="gym" tab={gymTab} setTab={setGymTab} onNavigate={go} isAdmin={isAdmin} onAdminActivate={activateAdmin} />}
      {route === 'onas' && <OnasPage onNavigate={go} isAdmin={isAdmin} onAdminActivate={activateAdmin} />}
      {route === 'kontakt' && <KontaktPage onNavigate={go} isAdmin={isAdmin} onAdminActivate={activateAdmin} />}
    </>
  );
}
