import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '../../components/Icon';
import { MODES, type ReservationModeKey } from './reservation.config';
import { DOW, DAY_MS, epochDay, fmtDM, fmtDMY, toISODate, HOURS, weekStart } from './date-utils';

interface ApiReservation {
  date: string;
  hours: number[];
}

type Props = {
  mode: ReservationModeKey;
  onGoOverview: () => void;
};

type SelState = { dayNo: number | null; slots: number[] };
type FormState = { name: string; email: string; phone: string; note: string; payment: 'hotove' | 'prevod' };

const MOB_DAYS = 3;
const MOB_BP = 640;

export function ReservationFlow({ mode, onGoOverview }: Props) {
  const cfg = MODES[mode];
  const NOW = new Date();
  const [step, setStep] = useState(1);
  const [weekOff, setWeekOff] = useState(0);
  const [dayOff, setDayOff] = useState(0);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= MOB_BP);
  const [sel, setSel] = useState<SelState>({ dayNo: null, slots: [] });
  const [form, setForm] = useState<FormState>(() => {
    try {
      const saved = localStorage.getItem('skp-contact');
      const c = saved ? JSON.parse(saved) : {};
      return { name: c.name ?? '', email: c.email ?? '', phone: c.phone ?? '', note: '', payment: 'hotove' };
    } catch {
      return { name: '', email: '', phone: '', note: '', payment: 'hotove' };
    }
  });
  const [touched, setTouched] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [busySlots, setBusySlots] = useState<Map<string, number>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOB_BP}px)`);
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Reset dayOff when switching weeks
  useEffect(() => { setDayOff(0); }, [weekOff]);

  const { dayNo, slots } = sel;

  const week = useMemo(() => {
    const start = weekStart(NOW, weekOff);
    return Array.from({ length: 7 }, (_, i) => {
      return new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOff]);

  // Načíst obsazené sloty z DB pro aktuální týden
  useEffect(() => {
    const from = toISODate(week[0]);
    const to = toISODate(week[6]);
    fetch(`/api/reservations?activity=${mode}&from=${from}&to=${to}`)
      .then(r => r.json())
      .then((data: unknown) => {
        const map = new Map<string, number>();
        for (const r of data as ApiReservation[]) {
          for (const h of r.hours) {
            const key = `${r.date}-${h}`;
            map.set(key, (map.get(key) ?? 0) + 1);
          }
        }
        setBusySlots(map);
      })
      .catch(() => { /* při chybě zobrazit vše jako volné */ });
  }, [week, mode]);

  const visibleWeek = isMobile ? week.slice(dayOff, dayOff + MOB_DAYS) : week;
  const canPrevDay = isMobile && dayOff > 0;
  const canNextDay = isMobile && dayOff + MOB_DAYS < 7;

  const rangeLabel = isMobile
    ? `${fmtDM(visibleWeek[0])} – ${fmtDMY(visibleWeek[visibleWeek.length - 1])}`
    : `${fmtDM(week[0])} – ${fmtDMY(week[6])}`;

  function slotInfo(date: Date, h: number): { st: string; remaining?: number } {
    const dn = epochDay(date);
    const isToday = dn === epochDay(NOW);
    if (dn < epochDay(NOW) || (isToday && h <= NOW.getHours())) return { st: 'past' };
    const count = busySlots.get(`${toISODate(date)}-${h}`) ?? 0;
    if (mode === 'tenis') {
      return { st: count > 0 ? 'busy' : 'free' };
    } else {
      const remaining = Math.max(0, cfg.capacity! - count);
      return { st: remaining === 0 ? 'full' : 'free', remaining };
    }
  }

  function clickSlot(date: Date, h: number, st: string) {
    if (st !== 'free') return;
    const dn = epochDay(date);
    setSel((prev) => {
      if (dn !== prev.dayNo) return { dayNo: dn, slots: [h] };
      const cur = prev.slots;
      if (cur.includes(h)) {
        if (h === Math.min(...cur) || h === Math.max(...cur)) {
          const next = cur.filter((x) => x !== h);
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

  const selDate = dayNo != null ? new Date(dayNo * DAY_MS) : null;
  const sortedSlots = [...slots].sort((a, b) => a - b);
  const total = selDate ? sortedSlots.reduce((sum, h) => sum + cfg.priceFor(selDate, h), 0) : 0;
  const timeLabel = sortedSlots.length
    ? `${sortedSlots[0]}:00 – ${sortedSlots[sortedSlots.length - 1] + 1}:00`
    : '—';
  const hoursCount = sortedSlots.length;

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim());
  const nameOk = form.name.trim().length >= 2;
  const phoneOk = form.phone.trim().length === 0 || form.phone.replace(/\s/g, '').length >= 9;
  const formOk = nameOk && emailOk && phoneOk;

  async function submit() {
    if (!selDate || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try { localStorage.setItem('skp-contact', JSON.stringify({ name: form.name, email: form.email, phone: form.phone })); } catch { /* ignore */ }
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity: mode,
          date: toISODate(selDate),
          hours: sortedSlots,
          name: form.name,
          email: form.email,
          phone: form.phone,
          note: form.note,
          payment: form.payment,
          price: total,
        }),
      });
      if (res.status === 409) {
        setSubmitError('Vybraný termín byl mezitím obsazen. Vyberte prosím jiný čas.');
        return;
      }
      if (!res.ok) throw new Error('server error');
      setStep(4);
      window.scrollTo(0, 0);
    } catch {
      setSubmitError('Nepodařilo se odeslat rezervaci. Zkuste to prosím znovu.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function reset() {
    setStep(1);
    setSel({ dayNo: null, slots: [] });
    setForm((f) => ({ name: f.name, email: f.email, phone: f.phone, note: '', payment: 'hotove' }));
    setTouched(false);
    window.scrollTo(0, 0);
  }

  function goStep(n: number) {
    setStep(n);
    window.scrollTo(0, 0);
  }

  // ---------- SUCCESS ----------
  if (step === 4) {
    return (
      <div className="skp-success">
        <div className="skp-success-card">
          <div className="skp-success-head">
            <div className="skp-success-badge">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
            </div>
            <div>
              <h2>Rezervace přijata</h2>
              <p className="lead">Termín je předběžně zarezervován. Aby byla rezervace platná, je nutné ji potvrdit kliknutím na odkaz v e-mailu.</p>
            </div>
          </div>

          <div className="skp-email-confirm">
            <div className="skp-email-confirm-icon">
              <Icon.email size={32} />
            </div>
            <div className="skp-email-confirm-body">
              <div className="skp-email-confirm-title">Zkontrolujte e-mail a potvrďte rezervaci</div>
              <div className="skp-email-confirm-addr">{form.email}</div>
              <div className="skp-email-confirm-note">
                Odkaz k potvrzení jsme odeslali na výše uvedenou adresu. Rezervaci lze stejným odkazem kdykoliv zdarma zrušit.
              </div>
            </div>
          </div>

          <div className="skp-success-detail">
            <div className="row"><span className="k">Termín</span><span className="v">{DOW[selDate!.getDay()]} {fmtDMY(selDate!)}</span></div>
            <div className="row"><span className="k">Čas</span><span className="v">{timeLabel} · {hoursCount} h</span></div>
            <div className="row"><span className="k">Jméno</span><span className="v">{form.name}</span></div>
            <div className="row"><span className="k">Platba</span><span className="v">{form.payment === 'hotove' ? 'Osobně při vrácení klíčů' : 'Převodem na účet Sokola'}</span></div>
            <div className="row"><span className="k">Celkem</span><span className="v" style={{ fontSize: 16 }}>{total} Kč</span></div>
          </div>

          <div className="skp-btn-row">
            <button className="skp-btn-ghost" onClick={reset}>Nová rezervace</button>
            <button className="skp-btn-primary" onClick={onGoOverview}>Hotovo</button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- summary panel (kroky 1–3) ----------
  const summary = (
    <aside className="skp-summary">
      <h3>Souhrn rezervace</h3>
      <div className="sub">{cfg.court}</div>

      {hoursCount === 0 ? (
        <div className="skp-sum-empty">
          Zatím nemáte vybraný termín.<br />Klikněte na volné hodiny v kalendáři.
        </div>
      ) : (
        <>
          <div className="skp-sum-row"><span className="k">Datum</span><span className="v">{DOW[selDate!.getDay()]} {fmtDM(selDate!)}</span></div>
          <div className="skp-sum-row"><span className="k">Čas</span><span className="v">{timeLabel}</span></div>
          <div className="skp-sum-row"><span className="k">Délka</span><span className="v">{hoursCount} {hoursCount === 1 ? 'hodina' : hoursCount < 5 ? 'hodiny' : 'hodin'}</span></div>
          <div className="skp-sum-row"><span className="k">Sazba</span><span className="v">{mode === 'tenis' ? '100 Kč / h' : 'Jednorázový vstup'}</span></div>
          <div className="skp-sum-total"><span className="k">Celkem</span><span className="v">{total} Kč</span></div>
        </>
      )}

      <div className="skp-btn-row">
        {step > 1 && <button className="skp-btn-ghost" onClick={() => goStep(step - 1)}>Zpět</button>}
        {step === 1 && (
          <button className="skp-btn-primary" disabled={hoursCount === 0} onClick={() => goStep(2)}>
            Pokračovat <Icon.arrowR size={18} />
          </button>
        )}
        {step === 2 && (
          <button className="skp-btn-primary" onClick={() => { setTouched(true); if (formOk) goStep(3); }}>
            Pokračovat <Icon.arrowR size={18} />
          </button>
        )}
        {step === 3 && (
          <button className="skp-btn-primary" onClick={() => { void submit(); }} disabled={isSubmitting}>
            {isSubmitting ? 'Odesílám…' : 'Rezervovat'}
          </button>
        )}
      </div>
      {step === 2 && !formOk && touched && (
        <div className="skp-err-msg" style={{ marginTop: 8 }}>Vyplňte prosím všechna povinná pole.</div>
      )}
      {step === 3 && submitError && (
        <div className="skp-err-msg" style={{ marginTop: 8 }}>{submitError}</div>
      )}
    </aside>
  );

  // ---------- STEPPER ----------
  const STEPS: [string, string][] = [['1', 'Termín'], ['2', 'Vaše údaje'], ['3', 'Potvrzení']];
  const stepper = (
    <div className="skp-stepper">
      {STEPS.map(([n, label], i) => {
        const idx = i + 1;
        const isDone = step > idx;
        const cls = step === idx ? 'active' : isDone ? 'done' : '';
        return (
          <React.Fragment key={n}>
            <div
              className={'skp-step ' + cls}
              onClick={isDone ? () => goStep(idx) : undefined}
              style={isDone ? { cursor: 'pointer' } : undefined}
            >
              <span className="num">{isDone ? '✓' : n}</span>
              <span>{label}</span>
            </div>
            {idx < 3 && <span className={'skp-step-line' + (isDone ? ' done' : '')} />}
          </React.Fragment>
        );
      })}
    </div>
  );

  // ---------- STEP CONTENT ----------
  let mainContent: React.ReactNode;

  if (step === 1) {
    mainContent = (
      <div className="sk-cal-panel skp-cal" style={{ flex: 1 }}>
        <div className="skp-weeknav">
          <span className="range"><Icon.cal /> {rangeLabel}</span>
          {isMobile ? (
            <>
              <button
                className="sk-cal-pill icon"
                onClick={() => canPrevDay ? setDayOff(d => d - 1) : (setWeekOff(w => Math.max(0, w - 1)), setDayOff(4))}
                disabled={weekOff === 0 && !canPrevDay}
                style={weekOff === 0 && !canPrevDay ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
              >
                <Icon.chev dir="left" />
              </button>
              <button className="sk-cal-pill" onClick={() => { setWeekOff(0); setDayOff(0); }}>Dnes</button>
              <button
                className="sk-cal-pill icon"
                onClick={() => canNextDay ? setDayOff(d => d + 1) : (setWeekOff(w => Math.min(3, w + 1)), setDayOff(0))}
                disabled={weekOff === 3 && !canNextDay}
                style={weekOff === 3 && !canNextDay ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
              >
                <Icon.chev />
              </button>
            </>
          ) : (
            <>
              <button className="sk-cal-pill icon" onClick={() => setWeekOff((w) => Math.max(0, w - 1))} disabled={weekOff === 0} style={weekOff === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}>
                <Icon.chev dir="left" />
              </button>
              <button className="sk-cal-pill" onClick={() => setWeekOff(0)}>Tento týden</button>
              <button className="sk-cal-pill icon" onClick={() => setWeekOff((w) => Math.min(3, w + 1))}>
                <Icon.chev />
              </button>
            </>
          )}
        </div>

        <div className="sk-cal-grid" style={{
          gridTemplateColumns: `${isMobile ? '40px' : '56px'} repeat(${visibleWeek.length}, 1fr)`,
          gridTemplateRows: `28px repeat(${HOURS.length}, 1fr)`,
        }}>
          <div className="sk-cal-cell sk-cal-headrow time"></div>
          {visibleWeek.map((d) => (
            <div key={d.getTime()} className="sk-cal-cell sk-cal-headrow">{DOW[d.getDay()]} {fmtDM(d)}</div>
          ))}
          {HOURS.map((h) => (
            <React.Fragment key={h}>
              <div className="sk-cal-cell sk-cal-time">{h}:00</div>
              {visibleWeek.map((d) => {
                const info = slotInfo(d, h);
                const isSel = epochDay(d) === dayNo && slots.includes(h);
                let selCls = '';
                if (isSel) {
                  if (sortedSlots.length === 1) selCls = 'sel sel-only';
                  else if (h === sortedSlots[0]) selCls = 'sel sel-top';
                  else if (h === sortedSlots[sortedSlots.length - 1]) selCls = 'sel sel-bot';
                  else selCls = 'sel sel-mid';
                }
                const cls = ['sk-cal-cell', 'sk-cal-slot', info.st, selCls].filter(Boolean).join(' ');
                return (
                  <div
                    key={d.getTime() + '-' + h}
                    className={cls}
                    onClick={() => clickSlot(d, h, info.st)}
                    title={info.st === 'free' ? `${DOW[d.getDay()]} ${fmtDM(d)} ${h}:00 – ${h + 1}:00` : info.st === 'past' ? 'Již proběhlo' : (mode === 'gym' ? 'Plně obsazeno' : 'Obsazeno')}
                  >
                    {mode === 'gym' && (info.st === 'free' || info.st === 'full') && (
                      <span className="cap">{info.st === 'full' ? '0' : info.remaining}</span>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        <div className="sk-cal-legend">
          <span><i className="sw" style={{ background: 'var(--sk-status-ok)' }} />Volno</span>
          <span><i className="sw" style={{ background: 'var(--sk-status-busy)' }} />{mode === 'gym' ? 'Plno' : 'Obsazeno'}</span>
          <span><i className="sw" style={{ background: 'var(--sk-green-800)' }} />Vaše volba</span>
          {mode === 'gym' && <span style={{ marginLeft: 'auto', color: 'var(--sk-mute)' }}>Číslo = volná místa</span>}
        </div>
        <div className="skp-cal-tip">
          <Icon.clock size={15} />
          <span>Klikněte na volné hodiny. Sousední hodiny můžete <b>spojit do delšího bloku</b>.</span>
        </div>
      </div>
    );
  } else if (step === 2) {
    const showErr = (ok: boolean) => touched && !ok ? ' err' : '';
    mainContent = (
      <div className="skp-form-card">
        <h3>Vaše údaje</h3>
        <p className="lead">Na e-mail vám pošleme potvrzovací kód a detaily rezervace.</p>
        <div className="skp-form-grid">
          <div className="skp-field full">
            <label>Jméno a příjmení <span className="req">*</span></label>
            <input className={'skp-input' + showErr(nameOk)} value={form.name} placeholder="Jan Novák"
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {touched && !nameOk && <span className="skp-err-msg">Zadejte jméno (alespoň 2 znaky).</span>}
          </div>
          <div className="skp-field">
            <label>E-mail <span className="req">*</span></label>
            <input className={'skp-input' + showErr(emailOk)} value={form.email} placeholder="jan@email.cz"
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {touched && !emailOk && <span className="skp-err-msg">Zadejte platný e-mail.</span>}
          </div>
          <div className="skp-field">
            <label>Telefon <span style={{ color: 'var(--sk-mute)', fontWeight: 400 }}>(nepovinné)</span></label>
            <input className={'skp-input' + showErr(phoneOk)} value={form.phone} placeholder="+420 777 123 456"
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            {touched && !phoneOk && form.phone.trim().length > 0 && <span className="skp-err-msg">Zadejte platné tel. číslo (min. 9 číslic).</span>}
          </div>
          <div className="skp-field full">
            <label>Poznámka <span style={{ color: 'var(--sk-mute)', fontWeight: 400 }}>(nepovinné)</span></label>
            <textarea className="skp-input" value={form.note}
              placeholder={mode === 'tenis' ? 'Např. půjčení vybavení, počet hráčů…' : 'Např. první návštěva, potřebuji instruktora…'}
              onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          <div className="skp-field full">
            <label>Způsob platby <span className="req">*</span></label>
            <div className="skp-payment">
              <label>
                <input type="radio" name="payment" value="hotove" checked={form.payment === 'hotove'} onChange={() => setForm({ ...form, payment: 'hotove' })} />
                <span><strong>Osobně</strong>Při vrácení klíčů u správce</span>
              </label>
              <label>
                <input type="radio" name="payment" value="prevod" checked={form.payment === 'prevod'} onChange={() => setForm({ ...form, payment: 'prevod' })} />
                <span><strong>Převodem</strong>Na účet Sokola Kramolna</span>
              </label>
            </div>
          </div>
          <div className="full">
            <p className="skp-rules-notice">
              Vstupem na kurt souhlasíte s <a onClick={(e) => { e.preventDefault(); setShowRules(true); }}>provozním řádem</a>.
            </p>
          </div>
        </div>
      </div>
    );
  } else if (step === 3) {
    mainContent = (
      <div className="skp-review-card">
        <h3>Zkontrolujte rezervaci</h3>
        <div className="skp-review-sec">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div className="lbl">Termín</div>
            <button className="skp-edit" onClick={() => goStep(1)}>Změnit</button>
          </div>
          <div className="kv"><span className="k">Datum</span><span className="v">{DOW[selDate!.getDay()]} {fmtDMY(selDate!)}</span></div>
          <div className="kv"><span className="k">Čas</span><span className="v">{timeLabel} · {hoursCount} h</span></div>
        </div>
        <div className="skp-review-sec">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div className="lbl">Kontaktní údaje</div>
            <button className="skp-edit" onClick={() => goStep(2)}>Změnit</button>
          </div>
          <div className="kv"><span className="k">Jméno</span><span className="v">{form.name}</span></div>
          <div className="kv"><span className="k">E-mail</span><span className="v">{form.email}</span></div>
          {form.phone.trim() && <div className="kv"><span className="k">Telefon</span><span className="v">{form.phone}</span></div>}
          {form.note && <div className="kv"><span className="k">Poznámka</span><span className="v" style={{ maxWidth: 260, textAlign: 'right', fontWeight: 400 }}>{form.note}</span></div>}
        </div>
        <div className="skp-review-sec">
          <div className="lbl">Platba</div>
          <div className="kv">
            <span className="k">Způsob platby</span>
            <span className="v">{form.payment === 'hotove' ? 'Osobně při vrácení klíčů' : 'Převodem na účet Sokola'}</span>
          </div>
          <div className="kv"><span className="k">Celkem k úhradě</span><span className="v" style={{ fontSize: 18 }}>{total} Kč</span></div>
          <p style={{ fontSize: 13, color: 'var(--sk-mute)', margin: '8px 0 0', lineHeight: 1.5 }}>Rezervaci lze kdykoliv zdarma zrušit kliknutím na odkaz v potvrzovacím e-mailu.</p>
        </div>
      </div>
    );
  }

  const rulesModal = showRules && (
    <div className="skp-modal-overlay" onClick={() => setShowRules(false)}>
      <div className="skp-modal" onClick={(e) => e.stopPropagation()}>
        <button className="skp-modal-close" onClick={() => setShowRules(false)} aria-label="Zavřít">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
        <h3>Provozní řád tenisového kurtu</h3>
        <p>Vítejte na našem kurtu! Abychom udrželi antuku v perfektním stavu pro vás i pro ty, co přijdou po vás, dodržujte prosím tato základní pravidla:</p>
        <h4>1. Klíče a bezpečnost</h4>
        <ul>
          <li><strong>Vstup a odchod:</strong> Klíče od kurtu si vyzvedávejte a vracejte podle domluvených pravidel.</li>
          <li><strong>Zamykání:</strong> Poslední hráč dne (nebo pokud po vás nikdo nenastupuje) je povinen kurt i zázemí vždy uzamknout.</li>
          <li><strong>Skládek:</strong> Klíč od kurtu pasuje také do skládku s vybavením. Najdete v něm lajnovačku, vápno, košťata a síť. Po použití nářadí vše ukliďte zpět a skládek zamkněte.</li>
        </ul>
        <h4>2. Údržba kurtu a lajnování</h4>
        <ul>
          <li><strong>Kropení:</strong> Pokud je kurt suchý nebo práší, před hrou ho důkladně pokropte. Antuka se tím chrání před poničením.</li>
          <li><strong>Srovnání povrchu:</strong> Případné díry po skluzu ihned zarovnejte (zašlápněte) ještě během hry.</li>
          <li><strong>Lajnování:</strong> Kurt nemá pevné lajny. Před hrou (nebo podle potřeby) si kurt nalajnujte vápnem pomocí lajnovačky ze skládku.</li>
          <li><strong>Úklid po hře:</strong> Každý hráč je povinen po skončení hry kurt stáhnout síťovanou metlou (od krajů ke středu), aby byl připravený pro další hráče.</li>
        </ul>
        <h4>3. Obecné zásady</h4>
        <ul>
          <li>Na kurt je povolen vstup pouze v tenisové obuvi určené na antuku (hladký vzorek, ne hrubá podrážka/traktory).</li>
          <li>Chovejte se k vybavení ohleduplně a udržujte na kurtu i v jeho okolí pořádek.</li>
        </ul>
        <p className="skp-modal-footer">Díky, že pomáháte udržovat kurt v super stavu! Hře zdar!</p>
        <div style={{ marginTop: 24 }}>
          <button className="skp-btn-primary" style={{ maxWidth: 260 }} onClick={() => setShowRules(false)}>
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="skp-scroll" style={{ paddingRight: 4 }}>
        <div style={{ marginBottom: 20 }}>{stepper}</div>
        <div className="skp-resv">
          <div className="skp-resv-main">{mainContent}</div>
          {summary}
        </div>
      </div>
      {rulesModal}
    </>
  );
}
