import { createElement, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { renderInline } from './inline';
import { useEdit } from './edit-context';
import { Icon } from '../components/Icon';
import { IconByName } from '../components/IconByName';
import { ICON_NAMES } from './icon-names';
import type { ImageSpec } from './image-specs';
import type { TextSize } from './types';

// Knihovna médií se načítá líně — admin kód se nedostane do veřejného balíčku.
const MediaPickerModal = lazy(() =>
  import('../admin/MediaPickerModal').then((m) => ({ default: m.MediaPickerModal })));

/** Zastaví bublání kliku (aby se nespustila editace nadřazeného prvku / navigace). */
function stop(fn: () => void) {
  return (e: React.MouseEvent) => { e.stopPropagation(); fn(); };
}

type TextTag = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div' | 'span' | 'em';

type EditableTextProps = {
  value: string;
  onSave: (next: string) => void;
  multiline?: boolean;
  as?: TextTag;
  className?: string;
  /** Volitelný ovladač velikosti písma (hero). */
  size?: TextSize;
  onSize?: (s: TextSize) => void;
  /** Zástupný text pro prázdnou hodnotu; v editaci je klikatelný, na webu se prázdná hodnota nevykreslí. */
  placeholder?: string;
};

/**
 * Text editovatelný přímo na stránce. Mimo editaci vykreslí čistě přes renderInline.
 * V editaci: hover → čárkované orámování, klik → textarea se surovým markupem
 * (vidět **tučně** a zalomení), uložení na blur / Enter (u jednořádkového).
 */
export function EditableText({ value, onSave, multiline, as = 'span', className, size, onSize, placeholder }: EditableTextProps) {
  const { enabled } = useEdit();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Explicitní zaostření po přepnutí do editace — spolehlivější než atribut autoFocus,
  // který v iframu (plátno) nemusí napoprvé zaostřit a první psaní by propadlo.
  useEffect(() => {
    if (!editing) return;
    const el = taRef.current;
    if (el) { el.focus(); el.select(); }
  }, [editing]);

  if (!enabled) {
    // Na webu se prázdná hodnota s placeholderem nevykresluje vůbec.
    if (!value && placeholder) return null;
    return createElement(as, { className }, renderInline(value));
  }

  if (editing) {
    const commit = () => { setEditing(false); if (draft !== value) onSave(draft); };
    return (
      <textarea
        ref={taRef}
        className={(className ? className + ' ' : '') + 'sk-ed-input'}
        value={draft}
        rows={multiline ? Math.max(2, draft.split('\n').length) : 1}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { e.preventDefault(); setEditing(false); }
          if (e.key === 'Enter' && !multiline) { e.preventDefault(); commit(); }
        }}
      />
    );
  }

  const start = () => { setDraft(value); setEditing(true); };
  const isEmpty = !value;
  const usePlaceholder = isEmpty && !!placeholder;
  const children: ReactNode[] = usePlaceholder
    ? [<span className="sk-ed-ph" key="ph">{placeholder}</span>]
    : [renderInline(value)];
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
      className: (className ? className + ' ' : '') + 'sk-ed-text' + (usePlaceholder ? ' sk-ed-empty' : ''),
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

type EditableIconProps = {
  name: string;
  size?: number;
  onPick: (name: string) => void;
};

/**
 * Ikona z předdefinované sady. Mimo editaci jen vykreslí ikonu; v editaci přidá
 * tužku a po kliknutí malý popover s výběrem ikon.
 */
export function EditableIcon({ name, size, onPick }: EditableIconProps) {
  const { enabled } = useEdit();
  const [open, setOpen] = useState(false);
  if (!enabled) return <IconByName name={name} size={size} />;
  return (
    <span className="sk-ed-icon">
      <IconByName name={name} size={size} />
      <button type="button" className="sk-ed-icon-btn" onClick={stop(() => setOpen((o) => !o))} title="Změnit ikonu">
        <Icon.pencil size={12} />
      </button>
      {open && (
        <span className="sk-ed-icon-pop" onClick={(e) => e.stopPropagation()}>
          {ICON_NAMES.map((n) => (
            <button
              key={n}
              type="button"
              className={'sk-ed-icon-opt' + (n === name ? ' is-active' : '')}
              onClick={() => { setOpen(false); onPick(n); }}
              title={n}
            >
              <IconByName name={n} size={20} />
            </button>
          ))}
        </span>
      )}
    </span>
  );
}

/** Malé tlačítko oko/přeškrtnuté oko pro skrytí/zobrazení bloku (roh sloupce). */
export function HideToggle({ hidden, onToggle }: { hidden: boolean; onToggle: () => void }) {
  const { enabled } = useEdit();
  if (!enabled) return null;
  return (
    <div className="sk-ed-toolbar sk-ed-toolbar-corner">
      <button type="button" onClick={stop(onToggle)} title={hidden ? 'Zobrazit sloupec' : 'Skrýt sloupec'}>
        {hidden ? <Icon.eyeOff size={16} /> : <Icon.eye size={16} />}
      </button>
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

type RowActionsProps = { hidden: boolean; onToggleHidden: () => void; onDelete: () => void };

/** Dvojice tlačítek (očičko / popelnice) pro položky zón bez vlastního editačního dialogu — text se upravuje inline. */
export function RowActions({ hidden, onToggleHidden, onDelete }: RowActionsProps) {
  const { enabled } = useEdit();
  if (!enabled) return null;
  return (
    <div className="sk-ed-toolbar">
      <button type="button" onClick={stop(onToggleHidden)} title={hidden ? 'Zobrazit' : 'Skrýt'}>
        {hidden ? <Icon.eyeOff size={16} /> : <Icon.eye size={16} />}
      </button>
      <button type="button" onClick={stop(onDelete)} title="Smazat"><Icon.trash size={16} /></button>
    </div>
  );
}

/** Čárkované tlačítko „+ přidat“ pod výčtem položek (odstavce, pravidla, řádky…). */
export function AddRowSlot({ onClick, label }: { onClick: () => void; label: string }) {
  const { enabled } = useEdit();
  if (!enabled) return null;
  return (
    <button type="button" className="sk-ed-add-row" onClick={onClick}>
      <Icon.plus size={14} /> {label}
    </button>
  );
}

type EditableNoteProps = {
  value: string;
  onSave: (next: string) => void;
  className?: string;
  /** Text tlačítka pro přidání, když je poznámka prázdná. */
  addLabel?: string;
};

/**
 * Volitelný uživatelský text (poznámka) na konci bloku. Mimo editaci se prázdná
 * poznámka nevykreslí. V editaci: prázdná → klikatelný placeholder „přidat“,
 * vyplněná → inline úprava + tlačítko „odebrat“ (vymaže obsah).
 */
export function EditableNote({ value, onSave, className, addLabel = '+ Přidat text' }: EditableNoteProps) {
  const { enabled } = useEdit();
  if (!enabled) return value ? createElement('p', { className }, renderInline(value)) : null;
  return (
    <div className="sk-ed-note-block">
      <EditableText as="p" multiline className={className} value={value} onSave={onSave} placeholder={addLabel} />
      {value && (
        <button type="button" className="sk-ed-note-del" title="Odebrat text" onClick={stop(() => onSave(''))}>
          <Icon.trash size={13} />
        </button>
      )}
    </div>
  );
}
