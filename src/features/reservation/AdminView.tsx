import React, { useMemo, useState, useEffect } from 'react';
import { Icon } from '../../components/Icon';
import { type ReservationModeKey } from './reservation.config';
import { DOW, epochDay, fmtDM, fmtDMY, toISODate, HOURS, weekStart } from './date-utils';

type Reservation = {
  id: number;
  activity: string;
  date: string;
  hours: number[];
  name: string;
  email: string;
  phone: string;
  note: string;
  payment: string;
  price: number;
  created_at: string;
};

function shortName(full: string): string {
  const parts = full.trim().split(' ');
  return parts.length < 2 ? full : `${parts[0]} ${parts[1][0]}.`;
}

function timeRange(hours: number[]): string {
  const sorted = [...hours].sort((a, b) => a - b);
  return `${sorted[0]}:00 – ${sorted[sorted.length - 1] + 1}:00`;
}

export function AdminView({ mode }: { mode: ReservationModeKey }) {
  const NOW = new Date();
  const [weekOff, setWeekOff] = useState(0);
  const [popup, setPopup] = useState<Reservation | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const week = useMemo(() => {
    const start = weekStart(NOW, weekOff);
    return Array.from({ length: 7 }, (_, i) =>
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOff]);

  useEffect(() => {
    const from = toISODate(week[0]);
    const to = toISODate(week[6]);
    fetch(`/api/reservations?activity=${mode}&from=${from}&to=${to}`)
      .then(r => r.json())
      .then((data: unknown) => setReservations(data as Reservation[]))
      .catch(() => setReservations([]));
  }, [week, mode]);

  // Mapa pro rychlé vyhledávání v kalendářní mřížce: klíč = "YYYY-MM-DD-h"
  const resMap = useMemo(() => {
    const m = new Map<string, Reservation>();
    for (const r of reservations) {
      for (const h of r.hours) m.set(`${r.date}-${h}`, r);
    }
    return m;
  }, [reservations]);

  const nowISO = toISODate(NOW);
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
            <div className="sk-admin-cal-corner" />
            {week.map((d) => {
              const isToday = epochDay(d) === nowDn;
              return (
                <div key={d.getTime()} className={`sk-admin-cal-head${isToday ? ' today' : ''}`}>
                  {DOW[d.getDay()]} {fmtDM(d)}
                </div>
              );
            })}

            {HOURS.map((h) => (
              <React.Fragment key={h}>
                <div className="sk-admin-cal-time">{h}:00</div>
                {week.map((d) => {
                  const key = `${toISODate(d)}-${h}`;
                  const res = resMap.get(key);
                  const past = toISODate(d) < nowISO;
                  return (
                    <div
                      key={key}
                      className={`sk-admin-cal-cell${res ? ' booked' : ''}${past ? ' past' : ''}`}
                      onClick={res ? () => setPopup(res) : undefined}
                    >
                      {res && <span className="sk-admin-cal-name">{shortName(res.name)}</span>}
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
                {[...reservations]
                  .sort((a, b) => a.date !== b.date ? a.date.localeCompare(b.date) : Math.min(...a.hours) - Math.min(...b.hours))
                  .map((r) => {
                    const date = new Date(r.date + 'T12:00:00');
                    return (
                      <tr
                        key={r.id}
                        className={r.date < nowISO ? 'past' : ''}
                        onClick={() => setPopup(r)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="sk-admin-td-date">{DOW[date.getDay()]} {fmtDM(date)}</td>
                        <td className="sk-admin-td-time">{timeRange(r.hours)}</td>
                        <td>{r.name}</td>
                        <td><a href={`mailto:${r.email}`} className="sk-admin-link" onClick={e => e.stopPropagation()}>{r.email}</a></td>
                        <td className="sk-admin-td-phone">{r.phone || '—'}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        <p className="sk-admin-note">
          <Icon.shield size={13} /> Přístup pouze pro správce
        </p>
      </div>

      {/* ---- Popup kontaktu ---- */}
      {popup && (() => {
        const date = new Date(popup.date + 'T12:00:00');
        return (
          <div className="sk-admin-popup-overlay" onClick={() => setPopup(null)}>
            <div className="sk-admin-popup" onClick={e => e.stopPropagation()}>
              <div className="sk-admin-popup-header">
                <button className="sk-admin-popup-close" onClick={() => setPopup(null)} aria-label="Zavřít">
                  <Icon.close size={18} />
                </button>
                <div className="sk-admin-popup-name">{popup.name}</div>
                <div className="sk-admin-popup-when">
                  {DOW[date.getDay()]} {fmtDMY(date)}
                  {' · '}{timeRange(popup.hours)}
                </div>
              </div>
              <div className="sk-admin-popup-body">
                <a href={`mailto:${popup.email}`} className="sk-admin-popup-row">
                  <Icon.email size={15} />
                  <span>{popup.email}</span>
                </a>
                {popup.phone ? (
                  <a href={`tel:${popup.phone.replace(/\s/g, '')}`} className="sk-admin-popup-row">
                    <Icon.phone size={15} />
                    <span>{popup.phone}</span>
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
        );
      })()}
    </div>
  );
}
