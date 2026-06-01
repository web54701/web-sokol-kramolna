import React, { useMemo, useState, useEffect } from 'react';
import { Icon } from '../../components/Icon';
import { MODES, type ReservationModeKey } from './reservation.config';
import { DOW, epochDay, fmtDM, fmtDMY, toISODate, HOURS, weekStart } from './date-utils';

const HOUR_MIN = HOURS[0];
const HOUR_MAX = HOURS[HOURS.length - 1];

const DOW_LONG = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];

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
  confirmed_at: string | null;
};

type BlockedSlot = {
  id: number;
  activity: string;
  type: 'recurring' | 'specific';
  dow: number | null;
  date: string | null;
  hours: number[] | null;
};

type AddForm = {
  date: string;
  startHour: number;
  endHour: number;
  name: string;
  email: string;
  phone: string;
  note: string;
  payment: 'hotove' | 'prevod';
};

type BlockForm = {
  type: 'recurring' | 'specific';
  dow: number;
  date: string;
  allDay: boolean;
  startHour: number;
  endHour: number;
};

function timeRange(hours: number[]): string {
  const sorted = [...hours].sort((a, b) => a - b);
  return `${sorted[0]}:00 – ${sorted[sorted.length - 1] + 1}:00`;
}

function blockLabel(b: BlockedSlot): string {
  const timeStr = b.hours === null
    ? 'celý den'
    : `${Math.min(...b.hours)}:00 – ${Math.max(...b.hours) + 1}:00`;
  if (b.type === 'recurring') {
    return `Každé ${DOW_LONG[b.dow ?? 0].toLowerCase()} – ${timeStr}`;
  }
  const d = new Date((b.date ?? '') + 'T12:00:00');
  return `${DOW[d.getDay()]} ${fmtDMY(d)} – ${timeStr}`;
}

