import { createContext, useContext } from 'react';
import type { ContentObject, ContactGlobalData, Visibility } from './types';

export const ContentContext = createContext<ContentObject[] | null>(null);

function useContent(): ContentObject[] {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('Chybí <ContentProvider> nad komponentou.');
  return ctx;
}

export type ZoneObject<T> = Omit<ContentObject, 'data'> & { data: T };

/** Viditelné objekty zóny seřazené podle sort. */
export function useZone<T = Record<string, unknown>>(zone: string): ZoneObject<T>[] {
  const all = useContent();
  return all
    .filter((o) => o.zone === zone && !o.hidden)
    .sort((a, b) => a.sort - b.sort) as ZoneObject<T>[];
}

/** Data jediného objektu zóny (ignoruje hidden — singletony nelze skrýt, jen editovat). */
export function useSingleton<T = Record<string, unknown>>(zone: string): T | null {
  const all = useContent();
  const obj = all.filter((o) => o.zone === zone).sort((a, b) => a.sort - b.sort)[0];
  return (obj?.data as T) ?? null;
}

const EMPTY_CONTACT: ContactGlobalData = {
  orgName: '', phone: '', email: '', addressLines: [],
  hoursTitle: '', hours: [], hoursNote: '',
};

export function useGlobalContact(): ContactGlobalData {
  return useSingleton<ContactGlobalData>('global.contact') ?? EMPTY_CONTACT;
}

/** CSS třída pro per-objekt viditelnost (desktop/mobil); '' = zobrazit všude. */
export function visibilityClass(visibility: Visibility): string {
  if (visibility === 'desktop') return ' sk-only-desktop';
  if (visibility === 'mobile') return ' sk-only-mobile';
  return '';
}
