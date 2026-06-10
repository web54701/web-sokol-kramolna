import type { ReactNode } from 'react';
import { Icon } from './Icon';

type IconRenderer = (props: { size?: number }) => ReactNode;

/** Ikona podle názvu z obsahu CMS (lookup v registru Icon). */
export function IconByName({ name, size }: { name: string; size?: number }) {
  const render = (Icon as Record<string, IconRenderer>)[name];
  return render ? <>{render(size !== undefined ? { size } : {})}</> : null;
}
