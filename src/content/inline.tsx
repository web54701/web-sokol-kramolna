import type { ReactNode } from 'react';

/**
 * Mini-markup textů z CMS: '\n' → <br/>, '**text**' → <strong>.
 * Staví React uzly — žádné dangerouslySetInnerHTML.
 */
export function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  text.split('\n').forEach((line, li) => {
    if (li > 0) out.push(<br key={`br-${li}`} />);
    const re = /\*\*(.+?)\*\*/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let bi = 0;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) out.push(line.slice(last, m.index));
      out.push(<strong key={`b-${li}-${bi++}`}>{m[1]}</strong>);
      last = m.index + m[0].length;
    }
    if (last < line.length) out.push(line.slice(last));
  });
  return out;
}
