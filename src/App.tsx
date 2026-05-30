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

function loadState(): AppState {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) ?? 'null');
    if (saved && typeof saved === 'object') return saved as AppState;
  } catch {}
  return { route: 'home', tenisTab: 'Přehled', gymTab: 'Přehled' };
}

export default function App() {
  const [{ route, tenisTab, gymTab }, setState] = useState<AppState>(loadState);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ route, tenisTab, gymTab })); } catch {}
  }, [route, tenisTab, gymTab]);

  const go = (r: Route) => setState((s) => ({ ...s, route: r }));
  const setTenisTab = (t: string) => setState((s) => ({ ...s, tenisTab: t }));
  const setGymTab = (t: string) => setState((s) => ({ ...s, gymTab: t }));

  return (
    <>
{route === 'home' && <HomePage onNavigate={go} />}
      {route === 'tenis' && <ActivityPage mode="tenis" tab={tenisTab} setTab={setTenisTab} onNavigate={go} />}
      {route === 'gym' && <ActivityPage mode="gym" tab={gymTab} setTab={setGymTab} onNavigate={go} />}
      {route === 'onas' && <OnasPage onNavigate={go} />}
      {route === 'kontakt' && <KontaktPage onNavigate={go} />}
    </>
  );
}
