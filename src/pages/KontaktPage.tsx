import { Icon } from '../components/Icon';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import type { Route } from '../types';

type Props = { onNavigate: (route: Route) => void };

const DOW_FULL = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];

type HoursRow = { label: string; time: string; isWeekend: boolean };

const HOURS_ROWS: HoursRow[] = [
  { label: 'Pondělí – Pátek', time: '8:00 – 21:00', isWeekend: false },
  { label: 'Sobota – Neděle', time: '9:00 – 20:00', isWeekend: true },
];

export function KontaktPage({ onNavigate }: Props) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const isWeekendToday = dayOfWeek === 0 || dayOfWeek === 6;
  const todayName = DOW_FULL[dayOfWeek];

  return (
    <div className="sk-page skp-page">
      <Header active="Kontakt" onNavigate={onNavigate} />

      <div className="sk-pagewrap">
        <div className="sk-pagehead">
          <div className="sk-pagehead-l">
            <h1>Kontakt</h1>
            <p>Najdete nás v Kramolně u Náchoda. Ozvěte se nám — rádi pomůžeme s rezervací i členstvím.</p>
          </div>
        </div>

        <div className="skp-scroll">
          <div className="skp-contact-grid">
            <div className="skp-contact-cards">
              <div className="skp-contact-card">
                <div className="ic"><Icon.pin /></div>
                <div>
                  <div className="lbl">Adresa</div>
                  <div className="big">T.J. Sokol Kramolna</div>
                  <div className="small">Kramolna 76<br />547 01 Náchod<br />Královéhradecký kraj</div>
                </div>
              </div>
              <div className="skp-contact-card">
                <div className="ic"><Icon.phone /></div>
                <div>
                  <div className="lbl">Telefon</div>
                  <div className="big">776 026 304</div>
                  <div className="small">Správce areálu — nejlépe v provozních hodinách.</div>
                </div>
              </div>
              <div className="skp-contact-card">
                <div className="ic"><Icon.email /></div>
                <div>
                  <div className="lbl">E-mail</div>
                  <div className="big">kramolna@sokol.eu</div>
                  <div className="small">Spadáme pod Sokolskou župu Podkrkonošskou – Jiráskovu.</div>
                </div>
              </div>

              <section className="sk-panel sk-hours" style={{ marginTop: 2 }}>
                <h3>Provozní doba areálu</h3>
                <div className="skp-hours-table">
                  {HOURS_ROWS.map((row, i) => {
                    const isToday = row.isWeekend === isWeekendToday;
                    return (
                      <div key={i} className={'row' + (isToday ? ' today' : '')}>
                        <span className="d">
                          {row.label}
                          {isToday && <span style={{ fontWeight: 400, marginLeft: 6 }}>({todayName})</span>}
                        </span>
                        <span>{row.time}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="note">Posilovna je pro členy s čipem přístupná i mimo přítomnost správce.</p>
              </section>
            </div>

            <div className="skp-map">
              <KramolnaMap />
              <div className="pin"><Icon.pin size={40} /></div>
              <div className="pin-label">Sokol Kramolna</div>
              <div className="maptag">Kramolna · okres Náchod</div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function KramolnaMap() {
  return (
    <svg viewBox="0 0 600 460" preserveAspectRatio="xMidYMid slice">
      <rect width="600" height="460" fill="#e9e3d4" />
      <path d="M0 0h220v150q-120 30-220 10z" fill="#cdd9c2" />
      <path d="M600 300v160H360q40-120 240-160z" fill="#cdd9c2" />
      <circle cx="90" cy="380" r="80" fill="#d3ddc8" />
      <path d="M-20 90 Q180 160 300 130 T640 210" fill="none" stroke="#bcd0d6" strokeWidth="12" opacity="0.8" />
      <path d="M-20 250 Q200 230 300 250 T640 240" fill="none" stroke="#fff" strokeWidth="10" />
      <path d="M300 -20 L300 250 L420 480" fill="none" stroke="#fff" strokeWidth="8" />
      <path d="M120 480 L260 250" fill="none" stroke="#fff" strokeWidth="6" />
      <g fill="#d8cfba">
        <rect x="250" y="200" width="26" height="20" /><rect x="284" y="196" width="22" height="18" />
        <rect x="318" y="262" width="24" height="20" /><rect x="280" y="270" width="26" height="18" />
        <rect x="232" y="258" width="20" height="18" /><rect x="340" y="218" width="22" height="16" />
      </g>
    </svg>
  );
}
