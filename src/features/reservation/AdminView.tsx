import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { MODES, type ReservationModeKey } from './reservation.config';
import { DOW, epochDay, fmtDM, fmtDMY, seed, HOURS, weekStart } from './date-utils';

const FAKE_PEOPLE = [
  { name: 'Jan Novák',        email: 'jan.novak@email.cz',       phone: '777 123 456' },
  { name: 'Petra Svobodová',  email: 'p.svobodova@gmail.com',    phone: '602 456 789' },
  { name: 'Tomáš Krejčí',    email: 't.krejci@seznam.cz',       phone: '' },
  { name: 'Marie Horáková',   email: 'horakova.m@post.cz',       phone: '731 654 321' },
  { name: 'Ondřej Blažek',   email: 'ondrej.blazek@email.cz',   phone: '605 111 222' },
  { name: 'Lucie Marková',    email: 'l.markova@centrum.cz',     phone: '775 888 999' },
  { name: 'Pavel Dvořák',    email: 'p.dvorak@gmail.com',        phone: '' },
  { name: 'Eva Procházková',  email: 'eva.prochazka@email.cz',   phone: '723 456 789' },
  { name: 'Michal Beneš',    email: 'michal.benes@volny.cz',    phone: '731 000 111' },
  { name: 'Hana Červenková', email: 'h.cervenkova@seznam.cz',   phone: '608 222 333' },
  { name: 'Radek Šimánek',   email: 'r.simanek@email.cz',       phone: '' },
  { name: 'Zuzana Pokorná',  email: 'z.pokorna@gmail.com',       phone: '776 444 555' },
];

type Reservation = {
  key: string;
  date: Date;
  h: number;
  person: typeof FAKE_PEOPLE[number];
  isPast: boolean;
};

type Popup = { reservation: Reservation };

function shortName(full: string): string {
  const parts = full.trim().split(' ');
  return parts.length < 2 ? full : `${parts[0]} ${parts[1][0]}.`;
}

