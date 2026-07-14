import { useState, lazy, Suspense } from 'react';
import { useZoneAll, useSingletonObject, visibilityClass, type ZoneObject } from '../content/hooks';
import { useEdit } from '../content/edit-context';
import { EditableText, RowActions, AddRowSlot } from '../content/editable';
import type { FooterLinkData, TextData } from '../content/types';

// Editační dialog odkazu (URL) se načítá líně — admin kód mimo veřejný balíček.
const ObjectForm = lazy(() =>
  import('../admin/ObjectForm').then((m) => ({ default: m.ObjectForm })));

export function Footer() {
  const edit = useEdit();
  // Patička je editovatelná jen při fokusu na chrome (sekce Patička).
  const chromeEdit = edit.enabled && edit.chromeEditable;
  const allLinks = useZoneAll<FooterLinkData>('global.footer');
  const links = chromeEdit ? allLinks : allLinks.filter((l) => !l.hidden);
  const metaObj = useSingletonObject<TextData>('global.footer_meta');
  const [editLink, setEditLink] = useState<ZoneObject<FooterLinkData> | null>(null);

  const moveLink = (index: number, delta: number) => {
    const ids = links.map((l) => l.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    void edit.reorder('global.footer', ids);
  };

  return (
    <footer className="sk-footer">
      {chromeEdit ? (
        // V editaci se upravuje surový text — zástupný symbol {year} zůstává vidět,
        // stejně jako ve formuláři.
        <EditableText
          as="span"
          value={metaObj?.data.text ?? ''}
          onSave={(t) => { if (metaObj) void edit.patchData(metaObj.id, { text: t }); }}
          placeholder="Text copyrightu"
        />
      ) : (
        <span>{(metaObj?.data.text ?? '').replace('{year}', String(new Date().getFullYear()))}</span>
      )}
      <div className="sk-footer-links">
        {links.map((l, i) => chromeEdit ? (
          // Bez href — klik v editaci nesmí odvést iframe pryč z plátna
          <span
            key={l.id}
            className={'sk-ed-row' + visibilityClass(l.visibility) + (l.hidden ? ' sk-ed-hidden' : '')}
          >
            <EditableText as="span" value={l.data.label} onSave={(t) => void edit.patchData(l.id, { ...l.data, label: t })} />
            <RowActions
              hidden={l.hidden}
              onEdit={() => setEditLink(l)}
              onMoveUp={i > 0 ? () => moveLink(i, -1) : undefined}
              onMoveDown={i < links.length - 1 ? () => moveLink(i, 1) : undefined}
              onToggleHidden={() => void edit.setHidden(l.id, !l.hidden)}
              onDelete={() => { if (window.confirm('Opravdu smazat odkaz?')) void edit.remove(l.id); }}
            />
          </span>
        ) : (
          <a key={l.id} href={l.data.href || undefined} className={visibilityClass(l.visibility).trim() || undefined}>
            {l.data.label}
          </a>
        ))}
        {chromeEdit && (
          <AddRowSlot
            label="Přidat odkaz"
            onClick={() => void edit.createInZone('global.footer', 'footer_link', { label: 'Nový odkaz', href: '' })}
          />
        )}
      </div>
      {editLink && (
        <Suspense fallback={null}>
          <ObjectForm
            title="Odkaz v patičce"
            typeKey="footer_link"
            initial={editLink.data}
            onSave={(data) => edit.patchData(editLink.id, data)}
            onClose={() => setEditLink(null)}
          />
        </Suspense>
      )}
    </footer>
  );
}
