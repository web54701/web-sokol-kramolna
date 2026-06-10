import { IconByName } from '../components/IconByName';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useZone, useSingleton, useGlobalContact, visibilityClass } from '../content/hooks';
import { renderInline } from '../content/inline';
import type { PageheadData, ContactCardData, ContactGlobalData, MapData } from '../content/types';
import type { Route } from '../types';

type Props = { onNavigate: (route: Route) => void; isAdmin?: boolean; onAdminActivate?: () => void };

const DOW_FULL = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];

function cardBig(card: ContactCardData, contact: ContactGlobalData): string {
  switch (card.bigSource) {
    case 'phone': return contact.phone;
    case 'email': return contact.email;
    case 'address': return contact.orgName;
    default: return card.big;
  }
}

export function KontaktPage({ onNavigate, isAdmin, onAdminActivate }: Props) {
  const head = useSingleton<PageheadData>('kontakt.head');
  const cards = useZone<ContactCardData>('kontakt.cards');
  const map = useSingleton<MapData>('kontakt.map');
  const contact = useGlobalContact();

  const today = new Date();
  const dayOfWeek = today.getDay();
  const isWeekendToday = dayOfWeek === 0 || dayOfWeek === 6;
  const todayName = DOW_FULL[dayOfWeek];

  return (
    <div className="sk-page skp-page">
      <Header active="kontakt" onNavigate={onNavigate} isAdmin={isAdmin} onAdminActivate={onAdminActivate} />

      <div className="sk-pagewrap">
        <div className="sk-pagehead">
          <div className="sk-pagehead-l">
            <h1>{head?.title}</h1>
            <p>{head?.intro}</p>
          </div>
        </div>

        <div className="skp-scroll">
          <div className="skp-contact-grid">
            <div className="skp-contact-cards">
              {cards.map((c) => (
                <div key={c.id} className={'skp-contact-card' + visibilityClass(c.visibility)}>
                  <div className="ic"><IconByName name={c.data.icon} /></div>
                  <div>
                    <div className="lbl">{c.data.label}</div>
                    <div className="big">{cardBig(c.data, contact)}</div>
                    <div className="small">
                      {c.data.bigSource === 'address'
                        ? contact.addressLines.flatMap((line, i) => i === 0 ? [line] : [<br key={i} />, line])
                        : renderInline(c.data.note)}
                    </div>
                  </div>
                </div>
              ))}

              <section className="sk-panel sk-hours" style={{ marginTop: 2 }}>
                <h3>{contact.hoursTitle}</h3>
                <div className="skp-hours-table">
                  {contact.hours.map((row, i) => {
                    const isToday = row.weekend === isWeekendToday;
                    return (
                      <div key={i} className={'row' + (isToday ? ' today' : '')}>
                        <span className="d">
                          {row.days}
                          {isToday && <span style={{ fontWeight: 400, marginLeft: 6 }}>({todayName})</span>}
                        </span>
                        <span>{row.time}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="note">{contact.hoursNote}</p>
              </section>
            </div>

            {map && (
              <div className="skp-map">
                <iframe
                  src={map.url}
                  width="400"
                  height="280"
                  style={{ border: 'none', width: '100%', height: '100%', display: 'block' }}
                  title={map.title}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