export function AdminView({ mode }: { mode: ReservationModeKey }) {
  const cfg = MODES[mode];
  const NOW = new Date();
  const [weekOff, setWeekOff] = useState(0);
  const [popup, setPopup] = useState<Popup | null>(null);

  const week = useMemo(() => {
    const start = weekStart(NOW, weekOff);
    return Array.from({ length: 7 }, (_, i) =>
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOff]);

  const reservations = useMemo<Reservation[]>(() => {
    const result: Reservation[] = [];
    const nowDn = epochDay(NOW);
    for (const date of week) {
      const dn = epochDay(date);
      const isPast = dn < nowDn;
      for (const h of HOURS) {
        const s = seed(dn, h);
        if (mode === 'tenis') {
          const wd = date.getDay();
          const weekend = wd === 0 || wd === 6;
          const busy = s > 0.66 || (weekend && s > 0.5);
          if (busy) {
            result.push({ key: `${dn}-${h}`, date, h, person: FAKE_PEOPLE[Math.floor(s * FAKE_PEOPLE.length)], isPast });
          }
        } else {
          const capacity = cfg.capacity ?? 15;
          const peak = h >= 16 && h <= 19;
          const used = Math.floor(s * (peak ? 17 : 11));
          if (Math.max(0, capacity - used) === 0) {
            result.push({ key: `${dn}-${h}`, date, h, person: FAKE_PEOPLE[Math.floor(s * FAKE_PEOPLE.length)], isPast });
          }
        }
      }
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week, mode]);

  const resMap = useMemo(() => {
    const m = new Map<string, Reservation>();
    for (const r of reservations) m.set(r.key, r);
    return m;
  }, [reservations]);

  const nowDn = epochDay(NOW);
  const rangeLabel = `${fmtDM(week[0])} – ${fmtDMY(week[6])}`;

  const weekNav = (
    <div className="sk-admin-nav">
      <button
        className="sk-cal-pill icon"
        onClick={() => setWeekOff(w => Math.max(0, w - 1))}
        disabled={weekOff === 0}
        style={weekOff === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
      >
        <Icon.chev dir="left" />
      </button>
      <button className="sk-cal-pill" onClick={() => setWeekOff(0)}>Tento týden</button>
      <button
        className="sk-cal-pill icon"
        onClick={() => setWeekOff(w => Math.min(8, w + 1))}
        disabled={weekOff === 8}
        style={weekOff === 8 ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
      >
        <Icon.chev />
      </button>
    </div>
  );

  return (
    <div className="skp-scroll">
      <div className="sk-admin-wrap">

        {/* ---- Hlavička ---- */}
        <div className="sk-admin-bar">
          <span className="sk-admin-title">
            <Icon.cal /> Rezervace · {rangeLabel}
          </span>
          {weekNav}
        </div>

        {/* ---- Kalendář ---- */}
        <div className="sk-admin-cal-wrap">
          <div
            className="sk-admin-cal-grid"
            style={{
              gridTemplateColumns: `52px repeat(7, minmax(80px, 1fr))`,
              gridTemplateRows: `30px repeat(${HOURS.length}, 42px)`,
            }}
          >
            {/* Hlavičky dnů */}
            <div className="sk-admin-cal-corner" />
            {week.map((d) => {
              const isToday = epochDay(d) === nowDn;
              return (
                <div key={d.getTime()} className={`sk-admin-cal-head${isToday ? ' today' : ''}`}>
                  {DOW[d.getDay()]} {fmtDM(d)}
                </div>
              );
            })}

            {/* Řádky hodin */}
            {HOURS.map((h) => (
              <React.Fragment key={h}>
                <div className="sk-admin-cal-time">{h}:00</div>
                {week.map((d) => {
                  const dn = epochDay(d);
                  const key = `${dn}-${h}`;
                  const res = resMap.get(key);
                  const past = dn < nowDn;
                  return (
                    <div
                      key={key}
                      className={`sk-admin-cal-cell${res ? ' booked' : ''}${past ? ' past' : ''}`}
                      onClick={res ? () => setPopup({ reservation: res }) : undefined}
                    >
                      {res && <span className="sk-admin-cal-name">{shortName(res.person.name)}</span>}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ---- Tabulka ---- */}
        <h4 className="sk-admin-section-head">Seznam rezervací</h4>
        {reservations.length === 0 ? (
          <div className="sk-admin-empty">Žádné rezervace v tomto týdnu.</div>
        ) : (
          <div className="sk-admin-table-wrap">
            <table className="sk-admin-table">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Čas</th>
                  <th>Jméno</th>
                  <th>E-mail</th>
                  <th>Telefon</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr
                    key={r.key}
                    className={r.isPast ? 'past' : ''}
                    onClick={() => setPopup({ reservation: r })}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="sk-admin-td-date">{DOW[r.date.getDay()]} {fmtDM(r.date)}</td>
                    <td className="sk-admin-td-time">{r.h}:00 – {r.h + 1}:00</td>
                    <td>{r.person.name}</td>
                    <td><a href={`mailto:${r.person.email}`} className="sk-admin-link" onClick={e => e.stopPropagation()}>{r.person.email}</a></td>
                    <td className="sk-admin-td-phone">{r.person.phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="sk-admin-note">
          <Icon.shield size={13} /> Simulovaná data · Přístup pouze pro správce
        </p>
      </div>

      {/* ---- Popup kontaktu ---- */}
      {popup && (
        <div className="sk-admin-popup-overlay" onClick={() => setPopup(null)}>
          <div className="sk-admin-popup" onClick={e => e.stopPropagation()}>
            <div className="sk-admin-popup-header">
              <button className="sk-admin-popup-close" onClick={() => setPopup(null)} aria-label="Zavřít">
                <Icon.close size={18} />
              </button>
              <div className="sk-admin-popup-name">{popup.reservation.person.name}</div>
              <div className="sk-admin-popup-when">
                {DOW[popup.reservation.date.getDay()]} {fmtDMY(popup.reservation.date)}
                {' · '}{popup.reservation.h}:00 – {popup.reservation.h + 1}:00
              </div>
            </div>
            <div className="sk-admin-popup-body">
              <a href={`mailto:${popup.reservation.person.email}`} className="sk-admin-popup-row">
                <Icon.email size={15} />
                <span>{popup.reservation.person.email}</span>
              </a>
              {popup.reservation.person.phone ? (
                <a href={`tel:${popup.reservation.person.phone.replace(/\s/g, '')}`} className="sk-admin-popup-row">
                  <Icon.phone size={15} />
                  <span>{popup.reservation.person.phone}</span>
                </a>
              ) : (
                <div className="sk-admin-popup-row muted">
                  <Icon.phone size={15} />
                  <span>Telefon nevyplněn</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
