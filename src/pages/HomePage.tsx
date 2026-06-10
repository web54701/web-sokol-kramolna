import { Icon } from '../components/Icon';
import { IconByName } from '../components/IconByName';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useZone, useSingleton, useGlobalContact, visibilityClass, type ZoneObject } from '../content/hooks';
import { renderInline } from '../content/inline';
import type { HeroData, ActionCardData, InfoColData } from '../content/types';
import type { Route } from '../types';

type Props = {
  onNavigate: (route: Route) => void;
  isAdmin?: boolean;
  onAdminActivate?: () => void;
};

export function HomePage({ onNavigate, isAdmin, onAdminActivate }: Props) {
  const hero = useSingleton<HeroData>('home.hero');
  const cards = useZone<ActionCardData>('home.cards');
  const infoCols = useZone<InfoColData>('home.info');

  return (
    <div className="sk-page skp-home">
      <Header active={null} onNavigate={onNavigate} isAdmin={isAdmin} onAdminActivate={onAdminActivate} />

      <div className="skp-home-scroll">
        {hero && (
          <div className="skp-home-hero">
            <img src={hero.img} alt={hero.imgAlt} />
            <div className="skp-home-hero-scrim" />
            <div className="skp-home-hero-text">
              <h1>{hero.title}</h1>
              <p>{renderInline(hero.subtitle)}</p>
            </div>
          </div>
        )}

        <div className="skp-home-cards">
          {cards.map((c) => (
            <div
              key={c.id}
              className={`sk-action-card is-${c.data.tone}` + visibilityClass(c.visibility)}
              onClick={() => onNavigate(c.data.route as Route)}
            >
              <div className="sk-action-icon"><img src={c.data.img} alt="" /></div>
              <div className="sk-action-body">
                <div className="sk-action-title">{c.data.title}</div>
                <div className="sk-action-sub">{renderInline(c.data.sub)}</div>
                <div className="sk-action-cta">{c.data.cta} <Icon.arrowR size={20} /></div>
              </div>
            </div>
          ))}
        </div>

        <section className="sk-info-row skp-info-row">
          {infoCols.map((col) => <InfoCol key={col.id} col={col} />)}
        </section>

        <Footer />
      </div>
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
