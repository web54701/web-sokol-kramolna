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
  note: string;
  note_public: boolean;
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
  note: string;
  notePublic: boolean;
};

type SelState = { dayNo: number | null; slots: number[] };

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
  const [editEmail, setEditEmail] = useState<string | null>(null);
  const [editPhone, setEditPhone] = useState<string | null>(null);

  // --- Výběr buněk pro přidání rezervace ---
  const [sel, setSel] = useState<SelState>({ dayNo: null, slots: [] });

  // --- Přidat rezervaci (modal) ---
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddForm | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  // --- Blokování ---
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [blockModal, setBlockModal] = useState(false);   // create mode
  const [editBlock, setEditBlock] = useState<BlockedSlot | null>(null);  // edit mode
  const [blockForm, setBlockForm] = useState<BlockForm>({
    type: 'recurring', dow: 1, date: toISODate(NOW), allDay: true, startHour: 8, endHour: 20,
    note: '', notePublic: false,
  });
  const [blockActionLoading, setBlockActionLoading] = useState<number | 'add' | null>(null);

  const week = useMemo(() => {
    const start = weekStart(NOW, weekOff);
    return Array.from({ length: 7 }, (_, i) =>
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOff]);

  // Zrušit výběr buněk při změně týdne
  useEffect(() => { setSel({ dayNo: null, slots: [] }); }, [weekOff]);

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
    setEditEmail(null);
    setEditPhone(null);
  }, [popup?.id]);

  // Mapa rezervací: "YYYY-MM-DD-h" → Reservation
  const resMap = useMemo(() => {
    const m = new Map<string, Reservation>();
    for (const r of reservations) {
      for (const h of r.hours) m.set(`${r.date}-${h}`, r);
    }
    return m;
  }, [reservations]);

  // Mapa blokovaných slotů pro aktuální týden: klíč = "YYYY-MM-DD-h" → BlockedSlot
  const blockedMap = useMemo(() => {
    const m = new Map<string, BlockedSlot>();
    for (const b of blockedSlots) {
      for (const d of week) {
        const dateStr = toISODate(d);
        if (b.type === 'recurring' && b.dow !== d.getDay()) continue;
        if (b.type === 'specific' && b.date !== dateStr) continue;
        const hs = b.hours ?? HOURS;
        for (const h of hs) {
          const key = `${dateStr}-${h}`;
          if (!m.has(key)) m.set(key, b);
        }
      }
    }
    return m;
  }, [blockedSlots, week]);

  // --- Výběr buněk (pro přidání rezervace) ---

  function clickCell(d: Date, h: number) {
    const dn = epochDay(d);
    setSel(prev => {
      if (dn !== prev.dayNo) return { dayNo: dn, slots: [h] };
      const cur = prev.slots;
      if (cur.includes(h)) {
        if (h === Math.min(...cur) || h === Math.max(...cur)) {
          const next = cur.filter(x => x !== h);
          return next.length === 0 ? { dayNo: null, slots: [] } : { dayNo: dn, slots: next };
        }
        return prev;
      }
      if (h === Math.min(...cur) - 1 || h === Math.max(...cur) + 1) {
        return { dayNo: dn, slots: [...cur, h].sort((a, b) => a - b) };
      }
      return { dayNo: dn, slots: [h] };
    });
  }

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

  async function patchReservationField(id: number, field: 'email' | 'phone', value: string) {
    setActionLoading('patch');
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        alert(data.error ?? 'Chyba při ukládání.');
        return;
      }
      setReservations(rs => rs.map(r => r.id === id ? { ...r, [field]: value } : r));
      setPopup(p => p?.id === id ? { ...p, [field]: value } : p);
      if (field === 'email') setEditEmail(null);
      if (field === 'phone') setEditPhone(null);
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
    let date: string;
    let startHour: number;
    let endHour: number;

    if (sel.dayNo !== null && sel.slots.length > 0) {
      // Předvyplnit z výběru v kalendáři
      const sorted = [...sel.slots].sort((a, b) => a - b);
      date = toISODate(new Date(sel.dayNo * 86400000));
      startHour = sorted[0];
      endHour = sorted[sorted.length - 1] + 1;
    } else {
      const firstFuture = week.find(d => epochDay(d) >= epochDay(NOW)) ?? week[0];
      date = toISODate(firstFuture);
      startHour = 8;
      endHour = 10;
    }

    setAddForm({ date, startHour, endHour, name: '', email: '', phone: '', note: '', payment: 'hotove' });
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
          activity: mode, date: addForm.date, hours, name: addForm.name,
          email: addForm.email || undefined, phone: addForm.phone || undefined,
          note: addForm.note || undefined, payment: addForm.payment, price,
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        alert(data.error ?? 'Chyba při přidávání.');
        return;
      }
      const data = await res.json() as { ok: boolean; id: number };
      const newRes: Reservation = {
        id: data.id, activity: mode, date: addForm.date, hours,
        name: addForm.name, email: addForm.email, phone: addForm.phone,
        note: addForm.note, payment: addForm.payment, price,
        created_at: new Date().toISOString(), confirmed_at: new Date().toISOString(),
      };
      if (addForm.date >= toISODate(week[0]) && addForm.date <= toISODate(week[6])) {
        setReservations(rs => [...rs, newRes]);
      }
      setSel({ dayNo: null, slots: [] });
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
          activity: mode, type: blockForm.type,
          dow: blockForm.type === 'recurring' ? blockForm.dow : undefined,
          date: blockForm.type === 'specific' ? blockForm.date : undefined,
          hours,
          note: blockForm.note,
          note_public: blockForm.notePublic,
        }),
      });
      if (!res.ok) { alert('Chyba při ukládání.'); return; }
      const data = await res.json() as { ok: boolean; id: number };
      const newBlock: BlockedSlot = {
        id: data.id, activity: mode, type: blockForm.type,
        dow: blockForm.type === 'recurring' ? blockForm.dow : null,
        date: blockForm.type === 'specific' ? blockForm.date : null,
        hours, note: blockForm.note, note_public: blockForm.notePublic,
      };
      setBlockedSlots(bs => [...bs, newBlock]);
      setBlockModal(false);
    } finally {
      setBlockActionLoading(null);
    }
  }

  function openEditBlock(b: BlockedSlot) {
    setBlockForm({
      type: b.type,
      dow: b.dow ?? 1,
      date: b.date ?? toISODate(NOW),
      allDay: b.hours === null,
      startHour: b.hours ? Math.min(...b.hours) : 8,
      endHour: b.hours ? Math.max(...b.hours) + 1 : 20,
      note: b.note,
      notePublic: b.note_public,
    });
    setEditBlock(b);
  }

  function closeBlockModal() {
    setBlockModal(false);
    setEditBlock(null);
    setBlockForm({ type: 'recurring', dow: 1, date: toISODate(NOW), allDay: true, startHour: 8, endHour: 20, note: '', notePublic: false });
  }

  async function submitEditBlock() {
    if (!editBlock) return;
    const hours = blockForm.allDay
      ? null
      : Array.from({ length: blockForm.endHour - blockForm.startHour }, (_, i) => blockForm.startHour + i);

    setBlockActionLoading(editBlock.id);
    try {
      const res = await fetch(`/api/blocked/${editBlock.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity: mode, type: blockForm.type,
          dow: blockForm.type === 'recurring' ? blockForm.dow : undefined,
          date: blockForm.type === 'specific' ? blockForm.date : undefined,
          hours,
          note: blockForm.note,
          note_public: blockForm.notePublic,
        }),
      });
      if (!res.ok) { alert('Chyba při ukládání.'); return; }
      const updated: BlockedSlot = {
        ...editBlock,
        type: blockForm.type,
        dow: blockForm.type === 'recurring' ? blockForm.dow : null,
        date: blockForm.type === 'specific' ? blockForm.date : null,
        hours, note: blockForm.note, note_public: blockForm.notePublic,
      };
      setBlockedSlots(bs => bs.map(b => b.id === editBlock.id ? updated : b));
      closeBlockModal();
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

  return (
    <div className="skp-scroll">
      <div className="sk-admin-wrap">

        {/* ---- Řádek 1: název ---- */}
        <div className="sk-admin-bar">
          <span className="sk-admin-title">
            <Icon.cal /> Rezervace · {rangeLabel}
          </span>
        </div>

        {/* ---- Řádek 2: navigace týdne ---- */}
        <div className="sk-admin-weeknav-row">
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

        {/* ---- Legenda + tlačítka na stejném řádku ---- */}
        <div className="sk-admin-legend-bar">
          <div className="sk-admin-legend">
            <span className="sk-admin-legend-item confirmed">Potvrzeno</span>
            <span className="sk-admin-legend-item unconfirmed">Čeká na potvrzení</span>
            {blockedSlots.length > 0 && (
              <span className="sk-admin-legend-item blocked">Blokováno</span>
            )}
            {sel.slots.length > 0 && (
              <span className="sk-admin-legend-item selected">Váš výběr</span>
            )}
          </div>
          <div className="sk-admin-actions">
            <button className="sk-admin-add-btn" onClick={openAddModal}>
              <Icon.plus size={15} /> Přidat rezervaci
            </button>
            <button className="sk-admin-add-btn secondary" onClick={() => setBlockModal(true)}>
              <Icon.ban size={15} /> Přidat blokování
            </button>
          </div>
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
                  const blockObj = !res ? blockedMap.get(key) : undefined;
                  const isBlocked = !!blockObj;
                  const past = toISODate(d) < nowISO;
                  const isSel = sel.dayNo === epochDay(d) && sel.slots.includes(h);
                  const cls = [
                    'sk-admin-cal-cell',
                    res ? 'booked' : '',
                    res && !res.confirmed_at ? 'unconfirmed' : '',
                    isBlocked ? 'blocked' : '',
                    past ? 'past' : '',
                    isSel ? 'admin-sel' : '',
                  ].filter(Boolean).join(' ');
                  const handleClick = res
                    ? () => setPopup(res)
                    : blockObj
                      ? () => openEditBlock(blockObj)
                      : past
                        ? undefined
                        : () => clickCell(d, h);
                  return (
                    <div key={key} className={cls} onClick={handleClick}>
                      {res && <span className="sk-admin-cal-name">{res.name}</span>}
                      {isBlocked && blockObj && (
                        <div className="sk-admin-cal-blocked-content">
                          <span className="sk-admin-cal-blocked-label">Blokováno</span>
                          {blockObj.note && (
                            <span className="sk-admin-cal-blocked-note">
                              {blockObj.note}
                              <span className={`sk-admin-cal-blocked-note-badge ${blockObj.note_public ? 'pub' : 'priv'}`}>
                                {blockObj.note_public ? 'V' : 'N'}
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ---- Tabulka rezervací ---- */}
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

        {/* ---- Blokování termínů (seznam) ---- */}
        {blockedSlots.length > 0 && (
          <>
            <h4 className="sk-admin-section-head" style={{ marginTop: 32 }}>Blokované termíny</h4>
            <div className="sk-admin-block-list">
              {blockedSlots.map(b => (
                <div key={b.id} className="sk-admin-block-item" onClick={() => openEditBlock(b)} style={{ cursor: 'pointer' }}>
                  <Icon.ban size={14} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div>{blockLabel(b)}</div>
                    {b.note && (
                      <div className="sk-admin-block-item-note">
                        {b.note}
                        <span className={`sk-admin-block-note-badge ${b.note_public ? 'public' : 'private'}`}>
                          {b.note_public ? 'Veřejná' : 'Neveřejná'}
                        </span>
                      </div>
                    )}
                  </div>
                  <button className="sk-admin-block-del"
                    onClick={e => { e.stopPropagation(); void deleteBlock(b.id); }}
                    disabled={blockActionLoading === b.id}>
                    {blockActionLoading === b.id ? '…' : <Icon.close size={13} />}
                  </button>
                </div>
              ))}
            </div>
          </>
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
          <div className="sk-admin-popup-overlay" onClick={() => setPopup(null)}>
            <div className="sk-admin-popup" onClick={e => e.stopPropagation()}>
              <div className="sk-admin-popup-header">
                <button className="sk-admin-popup-close" onClick={() => setPopup(null)} aria-label="Zavřít">
                  <Icon.close size={18} />
                </button>

                {/* Jméno: text + tužka → editace */}
                {editName === null ? (
                  <div className="sk-admin-popup-name-row">
                    <div className="sk-admin-popup-name">{popup.name}</div>
                    <button className="sk-admin-name-edit-btn" onClick={() => setEditName(popup.name)} title="Upravit jméno">
                      <Icon.pencil size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="sk-admin-popup-name-edit-row">
                    <input
                      className="sk-admin-name-edit-input"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter' && editName.trim()) void patchReservationName(popup.id, editName.trim());
                        if (e.key === 'Escape') setEditName(null);
                      }}
                    />
                    <button className="sk-admin-name-save-btn"
                      onClick={() => void patchReservationName(popup.id, editName.trim())}
                      disabled={!editName.trim() || actionLoading !== null}>
                      {actionLoading === 'patch' ? '…' : 'Uložit'}
                    </button>
                    <button className="sk-admin-name-cancel-btn" onClick={() => setEditName(null)}>
                      Zrušit
                    </button>
                  </div>
                )}

                <div className="sk-admin-popup-when">{DOW[date.getDay()]} {fmtDMY(date)}</div>

                {/* Editor hodin */}
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
                {/* E-mail */}
                {editEmail === null ? (
                  <div className="sk-admin-popup-row sk-admin-body-view-row">
                    <Icon.email size={15} />
                    {popup.email
                      ? <a href={`mailto:${popup.email}`} className="sk-admin-body-link">{popup.email}</a>
                      : <span className="sk-admin-muted-val">E-mail nevyplněn</span>
                    }
                    <button className="sk-admin-body-edit-btn" onClick={() => setEditEmail(popup.email)} title="Upravit e-mail">
                      <Icon.pencil size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="sk-admin-popup-row sk-admin-body-edit-row">
                    <Icon.email size={15} />
                    <input className="sk-admin-body-input" value={editEmail}
                      onChange={e => setEditEmail(e.target.value)} autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') void patchReservationField(popup.id, 'email', editEmail.trim());
                        if (e.key === 'Escape') setEditEmail(null);
                      }} />
                    <button className="sk-admin-body-save-btn"
                      onClick={() => void patchReservationField(popup.id, 'email', editEmail.trim())}
                      disabled={actionLoading !== null}>
                      {actionLoading === 'patch' ? '…' : 'Uložit'}
                    </button>
                    <button className="sk-admin-body-cancel-btn" onClick={() => setEditEmail(null)}>Zrušit</button>
                  </div>
                )}
                {/* Telefon */}
                {editPhone === null ? (
                  <div className="sk-admin-popup-row sk-admin-body-view-row">
                    <Icon.phone size={15} />
                    {popup.phone
                      ? <a href={`tel:${popup.phone.replace(/\s/g, '')}`} className="sk-admin-body-link">{popup.phone}</a>
                      : <span className="sk-admin-muted-val">Telefon nevyplněn</span>
                    }
                    <button className="sk-admin-body-edit-btn" onClick={() => setEditPhone(popup.phone)} title="Upravit telefon">
                      <Icon.pencil size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="sk-admin-popup-row sk-admin-body-edit-row">
                    <Icon.phone size={15} />
                    <input className="sk-admin-body-input" value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') void patchReservationField(popup.id, 'phone', editPhone.trim());
                        if (e.key === 'Escape') setEditPhone(null);
                      }} />
                    <button className="sk-admin-body-save-btn"
                      onClick={() => void patchReservationField(popup.id, 'phone', editPhone.trim())}
                      disabled={actionLoading !== null}>
                      {actionLoading === 'patch' ? '…' : 'Uložit'}
                    </button>
                    <button className="sk-admin-body-cancel-btn" onClick={() => setEditPhone(null)}>Zrušit</button>
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

      {/* ---- Modal: blokování (vytvoření i editace) ---- */}
      {(blockModal || editBlock !== null) && (() => {
        const isEdit = editBlock !== null;
        const saving = isEdit ? blockActionLoading === editBlock!.id : blockActionLoading === 'add';
        const disabled = saving ||
          (blockForm.type === 'specific' && !blockForm.date) ||
          (!blockForm.allDay && blockForm.endHour <= blockForm.startHour);
        return (
          <div className="sk-admin-popup-overlay" onClick={closeBlockModal}>
            <div className="sk-admin-popup sk-admin-add-modal" onClick={e => e.stopPropagation()}>
              <div className="sk-admin-popup-header">
                <button className="sk-admin-popup-close" onClick={closeBlockModal} aria-label="Zavřít">
                  <Icon.close size={18} />
                </button>
                <div className="sk-admin-popup-name">{isEdit ? 'Upravit blokování' : 'Přidat blokování'}</div>
                <div className="sk-admin-popup-when">Termín bude nedostupný pro veřejnost</div>
              </div>
              <div className="sk-admin-add-form">
                <div className="sk-admin-add-field">
                  <label>Typ</label>
                  <div style={{ display: 'flex', gap: 16 }}>
                    {(['recurring', 'specific'] as const).map(val => (
                      <label key={val} style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
                        <input type="radio" name="block-type" value={val}
                          checked={blockForm.type === val}
                          onChange={() => setBlockForm(f => ({ ...f, type: val }))} />
                        {val === 'recurring' ? 'Pravidelně (každý týden)' : 'Konkrétní datum'}
                      </label>
                    ))}
                  </div>
                </div>

                {blockForm.type === 'recurring' ? (
                  <div className="sk-admin-add-field">
                    <label>Den v týdnu</label>
                    <select className="sk-admin-add-input"
                      value={blockForm.dow}
                      onChange={e => setBlockForm(f => ({ ...f, dow: +e.target.value }))}>
                      {DOW_LONG.map((name, i) => <option key={i} value={i}>{name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="sk-admin-add-field">
                    <label>Datum</label>
                    <input type="date" className="sk-admin-add-input"
                      value={blockForm.date}
                      onChange={e => setBlockForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                )}

                <div className="sk-admin-add-field">
                  <label>Hodiny</label>
                  <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer', marginBottom: 6 }}>
                    <input type="checkbox" checked={blockForm.allDay}
                      onChange={e => setBlockForm(f => ({ ...f, allDay: e.target.checked }))} />
                    Celý den
                  </label>
                  {!blockForm.allDay && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select className="sk-admin-add-input"
                        value={blockForm.startHour}
                        onChange={e => {
                          const v = +e.target.value;
                          setBlockForm(f => ({ ...f, startHour: v, endHour: Math.max(f.endHour, v + 1) }));
                        }}>
                        {HOURS.map(h => <option key={h} value={h}>{h}:00</option>)}
                      </select>
                      <span style={{ color: 'var(--sk-mute)', flexShrink: 0 }}>–</span>
                      <select className="sk-admin-add-input"
                        value={blockForm.endHour}
                        onChange={e => setBlockForm(f => ({ ...f, endHour: +e.target.value }))}>
                        {HOURS.filter(h => h > blockForm.startHour).map(h => (
                          <option key={h} value={h}>{h}:00</option>
                        ))}
                        <option value={HOUR_MAX + 1}>{HOUR_MAX + 1}:00</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="sk-admin-add-field">
                  <label>Poznámka <span className="sk-admin-opt">(nepovinné)</span></label>
                  <textarea className="sk-admin-add-input" rows={2}
                    placeholder="Např. zavřeno kvůli opravě kurtu…"
                    value={blockForm.note}
                    onChange={e => setBlockForm(f => ({ ...f, note: e.target.value }))} />
                </div>
                <div className="sk-admin-add-field">
                  <label style={{ display: 'flex', gap: 7, alignItems: 'center', cursor: 'pointer', fontWeight: 400, color: 'var(--sk-ink)' }}>
                    <input type="checkbox" checked={blockForm.notePublic}
                      onChange={e => setBlockForm(f => ({ ...f, notePublic: e.target.checked }))} />
                    Poznámka viditelná zákazníkům
                  </label>
                </div>
              </div>
              <div className="sk-admin-popup-footer">
                {isEdit && (
                  <button className="sk-admin-popup-btn delete"
                    onClick={() => { void deleteBlock(editBlock!.id); closeBlockModal(); }}
                    disabled={saving}>
                    {blockActionLoading === editBlock!.id ? 'Mažu…' : 'Odstranit'}
                  </button>
                )}
                <button className="sk-admin-popup-btn confirm"
                  onClick={() => isEdit ? void submitEditBlock() : void submitAddBlock()}
                  disabled={disabled}>
                  {saving ? 'Ukládám…' : isEdit ? 'Uložit změny' : 'Přidat blokování'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
