import React, { useState, useMemo, useRef } from 'react';
import { Icon } from '../../components/Icon';
import { MODES, type ReservationModeKey } from './reservation.config';
import { DOW, DAY_MS, epochDay, fmtDM, fmtDMY, seed, HOURS, weekStart } from './date-utils';

type Props = {
  mode: ReservationModeKey;
  onGoOverview: () => void;
};

type SelState = { dayNo: number | null; slots: number[] };
type FormState = { name: string; email: string; phone: string; note: string; agree: boolean };

export function ReservationFlow({ mode, onGoOverview }: Props) {
  const cfg = MODES[mode];
  const NOW = new Date();
  const [step, setStep] = useState(1);
  const [weekOff, setWeekOff] = useState(0);
  const [sel, setSel] = useState<SelState>({ dayNo: null, slots: [] });
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', note: '', agree: false });
  const [touched, setTouched] = useState(false);
  const [code, setCode] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { dayNo, slots } = sel;

  const week = useMemo(() => {
    const start = weekStart(NOW, weekOff);
    return Array.from({ length: 7 }, (_, i) => {
      return new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOff]);

  const rangeLabel = `${fmtDM(week[0])} – ${fmtDMY(week[6])}`;

  function slotInfo(date: Date, h: number): { st: string; remaining?: number } {
    const dn = epochDay(date);
    const isToday = dn === epochDay(NOW);
    if (dn < epochDay(NOW) || (isToday && h <= NOW.getHours())) return { st: 'past' };
    const wd = date.getDay();
    const weekend = wd === 0 || wd === 6;
    const s = seed(dn, h);
    if (mode === 'tenis') {
      const busy = s > 0.66 || (weekend && s > 0.5);
      return { st: busy ? 'busy' : 'free' };
    } else {
      const peak = h >= 16 && h <= 19;
      const used = Math.floor(s * (peak ? 17 : 11));
      const remaining = Math.max(0, cfg.capacity! - used);
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
  const phoneOk = form.phone.replace(/\s/g, '').length >= 9;
  const formOk = nameOk && emailOk && phoneOk && form.agree;

  function genCode(): string {
    const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 5; i++) s += a[Math.floor(Math.random() * a.length)];
    return `SK-${s}`;
  }

  function submit() {
    setCode(genCode());
    setStep(4);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }

  function reset() {
    setStep(1);
    setSel({ dayNo: null, slots: [] });
    setForm({ name: '', email: '', phone: '', note: '', agree: false });
    setTouched(false);
    setCode('');
  }

  function goStep(n: number) {
    setStep(n);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
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
              <h2>Rezervace předběžně potvrzena</h2>
              <p className="lead">Zaslali jsme vám potvrzovací kód na e-mail — rezervaci dokončíte kliknutím na odkaz v něm.</p>
            </div>
          </div>

          <div className="skp-success-body">
            <div className="skp-code">
              <span className="lbl">Potvrzovací kód</span>
              <span className="val">{code}</span>
              <span className="mailto">
                <Icon.email size={14} /> {form.email}
              </span>
            </div>

            <div className="skp-success-detail">
              <div className="row"><span className="k">{mode === 'tenis' ? 'Kurt' : 'Posilovna'}</span><span className="v">{cfg.courtShort}</span></div>
              <div className="row"><span className="k">Termín</span><span className="v">{DOW[selDate!.getDay()]} {fmtDMY(selDate!)}</span></div>
              <div className="row"><span className="k">Čas</span><span className="v">{timeLabel} · {hoursCount} h</span></div>
              <div className="row"><span className="k">Jméno</span><span className="v">{form.name}</span></div>
              <div className="row"><span className="k">K úhradě na místě</span><span className="v" style={{ fontSize: 16 }}>{total} Kč</span></div>
            </div>
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
          <div className="skp-sum-row"><span className="k">Sazba</span><span className="v">{mode === 'tenis' ? (cfg.priceFor(selDate!, sortedSlots[0]) === 220 ? 'Špička / víkend' : 'Mimo špičku') : 'Jednorázový vstup'}</span></div>
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
          <button className="skp-btn-primary" disabled={!formOk} onClick={() => { setTouched(true); if (formOk) goStep(3); }}>
            Pokračovat <Icon.arrowR size={18} />
          </button>
        )}
        {step === 3 && (
          <button className="skp-btn-primary" onClick={submit}>
            Závazně rezervovat
          </button>
        )}
      </div>
      {step === 2 && !formOk && touched && (
        <div className="skp-err-msg" style={{ marginTop: 8 }}>Vyplňte prosím všechna povinná pole.</div>
      )}
    </aside>
  );

  // ---------- STEPPER ----------
  const STEPS: [string, string][] = [['1', 'Termín'], ['2', 'Vaše údaje'], ['3', 'Potvrzení']];
  const stepper = (
    <div className="skp-stepper">
      {STEPS.map(([n, label], i) => {
        const idx = i + 1;
        const cls = step === idx ? 'active' : step > idx ? 'done' : '';
        return (
          <React.Fragment key={n}>
            <div className={'skp-step ' + cls}>
              <span className="num">{step > idx ? '✓' : n}</span>
              <span>{label}</span>
            </div>
            {idx < 3 && <span className={'skp-step-line' + (step > idx ? ' done' : '')} />}
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
          <button className="sk-cal-pill icon" onClick={() => setWeekOff((w) => Math.max(0, w - 1))} disabled={weekOff === 0} style={weekOff === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}>
            <Icon.chev dir="left" />
          </button>
          <button className="sk-cal-pill" onClick={() => setWeekOff(0)}>Tento týden</button>
          <button className="sk-cal-pill icon" onClick={() => setWeekOff((w) => Math.min(3, w + 1))}>
            <Icon.chev />
          </button>
        </div>

        <div className="sk-cal-grid" style={{ gridTemplateRows: `28px repeat(${HOURS.length}, 1fr)` }}>
          <div className="sk-cal-cell sk-cal-headrow time"></div>
          {week.map((d) => (
            <div key={d.getTime()} className="sk-cal-cell sk-cal-headrow">{DOW[d.getDay()]} {fmtDM(d)}</div>
          ))}
          {HOURS.map((h) => (
            <React.Fragment key={h}>
              <div className="sk-cal-cell sk-cal-time">{h}:00</div>
              {week.map((d) => {
                const info = slotInfo(d, h);
                const isSel = epochDay(d) === dayNo && slots.includes(h);
                const cls = ['sk-cal-cell', 'sk-cal-slot', info.st, isSel ? 'sel' : ''].join(' ');
                return (
                  <div
                    key={d.getTime() + '-' + h}
                    className={cls}
                    onClick={() => clickSlot(d, h, info.st)}
                    title={info.st === 'free' ? `${DOW[d.getDay()]} ${fmtDM(d)} · ${h}:00` : info.st === 'past' ? 'Již proběhlo' : (mode === 'gym' ? 'Plně obsazeno' : 'Obsazeno')}
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
          </div>
          <div className="skp-field">
            <label>E-mail <span className="req">*</span></label>
            <input className={'skp-input' + showErr(emailOk)} value={form.email} placeholder="jan@email.cz"
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {touched && !emailOk && <span className="skp-err-msg">Zadejte platný e-mail.</span>}
          </div>
          <div className="skp-field">
            <label>Telefon <span className="req">*</span></label>
            <input className={'skp-input' + showErr(phoneOk)} value={form.phone} placeholder="+420 777 123 456"
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="skp-field full">
            <label>Poznámka <span style={{ color: 'var(--sk-mute)', fontWeight: 400 }}>(nepovinné)</span></label>
            <textarea className="skp-input" value={form.note}
              placeholder={mode === 'tenis' ? 'Např. půjčení vybavení, počet hráčů…' : 'Např. první návštěva, potřebuji instruktora…'}
              onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          <label className="skp-check full">
            <input type="checkbox" checked={form.agree} onChange={(e) => setForm({ ...form, agree: e.target.checked })} />
            <span>Souhlasím s <a>provozním řádem areálu</a> a se zpracováním údajů pro účely rezervace.</span>
          </label>
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
          <div className="kv"><span className="k">{mode === 'tenis' ? 'Kurt' : 'Posilovna'}</span><span className="v">{cfg.courtShort}</span></div>
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
          <div className="kv"><span className="k">Telefon</span><span className="v">{form.phone}</span></div>
          {form.note && <div className="kv"><span className="k">Poznámka</span><span className="v" style={{ maxWidth: 260, textAlign: 'right', fontWeight: 400 }}>{form.note}</span></div>}
        </div>
        <div className="skp-review-sec">
          <div className="lbl">Platba</div>
          <div className="kv"><span className="k">Celkem k úhradě na místě</span><span className="v" style={{ fontSize: 18 }}>{total} Kč</span></div>
          <p style={{ fontSize: 13, color: 'var(--sk-mute)', margin: '8px 0 0', lineHeight: 1.5 }}>Platí se hotově nebo kartou u správce. Storno zdarma do 24 hodin před začátkem.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="skp-scroll" style={{ paddingRight: 4 }}>
      <div style={{ marginBottom: 20 }}>{stepper}</div>
      <div className="skp-resv">
        <div className="skp-resv-main">{mainContent}</div>
        {summary}
      </div>
    </div>
  );
}
