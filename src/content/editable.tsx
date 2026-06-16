import { createElement, lazy, Suspense, useState, type ReactNode } from 'react';
import { renderInline } from './inline';
import { useEdit } from './edit-context';
import { Icon } from '../components/Icon';
import type { ImageSpec } from './image-specs';
import type { TextSize } from './types';

// Knihovna médií se načítá líně — admin kód se nedostane do veřejného balíčku.
const MediaPickerModal = lazy(() =>
  import('../admin/MediaPickerModal').then((m) => ({ default: m.MediaPickerModal })));

/** Zastaví bublání kliku (aby se nespustila editace nadřazeného prvku / navigace). */
function stop(fn: () => void) {
  return (e: React.MouseEvent) => { e.stopPropagation(); fn(); };
}

type TextTag = 'h1' | 'p' | 'div' | 'span';

type EditableTextProps = {
  value: string;
  onSave: (next: string) => void;
  multiline?: boolean;
  as?: TextTag;
  className?: string;
  /** Volitelný ovladač velikosti písma (hero). */
  size?: TextSize;
  onSize?: (s: TextSize) => void;
};

/**
 * Text editovatelný přímo na stránce. Mimo editaci vykreslí čistě přes renderInline.
 * V editaci: hover → čárkované orámování, klik → textarea se surovým markupem
 * (vidět **tučně** a zalomení), uložení na blur / Enter (u jednořádkového).
 */
export function EditableText({ value, onSave, multiline, as = 'span', className, size, onSize }: EditableTextProps) {
  const { enabled } = useEdit();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!enabled) {
    return createElement(as, { className }, renderInline(value));
  }

  if (editing) {
    const commit = () => { setEditing(false); if (draft !== value) onSave(draft); };
    return (
      <textarea
        className={(className ? className + ' ' : '') + 'sk-ed-input'}
        value={draft}
        autoFocus
        rows={multiline ? Math.max(2, draft.split('\n').length) : 1}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onFocus={(e) => e.currentTarget.select()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { e.preventDefault(); setEditing(false); }
          if (e.key === 'Enter' && !multiline) { e.preventDefault(); commit(); }
        }}
      />
    );
  }

  const start = () => { setDraft(value); setEditing(true); };
  const children: ReactNode[] = [renderInline(value)];
  if (onSize) {
    children.push(
      <span className="sk-ed-size" key="sk-ed-size" onClick={(e) => e.stopPropagation()}>
        {(['sm', 'md', 'lg'] as TextSize[]).map((s) => (
          <button
            key={s}
            type="button"
            className={(size ?? 'md') === s ? 'is-active' : ''}
            onClick={() => onSize(s)}
            title={`Velikost ${s.toUpperCase()}`}
          >{s === 'sm' ? 'S' : s === 'md' ? 'M' : 'L'}</button>
        ))}
      </span>,
    );
  }
  return createElement(
    as,
    {
      className: (className ? className + ' ' : '') + 'sk-ed-text',
      onClick: start,
      title: 'Klikněte pro úpravu textu',
    },
    ...children,
  );
}

type EditableImageProps = {
  children: ReactNode;
  /** Specifikace cílové velikosti + nápovědy. */
  spec?: ImageSpec;
  /** Aktuální obrázek (pro zobrazení rozměrů v dialogu). */
  current?: string;
  onPick: (url: string) => void;
};

/**
 * Obrázek s tužkou vpravo nahoře (jen v editaci). Tužka otevře knihovnu médií
 * s krokem úpravy velikosti. Vyžaduje pozicovaného předka.
 */
export function EditableImage({ children, spec, current, onPick }: EditableImageProps) {
  const { enabled } = useEdit();
  const [picking, setPicking] = useState(false);
  if (!enabled) return <>{children}</>;
  return (
    <>
      {children}
      <button type="button" className="sk-ed-pencil" onClick={() => setPicking(true)} title="Změnit obrázek">
        <Icon.pencil size={18} />
      </button>
      {picking && (
        <Suspense fallback={null}>
          <MediaPickerModal
            spec={spec}
            current={current}
            onPick={(url) => { setPicking(false); onPick(url); }}
            onClose={() => setPicking(false)}
          />
        </Suspense>
      )}
    </>
  );
}

type CardOverlayProps = {
  hidden: boolean;
  onEdit: () => void;
  onToggleHidden: () => void;
  onDelete: () => void;
};

/** Trojice tlačítek (tužka / očičko / popelnice) vpravo nahoře na kartě. */
export function CardOverlay({ hidden, onEdit, onToggleHidden, onDelete }: CardOverlayProps) {
  const { enabled } = useEdit();
  if (!enabled) return null;
  return (
    <div className="sk-ed-toolbar">
      <button type="button" onClick={stop(onEdit)} title="Upravit kartu"><Icon.pencil size={16} /></button>
      <button type="button" onClick={stop(onToggleHidden)} title={hidden ? 'Zobrazit kartu' : 'Skrýt kartu'}>
        {hidden ? <Icon.eyeOff size={16} /> : <Icon.eye size={16} />}
      </button>
      <button type="button" onClick={stop(onDelete)} title="Smazat kartu"><Icon.trash size={16} /></button>
    </div>
  );
}

/** Čárkovaný slot s „+“ na konci řady karet. Sdílí .sk-action-card → stejná šířka. */
export function AddCardSlot({ onClick }: { onClick: () => void }) {
  const { enabled } = useEdit();
  if (!enabled) return null;
  return (
    <button type="button" className="sk-action-card sk-ed-add" onClick={onClick} title="Přidat akční kartu">
      <Icon.plus size={30} />
      <span>Přidat kartu</span>
    </button>
  );
}