export function AdminView({ mode }: { mode: ReservationModeKey }) {
  const NOW = new Date();
  const cfg = MODES[mode];

  // --- Navigace ---
  const [weekOff, setWeekOff] = useState(0);

  // --- Rezervace ---
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [popup, setPopup] = useState<Reservation | null>(null);
  const [actionLoading, setActionLoading] = useState<'confirm' | 'delete' | 'patch' | null>(null);
  const [editHours, setEditHours] = useState<number[] | null>(null);
  const [editName, setEditName] = useState<string | null>(null);

  // --- Přidat rezervaci ---
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddForm | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  // --- Blokování ---
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockForm, setBlockForm] = useState<BlockForm>({
    type: 'recurring', dow: 1, date: toISODate(NOW), allDay: true, startHour: 8, endHour: 20,
  });
  const [blockActionLoading, setBlockActionLoading] = useState<number | 'add' | null>(null);

  const week = useMemo(() => {
    const start = weekStart(NOW, weekOff);
    return Array.from({ length: 7 }, (_, i) =>
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOff]);

  // Načíst rezervace
  useEffect(() => {
    const from = toISODate(week[0]);
    const to = toISODate(week[6]);
    fetch(`/api/reservations?activity=${mode}&from=${from}&to=${to}`)
      .then(r => r.json())
      .then((data: unknown) => setReservations(data as Reservation[]))
      .catch(() => setReservations([]));
  }, [week, mode]);

  // Načíst blokování
  useEffect(() => {
    fetch(`/api/blocked?activity=${mode}`)
      .then(r => r.json())
      .then((data: unknown) => setBlockedSlots(data as BlockedSlot[]))
      .catch(() => setBlockedSlots([]));
  }, [mode]);

  // Reset editací při změně popupu
  useEffect(() => {
    setEditHours(null);
    setEditName(null);
  }, [popup?.id]);

  // Mapa rezervací: "YYYY-MM-DD-h" → Reservation
  const resMap = useMemo(() => {
    const m = new Map<string, Reservation>();
    for (const r of reservations) {
      for (const h of r.hours) m.set(`${r.date}-${h}`, r);
    }
    return m;
  }, [reservations]);

  // Set blokovaných slotů pro aktuální týden: "YYYY-MM-DD-h"
  const blockedSet = useMemo(() => {
    const s = new Set<string>();
    for (const b of blockedSlots) {
      for (const d of week) {
        const dateStr = toISODate(d);
        if (b.type === 'recurring' && b.dow !== d.getDay()) continue;
        if (b.type === 'specific' && b.date !== dateStr) continue;
        const hs = b.hours ?? HOURS;
        for (const h of hs) s.add(`${dateStr}-${h}`);
      }
    }
    return s;
  }, [blockedSlots, week]);

  // --- Akce nad rezervacemi ---

  async function confirmReservation(id: number) {
    setActionLoading('confirm');
    try {
      const res = await fetch(`/api/reservations/${id}`, { method: 'POST' });
      if (!res.ok) return;
      const confirmedAt = new Date().toISOString();
      setReservations(rs => rs.map(r => r.id === id ? { ...r, confirmed_at: confirmedAt } : r));
      setPopup(p => p?.id === id ? { ...p, confirmed_at: confirmedAt } : p);
    } finally {
      setActionLoading(null);
    }
  }

  async function patchReservationHours(id: number, hours: number[]) {
    setActionLoading('patch');
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        alert(data.error ?? 'Chyba při ukládání.');
        return;
      }
      setReservations(rs => rs.map(r => r.id === id ? { ...r, hours } : r));
      setPopup(p => p?.id === id ? { ...p, hours } : p);
      setEditHours(null);
    } finally {
      setActionLoading(null);
    }
  }

  async function patchReservationName(id: number, name: string) {
    setActionLoading('patch');
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        alert(data.error ?? 'Chyba při ukládání.');
        return;
      }
      setReservations(rs => rs.map(r => r.id === id ? { ...r, name } : r));
      setPopup(p => p?.id === id ? { ...p, name } : p);
      setEditName(null);
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteReservation(id: number) {
    setActionLoading('delete');
    try {
      const res = await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
      if (!res.ok) return;
      setReservations(rs => rs.filter(r => r.id !== id));
      setPopup(null);
    } finally {
      setActionLoading(null);
    }
  }

  // --- Přidat rezervaci (admin) ---

  function openAddModal() {
    const firstFuture = week.find(d => epochDay(d) >= epochDay(NOW)) ?? week[0];
    setAddForm({
      date: toISODate(firstFuture),
      startHour: 8,
      endHour: 10,
      name: '',
      email: '',
      phone: '',
      note: '',
      payment: 'hotove',
    });
    setAddModal(true);
  }

  async function submitAddReservation() {
    if (!addForm) return;
    const hours = Array.from({ length: addForm.endHour - addForm.startHour }, (_, i) => addForm.startHour + i);
    const dateObj = new Date(addForm.date + 'T12:00:00');
    const price = hours.reduce((sum, h) => sum + cfg.priceFor(dateObj, h), 0);

    setAddLoading(true);
    try {
      const res = await fetch('/api/reservations/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity: mode,
          date: addForm.date,
          hours,
          name: addForm.name,
          email: addForm.email || undefined,
          phone: addForm.phone || undefined,
          note: addForm.note || undefined,
          payment: addForm.payment,
          price,
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        alert(data.error ?? 'Chyba při přidávání.');
        return;
      }
      const data = await res.json() as { ok: boolean; id: number };
      const newRes: Reservation = {
        id: data.id,
        activity: mode,
        date: addForm.date,
        hours,
        name: addForm.name,
        email: addForm.email,
        phone: addForm.phone,
        note: addForm.note,
        payment: addForm.payment,
        price,
        created_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
      };
      if (addForm.date >= toISODate(week[0]) && addForm.date <= toISODate(week[6])) {
        setReservations(rs => [...rs, newRes]);
      }
      setAddModal(false);
      setAddForm(null);
    } finally {
      setAddLoading(false);
    }
  }

  // --- Blokování ---

  async function submitAddBlock() {
    const hours = blockForm.allDay
      ? null
      : Array.from({ length: blockForm.endHour - blockForm.startHour }, (_, i) => blockForm.startHour + i);

    setBlockActionLoading('add');
    try {
      const res = await fetch('/api/blocked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity: mode,
          type: blockForm.type,
          dow: blockForm.type === 'recurring' ? blockForm.dow : undefined,
          date: blockForm.type === 'specific' ? blockForm.date : undefined,
          hours,
        }),
      });
      if (!res.ok) { alert('Chyba při ukládání.'); return; }
      const data = await res.json() as { ok: boolean; id: number };
      const newBlock: BlockedSlot = {
        id: data.id,
        activity: mode,
        type: blockForm.type,
        dow: blockForm.type === 'recurring' ? blockForm.dow : null,
        date: blockForm.type === 'specific' ? blockForm.date : null,
        hours,
      };
      setBlockedSlots(bs => [...bs, newBlock]);
      setShowBlockForm(false);
    } finally {
      setBlockActionLoading(null);
    }
  }

  async function deleteBlock(id: number) {
    setBlockActionLoading(id);
    try {
      const res = await fetch(`/api/blocked/${id}`, { method: 'DELETE' });
      if (!res.ok) { alert('Chyba při mazání.'); return; }
      setBlockedSlots(bs => bs.filter(b => b.id !== id));
    } finally {
      setBlockActionLoading(null);
    }
  }

  // --- Výpočty ---

  const nowISO = toISODate(NOW);
  const nowDn = epochDay(NOW);
  const rangeLabel = `${fmtDM(week[0])} – ${fmtDMY(week[6])}`;

  // --- Render ---

  const weekNav = (
    <div className="sk-admin-nav">
      <button className="sk-cal-pill icon" onClick={() => setWeekOff(w => Math.max(0, w - 1))}
        disabled={weekOff === 0} style={weekOff === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}>
        <Icon.chev dir="left" />
      </button>
      <button className="sk-cal-pill" onClick={() => setWeekOff(0)}>Tento týden</button>
      <button className="sk-cal-pill icon" onClick={() => setWeekOff(w => Math.min(8, w + 1))}
        disabled={weekOff === 8} style={weekOff === 8 ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}>
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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="sk-admin-add-btn" onClick={openAddModal}>
              <Icon.plus size={15} /> Přidat rezervaci
            </button>
            {weekNav}
          </div>
        </div>

        {/* ---- Legenda ---- */}
        <div className="sk-admin-legend">
          <span className="sk-admin-legend-item confirmed">Potvrzeno</span>
          <span className="sk-admin-legend-item unconfirmed">Čeká na potvrzení</span>
          {blockedSlots.length > 0 && (
            <span className="sk-admin-legend-item blocked">Blokováno</span>
          )}
        </div>

        {/* ---- Kalendář ---- */}
        <div className="sk-admin-cal-wrap">
          <div className="sk-admin-cal-grid" style={{
            gridTemplateColumns: `52px repeat(7, minmax(80px, 1fr))`,
            gridTemplateRows: `30px repeat(${HOURS.length}, 52px)`,
          }}>
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
                  const isBlocked = blockedSet.has(key) && !res;
                  const past = toISODate(d) < nowISO;
                  const cls = [
                    'sk-admin-cal-cell',
                    res ? 'booked' : '',
                    res && !res.confirmed_at ? 'unconfirmed' : '',
                    isBlocked ? 'blocked' : '',
                    past ? 'past' : '',
                  ].filter(Boolean).join(' ');
                  return (
                    <div key={key} className={cls}
                      onClick={res ? () => setPopup(res) : undefined}>
                      {res && <span className="sk-admin-cal-name">{res.name}</span>}
                      {isBlocked && <span className="sk-admin-cal-blocked-label">Blokováno</span>}
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
                  <th>Datum</th><th>Čas</th><th>Jméno</th><th>E-mail</th><th>Telefon</th><th>Stav</th>
                </tr>
              </thead>
              <tbody>
                {[...reservations]
                  .sort((a, b) => a.date !== b.date ? a.date.localeCompare(b.date) : Math.min(...a.hours) - Math.min(...b.hours))
                  .map((r) => {
                    const date = new Date(r.date + 'T12:00:00');
                    return (
                      <tr key={r.id} className={r.date < nowISO ? 'past' : ''}
                        onClick={() => setPopup(r)} style={{ cursor: 'pointer' }}>
                        <td className="sk-admin-td-date">{DOW[date.getDay()]} {fmtDM(date)}</td>
                        <td className="sk-admin-td-time">{timeRange(r.hours)}</td>
                        <td>{r.name}</td>
                        <td>
                          {r.email
                            ? <a href={`mailto:${r.email}`} className="sk-admin-link" onClick={e => e.stopPropagation()}>{r.email}</a>
                            : <span style={{ color: 'var(--sk-mute)' }}>—</span>
                          }
                        </td>
                        <td className="sk-admin-td-phone">{r.phone || '—'}</td>
                        <td>
                          {r.confirmed_at
                            ? <span className="sk-admin-status-badge confirmed">Potvrzeno</span>
                            : <span className="sk-admin-status-badge unconfirmed">Čeká</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* ---- Blokování termínů ---- */}
        <h4 className="sk-admin-section-head" style={{ marginTop: 32 }}>Blokování termínů</h4>
        {blockedSlots.length === 0 && !showBlockForm && (
          <div className="sk-admin-empty" style={{ padding: '16px 0' }}>Žádné blokování.</div>
        )}
        {blockedSlots.length > 0 && (
          <div className="sk-admin-block-list">
            {blockedSlots.map(b => (
              <div key={b.id} className="sk-admin-block-item">
                <Icon.ban size={14} />
                <span>{blockLabel(b)}</span>
                <button
                  className="sk-admin-block-del"
                  onClick={() => void deleteBlock(b.id)}
                  disabled={blockActionLoading === b.id}
                >
                  {blockActionLoading === b.id ? '…' : <Icon.close size={13} />}
                </button>
              </div>
            ))}
          </div>
        )}
        {showBlockForm ? (
          <div className="sk-admin-block-form">
            <div className="sk-admin-block-row">
              <label>Typ:</label>
              <label className="sk-admin-block-radio">
                <input type="radio" checked={blockForm.type === 'recurring'}
                  onChange={() => setBlockForm(f => ({ ...f, type: 'recurring' }))} />
                Opakovaně
              </label>
              <label className="sk-admin-block-radio">
                <input type="radio" checked={blockForm.type === 'specific'}
                  onChange={() => setBlockForm(f => ({ ...f, type: 'specific' }))} />
                Konkrétní datum
              </label>
            </div>
            {blockForm.type === 'recurring' ? (
              <div className="sk-admin-block-row">
                <label>Den:</label>
                <select className="sk-admin-block-select"
                  value={blockForm.dow}
                  onChange={e => setBlockForm(f => ({ ...f, dow: +e.target.value }))}>
                  {DOW_LONG.map((name, i) => <option key={i} value={i}>{name}</option>)}
                </select>
              </div>
            ) : (
              <div className="sk-admin-block-row">
                <label>Datum:</label>
                <input type="date" className="sk-admin-block-select"
                  value={blockForm.date}
                  onChange={e => setBlockForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            )}
            <div className="sk-admin-block-row">
              <label>Hodiny:</label>
              <label className="sk-admin-block-radio">
                <input type="checkbox" checked={blockForm.allDay}
                  onChange={e => setBlockForm(f => ({ ...f, allDay: e.target.checked }))} />
                Celý den
              </label>
              {!blockForm.allDay && (
                <>
                  <select className="sk-admin-block-select"
                    value={blockForm.startHour}
                    onChange={e => {
                      const v = +e.target.value;
                      setBlockForm(f => ({ ...f, startHour: v, endHour: Math.max(f.endHour, v + 1) }));
                    }}>
                    {HOURS.map(h => <option key={h} value={h}>{h}:00</option>)}
                  </select>
                  <span style={{ color: 'var(--sk-mute)' }}>–</span>
                  <select className="sk-admin-block-select"
                    value={blockForm.endHour}
                    onChange={e => setBlockForm(f => ({ ...f, endHour: +e.target.value }))}>
                    {HOURS.filter(h => h > blockForm.startHour).map(h => (
                      <option key={h} value={h}>{h}:00</option>
                    ))}
                    <option value={HOUR_MAX + 1}>{HOUR_MAX + 1}:00</option>
                  </select>
                </>
              )}
            </div>
            <div className="sk-admin-block-actions">
              <button className="sk-admin-block-submit"
                onClick={() => void submitAddBlock()}
                disabled={blockActionLoading === 'add'}>
                {blockActionLoading === 'add' ? 'Ukládám…' : 'Přidat blokování'}
              </button>
              <button className="sk-admin-block-cancel" onClick={() => setShowBlockForm(false)}>
                Zrušit
              </button>
            </div>
          </div>
        ) : (
          <button className="sk-admin-block-add-btn" onClick={() => setShowBlockForm(true)}>
            <Icon.plus size={14} /> Přidat blokování
          </button>
        )}

        <p className="sk-admin-note">
          <Icon.shield size={13} /> Přístup pouze pro správce
        </p>
      </div>

      {/* ---- Popup rezervace ---- */}
      {popup && (() => {
        const date = new Date(popup.date + 'T12:00:00');
        const hours = editHours ?? popup.hours;
        const sorted = [...hours].sort((a, b) => a - b);
        const hMin = sorted[0];
        const hMax = sorted[sorted.length - 1];
        const hoursChanged = editHours !== null && (
          editHours.length !== popup.hours.length ||
          editHours.some((_, i) => [...editHours].sort((a, b) => a - b)[i] !== [...popup.hours].sort((a, b) => a - b)[i])
        );
        const currentName = editName ?? popup.name;
        const nameChanged = editName !== null && editName.trim() !== popup.name;

        function shiftStart(delta: number) {
          const s = [...hours].sort((a, b) => a - b);
          const newMin = s[0] + delta;
          if (newMin < HOUR_MIN || newMin >= s[s.length - 1]) return;
          setEditHours(delta < 0 ? [newMin, ...s] : s.slice(1));
        }

        function shiftEnd(delta: number) {
          const s = [...hours].sort((a, b) => a - b);
          const newMax = s[s.length - 1] + delta;
          if (newMax > HOUR_MAX || newMax <= s[0]) return;
          setEditHours(delta > 0 ? [...s, newMax] : s.slice(0, -1));
        }

        return (
          <div className="sk-admin-popup-overlay" onClick={() => { setPopup(null); }}>
            <div className="sk-admin-popup" onClick={e => e.stopPropagation()}>
              <div className="sk-admin-popup-header">
                <button className="sk-admin-popup-close" onClick={() => setPopup(null)} aria-label="Zavřít">
                  <Icon.close size={18} />
                </button>
                <div className="sk-admin-popup-when">{DOW[date.getDay()]} {fmtDMY(date)}</div>
                <div className="sk-admin-hours-editor">
                  <button className="sk-admin-hours-btn" onClick={() => shiftStart(-1)}
                    disabled={hMin <= HOUR_MIN || actionLoading !== null} title="Dřívější začátek">−</button>
                  <button className="sk-admin-hours-btn" onClick={() => shiftStart(1)}
                    disabled={hMin >= hMax || actionLoading !== null} title="Pozdější začátek">+</button>
                  <span className="sk-admin-hours-range">{hMin}:00 – {hMax + 1}:00</span>
                  <button className="sk-admin-hours-btn" onClick={() => shiftEnd(-1)}
                    disabled={hMax <= hMin || actionLoading !== null} title="Dřívější konec">−</button>
                  <button className="sk-admin-hours-btn" onClick={() => shiftEnd(1)}
                    disabled={hMax >= HOUR_MAX || actionLoading !== null} title="Pozdější konec">+</button>
                </div>
                <button className="sk-admin-hours-save"
                  onClick={() => void patchReservationHours(popup.id, editHours!)}
                  disabled={!hoursChanged || actionLoading !== null}>
                  {actionLoading === 'patch' && hoursChanged ? 'Ukládám…' : 'Uložit změnu hodin'}
                </button>
                <div style={{ marginTop: 8 }}>
                  {popup.confirmed_at
                    ? <span className="sk-admin-status-badge confirmed">Potvrzeno</span>
                    : <span className="sk-admin-status-badge unconfirmed">Čeká na potvrzení e-mailem</span>
                  }
                </div>
              </div>
              <div className="sk-admin-popup-body">
                {/* Editace jména */}
                <div className="sk-admin-popup-row sk-admin-name-row">
                  <Icon.pencil size={14} />
                  <input
                    className="sk-admin-name-input"
                    value={currentName}
                    onChange={e => setEditName(e.target.value)}
                  />
                  {nameChanged && (
                    <button
                      className="sk-admin-name-save-btn"
                      onClick={() => void patchReservationName(popup.id, editName!.trim())}
                      disabled={!editName?.trim() || actionLoading !== null}
                    >
                      {actionLoading === 'patch' && nameChanged ? '…' : 'Uložit'}
                    </button>
                  )}
                </div>
                {/* E-mail */}
                {popup.email ? (
                  <a href={`mailto:${popup.email}`} className="sk-admin-popup-row">
                    <Icon.email size={15} />
                    <span>{popup.email}</span>
                  </a>
                ) : (
                  <div className="sk-admin-popup-row muted">
                    <Icon.email size={15} />
                    <span>E-mail nevyplněn</span>
                  </div>
                )}
                {/* Telefon */}
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
              <div className="sk-admin-popup-footer">
                {!popup.confirmed_at && (
                  <button className="sk-admin-popup-btn confirm"
                    onClick={() => void confirmReservation(popup.id)}
                    disabled={actionLoading !== null}>
                    {actionLoading === 'confirm' ? 'Potvrzuji…' : 'Potvrdit'}
                  </button>
                )}
                <button className="sk-admin-popup-btn delete"
                  onClick={() => void deleteReservation(popup.id)}
                  disabled={actionLoading !== null}>
                  {actionLoading === 'delete' ? 'Mažu…' : 'Smazat'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ---- Modal: přidat rezervaci ---- */}
      {addModal && addForm && (
        <div className="sk-admin-popup-overlay" onClick={() => { setAddModal(false); setAddForm(null); }}>
          <div className="sk-admin-popup sk-admin-add-modal" onClick={e => e.stopPropagation()}>
            <div className="sk-admin-popup-header">
              <button className="sk-admin-popup-close" onClick={() => { setAddModal(false); setAddForm(null); }} aria-label="Zavřít">
                <Icon.close size={18} />
              </button>
              <div className="sk-admin-popup-name">Přidat rezervaci</div>
              <div className="sk-admin-popup-when">Rezervace správce · automaticky potvrzena</div>
            </div>
            <div className="sk-admin-add-form">
              <div className="sk-admin-add-field">
                <label>Datum</label>
                <input type="date" className="sk-admin-add-input"
                  value={addForm.date}
                  onChange={e => setAddForm(f => f ? { ...f, date: e.target.value } : f)} />
              </div>
              <div className="sk-admin-add-field">
                <label>Čas</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select className="sk-admin-add-input"
                    value={addForm.startHour}
                    onChange={e => {
                      const v = +e.target.value;
                      setAddForm(f => f ? { ...f, startHour: v, endHour: Math.max(f.endHour, v + 1) } : f);
                    }}>
                    {HOURS.map(h => <option key={h} value={h}>{h}:00</option>)}
                  </select>
                  <span style={{ color: 'var(--sk-mute)', flexShrink: 0 }}>–</span>
                  <select className="sk-admin-add-input"
                    value={addForm.endHour}
                    onChange={e => setAddForm(f => f ? { ...f, endHour: +e.target.value } : f)}>
                    {HOURS.filter(h => h > addForm.startHour).map(h => (
                      <option key={h} value={h}>{h}:00</option>
                    ))}
                    <option value={HOUR_MAX + 1}>{HOUR_MAX + 1}:00</option>
                  </select>
                </div>
              </div>
              <div className="sk-admin-add-field">
                <label>Jméno <span className="sk-admin-req">*</span></label>
                <input className="sk-admin-add-input" placeholder="Jan Novák"
                  value={addForm.name}
                  onChange={e => setAddForm(f => f ? { ...f, name: e.target.value } : f)} />
              </div>
              <div className="sk-admin-add-field">
                <label>E-mail <span className="sk-admin-opt">(nepovinné)</span></label>
                <input className="sk-admin-add-input" placeholder="jan@email.cz"
                  value={addForm.email}
                  onChange={e => setAddForm(f => f ? { ...f, email: e.target.value } : f)} />
              </div>
              <div className="sk-admin-add-field">
                <label>Telefon <span className="sk-admin-opt">(nepovinné)</span></label>
                <input className="sk-admin-add-input" placeholder="+420 777 123 456"
                  value={addForm.phone}
                  onChange={e => setAddForm(f => f ? { ...f, phone: e.target.value } : f)} />
              </div>
              <div className="sk-admin-add-field">
                <label>Způsob platby</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {(['hotove', 'prevod'] as const).map(val => (
                    <label key={val} style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
                      <input type="radio" name="add-payment" value={val}
                        checked={addForm.payment === val}
                        onChange={() => setAddForm(f => f ? { ...f, payment: val } : f)} />
                      {val === 'hotove' ? 'Osobně' : 'Převodem'}
                    </label>
                  ))}
                </div>
              </div>
              <div className="sk-admin-add-field">
                <label>Poznámka <span className="sk-admin-opt">(nepovinné)</span></label>
                <textarea className="sk-admin-add-input" rows={2}
                  value={addForm.note}
                  onChange={e => setAddForm(f => f ? { ...f, note: e.target.value } : f)} />
              </div>
            </div>
            <div className="sk-admin-popup-footer">
              <button className="sk-admin-popup-btn confirm"
                onClick={() => void submitAddReservation()}
                disabled={addLoading || !addForm.name.trim() || addForm.endHour <= addForm.startHour}>
                {addLoading ? 'Ukládám…' : 'Přidat rezervaci'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
