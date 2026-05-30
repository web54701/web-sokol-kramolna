// proto-home.jsx — úvodní stránka prototypu (klikatelná).
// Obrázek krajiny je image-slot (uživatel přetáhne vlastní ilustraci).
// Dvě velká tlačítka Tenis / Posilovna vedou rovnou do rezervace.

function HomePage({ onNavigate }) {
  return (
    <div className="sk-page skp-home" data-screen-label="Úvod">
      <ProtoHeader active={null} onNavigate={onNavigate} />

      <div className="skp-home-scroll">
        <div className="skp-home-hero">
          <image-slot
            id="home-hero"
            shape="rect"
            fit="cover"
            placeholder="Přetáhněte sem ilustraci krajiny a areálu">
          </image-slot>
          <div className="skp-home-hero-scrim"></div>
          <div className="skp-home-hero-text">
            <h1>Sokol Kramolna</h1>
            <p>Sportovní areál v srdci Kramolny.<br />Tenisový kurt a posilovna pro všechny.</p>
          </div>
        </div>

        <div className="skp-home-cards">
          <div className="sk-action-card is-green" onClick={() => onNavigate('tenis')}>
            <div className="sk-action-icon"><Icon.racket size={68} /></div>
            <div className="sk-action-body">
              <div className="sk-action-title">Tenis</div>
              <div className="sk-action-sub">Rezervace kurtu<br />a ceník</div>
              <div className="sk-action-cta">ZOBRAZIT <Icon.arrowR size={20} /></div>
            </div>
          </div>

          <div className="sk-action-card is-rust" onClick={() => onNavigate('gym')}>
            <div className="sk-action-icon"><Icon.dumbbell size={68} /></div>
            <div className="sk-action-body">
              <div className="sk-action-title">Posilovna</div>
              <div className="sk-action-sub">Rezervace vstupu<br />a ceník</div>
              <div className="sk-action-cta">ZOBRAZIT <Icon.arrowR size={20} /></div>
            </div>
          </div>
        </div>

        <section className="sk-info-row skp-info-row">
          <div className="sk-info-col">
            <h4><span className="sk-info-icon"><Icon.pin /></span> Kde nás najdete</h4>
            <p>Kramolna 76<br />547 01 Náchod<br />okres Náchod</p>
          </div>
          <div className="sk-info-col">
            <h4><span className="sk-info-icon"><Icon.phone /></span> Kontakt</h4>
            <p>776 026 304<br />kramolna@sokol.eu</p>
          </div>
          <div className="sk-info-col">
            <h4><span className="sk-info-icon"><Icon.clock /></span> Provozní doba</h4>
            <ul>
              <li><span className="k">Po – Pá</span>8:00 – 21:00</li>
              <li><span className="k">So – Ne</span>9:00 – 20:00</li>
            </ul>
            <p style={{ marginTop: 8, fontSize: 12, color: 'var(--sk-mute)' }}>Podrobnosti na stránkách aktivit.</p>
          </div>
          <div className="sk-info-col">
            <h4><span className="sk-info-icon"><Icon.shield /></span> Sokol</h4>
            <p>Jsme součástí tradiční české tělovýchovné organizace.</p>
          </div>
        </section>

        <SokolFooter />
      </div>
    </div>
  );
}

window.HomePage = HomePage;
