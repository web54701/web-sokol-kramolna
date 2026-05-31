import { Icon } from '../components/Icon';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import type { Route } from '../types';

type Props = { onNavigate: (route: Route) => void; isAdmin?: boolean; onAdminActivate?: () => void };

const DOW_FULL = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];

type HoursRow = { label: string; time: string; isWeekend: boolean };

const HOURS_ROWS: HoursRow[] = [
  { label: 'Pondělí – Pátek', time: '8:00 – 21:00', isWeekend: false },
  { label: 'Sobota – Neděle', time: '9:00 – 20:00', isWeekend: true },
];

export function KontaktPage({ onNavigate, isAdmin, onAdminActivate }: Props) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const isWeekendToday = dayOfWeek === 0 || dayOfWeek === 6;
  const todayName = DOW_FULL[dayOfWeek];

  return (
    <div className="sk-page skp-page">
      <Header active="Kontakt" onNavigate={onNavigate} isAdmin={isAdmin} onAdminActivate={onAdminActivate} />

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
                  <div className="small">Kramolna 85<br />547 01 Kramolna<br />Královéhradecký kraj</div>
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
              <iframe
                src="https://mapy.com/s/hevufegega"
                width="400"
                height="280"
                style={{ border: 'none', width: '100%', height: '100%', display: 'block' }}
                title="Mapa — Sokol Kramolna"
              />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
