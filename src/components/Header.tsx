import { useState, useRef, lazy, Suspense } from 'react';
import { Icon } from './Icon';
import { useZoneAll, useSingletonObject, visibilityClass, type ZoneObject } from '../content/hooks';
import { useEdit } from '../content/edit-context';
import { EditableText, EditableImage, RowActions, AddRowSlot } from '../content/editable';
import { LOGO_IMAGE_SPEC } from '../content/image-specs';
import type { NavItemData, LogoData } from '../content/types';
import type { Route } from '../types';

// Editační dialog položky menu (cílová stránka) se načítá líně — admin kód
// se nedostane do veřejného balíčku (stejný vzor jako CardEditModal na HomePage).
const ObjectForm = lazy(() =>
  import('../admin/ObjectForm').then((m) => ({ default: m.ObjectForm })));

type HeaderProps = {
  /** Route aktivní stránky (zvýraznění v menu), null na homepage. */
  active: Route | null;
  onNavigate: (route: Route) => void;
  isAdmin?: boolean;
  onAdminActivate?: () => void;
};

export function Header({ active, onNavigate, isAdmin, onAdminActivate }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const tapTimes = useRef<number[]>([]);
  const edit = useEdit();
  // Hlavička je editovatelná jen při fokusu na chrome (sekce Logo a menu) — jinak
  // kliky v navigaci dál slouží k přepínání stránek (na plátně i na webu).
  const chromeEdit = edit.enabled && edit.chromeEditable;
  const allNavItems = useZoneAll<NavItemData>('global.nav');
  const navItems = chromeEdit ? allNavItems : allNavItems.filter((it) => !it.hidden);
  const logoObj = useSingletonObject<LogoData>('global.logo');
  const logo = logoObj?.data;
  const [editItem, setEditItem] = useState<ZoneObject<NavItemData> | null>(null);

  const go = (route: Route) => { setOpen(false); onNavigate(route); };

  const saveLogo = (patch: Partial<LogoData>) => {
    if (logoObj) void edit.patchData(logoObj.id, { ...logoObj.data, ...patch });
  };

  const moveNav = (index: number, delta: number) => {
    const ids = navItems.map((it) => it.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    void edit.reorder('global.nav', ids);
  };

  const handleLogoImgClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    tapTimes.current = [...tapTimes.current.filter(t => now - t < 2000), now];
    if (tapTimes.current.length >= 5) {
      tapTimes.current = [];
      onAdminActivate?.();
    }
  };

  const logoImg = (
    <img src={logo?.img ?? '/logo_sokol.png'} alt="" className="sk-logo-img" onClick={chromeEdit ? undefined : handleLogoImgClick} />
  );

  return (
    <>
      <header className="sk-header">
        <div className="sk-logo" onClick={chromeEdit ? undefined : () => go('home')} aria-label="Sokol Kramolna">
          {chromeEdit ? (
            <EditableImage spec={LOGO_IMAGE_SPEC} current={logo?.img} onPick={(url) => saveLogo({ img: url })}>
              {logoImg}
            </EditableImage>
          ) : logoImg}
          <div className="sk-logo-text">
            {chromeEdit ? (
              <>
                <EditableText as="span" value={logo?.line1 ?? ''} onSave={(t) => saveLogo({ line1: t })} placeholder="1. řádek názvu" />
                <EditableText as="span" value={logo?.line2 ?? ''} onSave={(t) => saveLogo({ line2: t })} placeholder="2. řádek názvu" />
              </>
            ) : (
              <>
                <span>{logo?.line1 ?? ''}</span>
                <span>{logo?.line2 ?? ''}</span>
              </>
            )}
          </div>
          {isAdmin && <span className="sk-admin-chip"><Icon.shield size={11} /> Správce</span>}
        </div>
        <nav className="sk-nav">
          {navItems.map((it, i) => chromeEdit ? (
            <span
              key={it.id}
              className={'sk-navlink sk-ed-row' + (it.data.route === active ? ' is-active' : '') + visibilityClass(it.visibility) + (it.hidden ? ' sk-ed-hidden' : '')}
            >
              <EditableText as="span" value={it.data.label} onSave={(t) => void edit.patchData(it.id, { ...it.data, label: t })} />
              <RowActions
                hidden={it.hidden}
                onEdit={() => setEditItem(it)}
                onMoveUp={i > 0 ? () => moveNav(i, -1) : undefined}
                onMoveDown={i < navItems.length - 1 ? () => moveNav(i, 1) : undefined}
                onToggleHidden={() => void edit.setHidden(it.id, !it.hidden)}
                onDelete={() => { if (window.confirm('Opravdu smazat položku menu?')) void edit.remove(it.id); }}
              />
            </span>
          ) : (
            <a
              key={it.id}
              className={'sk-navlink' + (it.data.route === active ? ' is-active' : '') + visibilityClass(it.visibility)}
              onClick={() => go(it.data.route as Route)}
            >
              {it.data.label}
            </a>
          ))}
          {chromeEdit && (
            <AddRowSlot
              label="Přidat položku"
              onClick={() => void edit.createInZone('global.nav', 'nav_item', { label: 'Nová položka', route: 'home' })}
            />
          )}
        </nav>
        <button
          className={'sk-mob-btn' + (open ? ' is-open' : '')}
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Zavřít menu' : 'Otevřít menu'}
        >
          {open ? <Icon.close size={24} /> : <Icon.menu size={24} />}
        </button>
      </header>

      {open && (
        <div className="sk-mob-overlay" onClick={() => setOpen(false)}>
          {/* Mobilní overlay je záměrně jen pro čtení — na editaci je stísněný;
              položky se upravují v desktopovém zobrazení nebo ve formuláři. */}
          <nav className="sk-mob-nav" onClick={(e) => e.stopPropagation()}>
            {navItems.map((it) => (
              <a
                key={it.id}
                className={'sk-mob-navlink' + (it.data.route === active ? ' is-active' : '') + visibilityClass(it.visibility)}
                onClick={chromeEdit ? undefined : () => go(it.data.route as Route)}
              >
                {it.data.label}
              </a>
            ))}
          </nav>
        </div>
      )}

      {editItem && (
        <Suspense fallback={null}>
          <ObjectForm
            title="Položka menu"
            typeKey="nav_item"
            initial={editItem.data}
            onSave={(data) => edit.patchData(editItem.id, data)}
            onClose={() => setEditItem(null)}
          />
        </Suspense>
      )}
    </>
  );
}
