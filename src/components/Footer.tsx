import { useZone, useSingleton, visibilityClass } from '../content/hooks';
import type { FooterLinkData, TextData } from '../content/types';

export function Footer() {
  const links = useZone<FooterLinkData>('global.footer');
  const meta = useSingleton<TextData>('global.footer_meta');
  const copyright = (meta?.text ?? '').replace('{year}', String(new Date().getFullYear()));

  return (
    <footer className="sk-footer">
      <span>{copyright}</span>
      <div className="sk-footer-links">
        {links.map((l) => (
          <a key={l.id} href={l.data.href || undefined} className={visibilityClass(l.visibility).trim() || undefined}>
            {l.data.label}
          </a>
        ))}
      </div>
    </footer>
  );
}
