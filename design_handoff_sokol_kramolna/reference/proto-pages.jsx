// proto-pages.jsx — O nás a Kontakt (reálný obsah z veřejných zdrojů).

function OnasPage({ onNavigate }) {
  const timeline = [
    { y: '1862', t: 'Vznik Sokola', d: 'Tělocvičnou jednotu Sokol Pražský zakládají Miroslav Tyrš a Jindřich Fügner. Začíná tradice českého spolkového cvičení.' },
    { y: '20. l.', t: 'Sokol v Kramolně', d: 'V obci se rozvíjí čilý spolkový život a vzniká i místní tělocvičná jednota Sokol Kramolna.' },
    { y: '1941', t: 'Zákaz za okupace', d: 'Činnost Sokola je nacisty zastavena (Akce Sokol). Datum 8. října se dnes připomíná jako Památný den sokolstva.' },
    { y: '1990', t: 'Obnova činnosti', d: 'Po listopadu 1989 se Česká obec sokolská i místní jednoty vracejí k práci a majetku.' },
    { y: 'Dnes', t: 'Sport pro obec', d: 'Provozujeme antukový kurt a posilovnu, pořádáme akce a pečujeme o areál pro občany Kramolny i okolí.' },
  ];
  const values = [
    { ic: <Icon.shield />, t: 'Zdravý pohyb', d: 'Sport přístupný všem věkovým skupinám, od dětí po seniory.' },
    { ic: <Icon.pin />, t: 'Péče o obec', d: 'Udržujeme areál jako místo setkávání v srdci Kramolny.' },
    { ic: <Icon.clock />, t: 'Tradice i dnešek', d: 'Hlásíme se k hodnotám Sokola „Tužme se" a otevíráme je dnešní době.' },
  ];

  return (
    <div className="sk-page skp-page" data-screen-label="O nás">
      <ProtoHeader active="O nás" onNavigate={onNavigate} />

      <div className="sk-pagewrap">
        <div className="sk-pagehead">
          <div className="sk-pagehead-l">
            <h1>O nás</h1>
            <p>Tělocvičná jednota Sokol Kramolna — sport a spolkový život v podhůří u Náchoda.</p>
          </div>
        </div>

        <div className="skp-scroll">
          <p className="skp-onas-lead">
            Jsme dobrovolný spolek, který v Kramolně nabízí prostor pro sport, setkávání a péči o společný areál — a navazuje na více než stoletou tradici českého Sokola.
          </p>

          <div className="skp-onas-cols">
            <div className="skp-onas-body">
              <p>
                Tělocvičná jednota <strong>Sokol Kramolna</strong> působí v obci pod úpatím Krkonoš, nedaleko Náchoda. Kramolnu dnes tvoří tři části — <strong>Kramolna, Lhotky a Trubějov</strong> — a žije v ní kolem 1 100 obyvatel. První písemná zmínka o vsi pochází z roku 1415.
              </p>
              <p>
                Provozujeme <strong>antukový tenisový kurt</strong> a <strong>posilovnu</strong> v budově sokolovny, pořádáme turnaje a společenské akce a staráme se o areál jako o živé místo setkávání. Okolí láká i k pohybu v přírodě — vsí prochází turistické i cyklistické trasy a nedaleko stojí rozhledna Dobrošov.
              </p>
              <p>
                Jsme součástí <strong>České obce sokolské</strong>, jedné z nejstarších tělovýchovných organizací v Evropě, a spadáme pod <strong>župu Podkrkonošskou – Jiráskovu</strong>. Hlásíme se k jejím hodnotám: zdravý pohyb, otevřenost všem a péče o obec.
              </p>

              <div className="skp-values">
                {values.map((v, i) => (
                  <div key={i} className="skp-value">
                    <div className="ic">{v.ic}</div>
                    <div className="t">{v.t}</div>
                    <div className="d">{v.d}</div>
                  </div>
                ))}
              </div>
            </div>

            <section className="sk-panel">
              <h3>Z naší historie</h3>
              <div className="skp-timeline">
                {timeline.map((e, i) => (
                  <div key={i} className="skp-tl-item">
                    <div className="skp-tl-year">{e.y}</div>
                    <div className="skp-tl-body">
                      <div className="t">{e.t}</div>
                      <div className="d">{e.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      <SokolFooter />
    </div>
  );
}

function KontaktPage({ onNavigate }) {
  return (
    <div className="sk-page skp-page" data-screen-label="Kontakt">
      <ProtoHeader active="Kontakt" onNavigate={onNavigate} />

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
                <div className="ic">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                </div>
                <div>
                  <div className="lbl">E-mail</div>
                  <div className="big">kramolna@sokol.eu</div>
                  <div className="small">Spadáme pod Sokolskou župu Podkrkonošskou – Jiráskovu.</div>
                </div>
              </div>

              <section className="sk-panel sk-hours" style={{ marginTop: 2 }}>
                <h3>Provozní doba areálu</h3>
                <div className="skp-hours-table">
                  <div className="row today"><span className="d">Sobota (dnes)</span><span>9:00 – 20:00</span></div>
                  <div className="row"><span className="d">Neděle</span><span>9:00 – 20:00</span></div>
                  <div className="row"><span className="d">Pondělí – Pátek</span><span>8:00 – 21:00</span></div>
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

      <SokolFooter />
    </div>
  );
}

// stylizovaná „mapka“ — placeholder, ne reálná data
function KramolnaMap() {
  return (
    <svg viewBox="0 0 600 460" preserveAspectRatio="xMidYMid slice">
      <rect width="600" height="460" fill="#e9e3d4" />
      {/* zeleň / lesy */}
      <path d="M0 0h220v150q-120 30-220 10z" fill="#cdd9c2" />
      <path d="M600 300v160H360q40-120 240-160z" fill="#cdd9c2" />
      <circle cx="90" cy="380" r="80" fill="#d3ddc8" />
      {/* vodní tok */}
      <path d="M-20 90 Q180 160 300 130 T640 210" fill="none" stroke="#bcd0d6" strokeWidth="12" opacity="0.8" />
      {/* silnice */}
      <path d="M-20 250 Q200 230 300 250 T640 240" fill="none" stroke="#fff" strokeWidth="10" />
      <path d="M300 -20 L300 250 L420 480" fill="none" stroke="#fff" strokeWidth="8" />
      <path d="M120 480 L260 250" fill="none" stroke="#fff" strokeWidth="6" />
      {/* bloky domů */}
      <g fill="#d8cfba">
        <rect x="250" y="200" width="26" height="20" /><rect x="284" y="196" width="22" height="18" />
        <rect x="318" y="262" width="24" height="20" /><rect x="280" y="270" width="26" height="18" />
        <rect x="232" y="258" width="20" height="18" /><rect x="340" y="218" width="22" height="16" />
      </g>
      <line x1="0" y1="0" x2="0" y2="0" />
    </svg>
  );
}

window.OnasPage = OnasPage;
window.KontaktPage = KontaktPage;
