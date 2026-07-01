import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useZoneAll, useSingletonObject, useGlobalContact, visibilityClass } from '../content/hooks';
import { useEdit } from '../content/edit-context';
import { EditableText, EditableIcon, RowActions, AddRowSlot } from '../content/editable';
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
  const edit = useEdit();
  const head = useSingletonObject<PageheadData>('kontakt.head');
  const allCards = useZoneAll<ContactCardData>('kontakt.cards');
  const map = useSingletonObject<MapData>('kontakt.map');
  const contact = useGlobalContact();

  const cards = edit.enabled ? allCards : allCards.filter((c) => !c.hidden);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const isWeekendToday = dayOfWeek === 0 || dayOfWeek === 6;
  const todayName = DOW_FULL[dayOfWeek];

  const saveHead = (patch: Partial<PageheadData>) => {
    if (head) void edit.patchData(head.id, { ...head.data, ...patch });
  };

  return (
    <div className="sk-page skp-page">
      <Header active="kontakt" onNavigate={onNavigate} isAdmin={isAdmin} onAdminActivate={onAdminActivate} />

      <div className="sk-pagewrap">
        <div className="sk-pagehead">
          <div className="sk-pagehead-l">
            <EditableText as="h1" value={head?.data.title ?? ''} onSave={(t) => saveHead({ title: t })} />
            <EditableText as="p" multiline value={head?.data.intro ?? ''} onSave={(t) => saveHead({ intro: t })} />
          </div>
        </div>

        <div className="skp-scroll">
          <div className="skp-contact-grid">
            <div className="skp-contact-cards">
              {cards.map((c) => (
                <div key={c.id} className={'skp-contact-card sk-ed-row' + visibilityClass(c.visibility) + (c.hidden ? ' sk-ed-hidden' : '')}>
                  <div className="ic">
                    <EditableIcon name={c.data.icon} onPick={(n) => void edit.patchData(c.id, { ...c.data, icon: n })} />
                  </div>
                  <div>
                    <EditableText as="div" className="lbl" value={c.data.label} onSave={(t) => void edit.patchData(c.id, { ...c.data, label: t })} />
                    <div className="big">{cardBig(c.data, contact)}</div>
                    <div className="small">
                      {c.data.bigSource === 'address'
                        ? contact.addressLines.flatMap((line, i) => i === 0 ? [line] : [<br key={i} />, line])
                        : <EditableText as="span" multiline value={c.data.note} onSave={(t) => void edit.patchData(c.id, { ...c.data, note: t })} />}
                    </div>
                  </div>
                  <RowActions
                    hidden={c.hidden}
                    onToggleHidden={() => void edit.setHidden(c.id, !c.hidden)}
                    onDelete={() => { if (window.confirm('Opravdu smazat kontaktní kartu?')) void edit.remove(c.id); }}
                  />
                </div>
              ))}
              <AddRowSlot
                label="Přidat kontaktní kartu"
                onClick={() => void edit.createInZone('kontakt.cards', 'contact_card', {
                  icon: 'pin', label: 'Nový kontakt', bigSource: 'custom', big: '', note: '',
                })}
              />

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
                  src={map.data.url}
                  width="400"
                  height="280"
                  style={{ border: 'none', width: '100%', height: '100%', display: 'block' }}
                  title={map.data.title}
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
