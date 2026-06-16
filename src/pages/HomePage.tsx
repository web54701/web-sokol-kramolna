import { lazy, Suspense, useState } from 'react';
import { Icon } from '../components/Icon';
import { IconByName } from '../components/IconByName';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useZoneAll, useSingletonObject, useGlobalContact, visibilityClass, type ZoneObject } from '../content/hooks';
import { useEdit } from '../content/edit-context';
import { EditableText, EditableImage, CardOverlay, AddCardSlot } from '../content/editable';
import { HERO_IMAGE_SPEC } from '../content/image-specs';
import { renderInline } from '../content/inline';
import type { HeroData, ActionCardData, InfoColData, TextSize } from '../content/types';
import type { Route } from '../types';

// Modál karty se načítá líně — do veřejného balíčku se tak nedostane admin kód.
const CardEditModal = lazy(() =>
  import('../admin/CardEditModal').then((m) => ({ default: m.CardEditModal })));

type Props = {
  onNavigate: (route: Route) => void;
  isAdmin?: boolean;
  onAdminActivate?: () => void;
};

/** CSS třída velikosti písma (md = výchozí, bez třídy). */
function sizeClass(size?: TextSize): string | undefined {
  return size && size !== 'md' ? `sk-size-${size}` : undefined;
}

export function HomePage({ onNavigate, isAdmin, onAdminActivate }: Props) {
  const edit = useEdit();
  const hero = useSingletonObject<HeroData>('home.hero');
  const allCards = useZoneAll<ActionCardData>('home.cards');
  const infoCols = useZoneAll<InfoColData>('home.info');
  const [creating, setCreating] = useState(false);

  // V editaci ukazujeme i skryté objekty (ztlumeně); na webu jen viditelné.
  const cards = edit.enabled ? allCards : allCards.filter((c) => !c.hidden);
  const visibleInfo = edit.enabled ? infoCols : infoCols.filter((c) => !c.hidden);

  const saveHero = (data: HeroData) => { if (hero) void edit.patchData(hero.id, data); };

  return (
    <div className="sk-page skp-home">
      <Header active={null} onNavigate={onNavigate} isAdmin={isAdmin} onAdminActivate={onAdminActivate} />

      <div className="skp-home-scroll">
        {hero && (
          <div className="skp-home-hero">
            <EditableImage
              spec={HERO_IMAGE_SPEC}
              current={hero.data.img}
              onPick={(url) => saveHero({ ...hero.data, img: url })}
            >
              <img src={hero.data.img} alt={hero.data.imgAlt} />
            </EditableImage>
            <div className="skp-home-hero-scrim" />
            <div className="skp-home-hero-text">
              <EditableText
                as="h1"
                className={sizeClass(hero.data.titleSize)}
                value={hero.data.title}
                size={hero.data.titleSize}
                onSize={(s) => saveHero({ ...hero.data, titleSize: s })}
                onSave={(t) => saveHero({ ...hero.data, title: t })}
              />
              <EditableText
                as="p"
                multiline
                className={sizeClass(hero.data.subtitleSize)}
                value={hero.data.subtitle}
                size={hero.data.subtitleSize}
                onSize={(s) => saveHero({ ...hero.data, subtitleSize: s })}
                onSave={(t) => saveHero({ ...hero.data, subtitle: t })}
              />
            </div>
          </div>
        )}

        <div className="skp-home-cards">
          {cards.map((c) => <ActionCard key={c.id} card={c} onNavigate={onNavigate} />)}
          <AddCardSlot onClick={() => setCreating(true)} />
        </div>

        <section className="sk-info-row skp-info-row">
          {visibleInfo.map((col) => <InfoCol key={col.id} col={col} />)}
        </section>

        <Footer />
      </div>

      {creating && (
        <Suspense fallback={null}>
          <CardEditModal
            onSave={(data) => { void edit.createInZone('home.cards', 'action_card', data); setCreating(false); }}
            onClose={() => setCreating(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

function ActionCard({ card, onNavigate }: { card: ZoneObject<ActionCardData>; onNavigate: (route: Route) => void }) {
  const edit = useEdit();
  const [editingCard, setEditingCard] = useState(false);
  const c = card.data;
  const save = (data: ActionCardData) => { void edit.patchData(card.id, data); };

  return (
    <div
      className={`sk-action-card is-${c.tone}` + visibilityClass(card.visibility) + (card.hidden ? ' sk-ed-hidden' : '')}
      onClick={edit.enabled ? undefined : () => onNavigate(c.route as Route)}
    >
      <CardOverlay
        hidden={card.hidden}
        onEdit={() => setEditingCard(true)}
        onToggleHidden={() => void edit.setHidden(card.id, !card.hidden)}
        onDelete={() => { if (window.confirm('Opravdu smazat tuto kartu?')) void edit.remove(card.id); }}
      />
      <div className="sk-action-icon"><img src={c.img} alt="" /></div>
      <div className="sk-action-body">
        <EditableText as="div" className="sk-action-title" value={c.title} onSave={(t) => save({ ...c, title: t })} />
        <EditableText as="div" className="sk-action-sub" multiline value={c.sub} onSave={(t) => save({ ...c, sub: t })} />
        <div className="sk-action-cta">
          <EditableText as="span" value={c.cta} onSave={(t) => save({ ...c, cta: t })} />
          <Icon.arrowR size={20} />
        </div>
      </div>
      {editingCard && (
        <Suspense fallback={null}>
          <CardEditModal
            initial={c}
            onSave={(data) => { save(data); setEditingCard(false); }}
            onClose={() => setEditingCard(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

function InfoCol({ col }: { col: ZoneObject<InfoColData> }) {
  const contact = useGlobalContact();
  const { icon, title, kind, body } = col.data;

  return (
    <div className={'sk-info-col' + visibilityClass(col.visibility)}>
      <h4><span className="sk-info-icon"><IconByName name={icon} /></span> {title}</h4>
      {kind === 'contact' && (
        <p>{contact.phone}<br />{contact.email}</p>
      )}
      {kind === 'hours' && (
        <>
          <ul>
            {contact.hours.map((h, i) => (
              <li key={i}><span className="k">{h.daysShort}</span>{h.time}</li>
            ))}
          </ul>
          {body && (
            <p style={{ marginTop: 8, fontSize: 12, color: 'var(--sk-mute)' }}>
              {body}
            </p>
          )}
        </>
      )}
      {kind === 'text' && <p>{renderInline(body)}</p>}
    </div>
  );
}
