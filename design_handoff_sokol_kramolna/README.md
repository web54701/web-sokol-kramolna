# Handoff: Web Sokol Kramolna — interaktivní prototyp

> Předávací balíček pro vývojáře, který bude web implementovat a dále rozšiřovat
> v **React + Vite**. Cílem je z těchto návrhů udělat produkční aplikaci.

---

## 1. Přehled

Web tělocvičné jednoty **Sokol Kramolna**. Veřejná prezentace spolku + online
rezervační systém pro dvě aktivity (tenisový kurt a posilovna). Prototyp obsahuje
**úvodní stránku** (výchozí obrazovka) a čtyři sekce dostupné z horní navigace:

0. **Úvod (Domů)** — hero s obrázkem krajiny/areálu, dvě velká tlačítka
   (Tenis / Posilovna) vedoucí do rezervace, orámovaný info panel + zápatí.
   Dostupná přes logo v hlavičce (není položkou v navigaci).
1. **O nás** — historie spolku, hodnoty, kontext obce.
2. **Tenis** — přehled / ceník / rezervace kurtu (hodinové bloky).
3. **Posilovna** — přehled / ceník / rezervace vstupu (hodinové bloky, kapacita 15 míst).
4. **Kontakt** — adresa, telefon, e-mail, provozní doba, stylizovaná mapka.

Jádrem produktu je **rezervační wizard** (3 kroky + potvrzení), který je
sdílený mezi Tenisem a Posilovnou a jen konfigurovaný (ceny, kapacita, texty).

---

## 2. O souborech v tomto balíčku

Soubory ve složce `reference/` jsou **designové reference vytvořené v HTML/JSX** —
prototyp, který ukazuje zamýšlený vzhled a chování. **Nejsou to produkční zdrojové
kódy k přímému nasazení.** Prototyp běží přes Babel-in-browser a sdílí komponenty
přes `window.*`, což je čistě pro účely náhledu.

**Úkol:** přenést tyto návrhy do reálného prostředí **React + Vite** podle níže
popsané struktury — zachovat vizuál pixel-by-pixel, ale použít skutečné ES moduly,
build pipeline a (volitelně) reálné API pro rezervace.

Dobrá zpráva: prototyp už je **napsaný v Reactu (React 18, funkční komponenty,
hooky `useState`/`useMemo`/`useRef`)**, takže logika i JSX se přenesou téměř 1:1.
Hlavní práce je v rozdělení do modulů a napojení dat.

### Soubory ve `reference/`

| Soubor | Obsah |
|---|---|
| `Sokol Kramolna Prototyp.html` | Vstupní HTML — pořadí načítání skriptů, fonty, mount pointu. |
| `shared.jsx` | Ikony (`Icon`), header, footer, sub-nav, dekorace, placeholder ilustrace. |
| `proto-app.jsx` | Shell aplikace: header s navigací + jednoduchý router (stav v `localStorage`). |
| `proto-activity.jsx` | Stránka aktivity (Tenis/Posilovna) s taby Přehled / Ceník / Rezervace. Config `ACT`. |
| `proto-reservation.jsx` | **Rezervační wizard** — kalendář, výběr slotů, formulář, kontrola, potvrzení. Config `MODES`. |
| `proto-home.jsx` | **Úvodní stránka** — hero (image-slot), dvě velká CTA tlačítka, orámovaný info panel. |
| `proto-pages.jsx` | Stránky **O nás** a **Kontakt** (včetně stylizované SVG mapky). |
| `image-slot.js` | Web component `<image-slot>` — drag-and-drop placeholder pro obrázek hero. |
| `styles.css` | Design tokeny (CSS proměnné) + základní styly (header, footer, panely, kalendář, ceník). |
| `proto.css` | Styly specifické pro prototyp (navigace, stepper, sloty, summary, formulář, success, kontakt, O nás). |

> Pozn.: `styles.css` obsahuje i styly pro statickou „web" verzi (homepage, plné
> stránky), které tento prototyp nepoužívá. Při migraci lze nepoužité třídy
> vypustit, nebo ponechat — neškodí.

---

## 3. Fidelita

**High-fidelity (hifi).** Návrhy mají finální barvy, typografii, rozestupy
a interakce. Vývojář by měl UI **rekreovat pixel-perfektně**. Veškeré hodnoty
(barvy, mezery, velikosti písma) jsou definované jako CSS proměnné v `styles.css`
— viz sekce Design tokeny.

---

## 4. Cílová architektura (React + Vite)

Doporučená struktura projektu po migraci:

```
src/
  main.jsx                  // ReactDOM.createRoot — viz proto-app.jsx (konec souboru)
  App.jsx                   // router + stav route (viz funkce App v proto-app.jsx)
  components/
    Icon.jsx                // export jednotlivých ikon nebo objekt Icon (z shared.jsx)
    Header.jsx              // ProtoHeader (z proto-app.jsx)
    Footer.jsx              // SokolFooter (z shared.jsx)
    SubNav.jsx              // SubNav (z shared.jsx)
  pages/
    HomePage.jsx            // proto-home.jsx (úvodní stránka)
    ActivityPage.jsx        // proto-activity.jsx (+ ACT config → data/activities.js)
    OnasPage.jsx            // proto-pages.jsx
    KontaktPage.jsx         // proto-pages.jsx
  features/reservation/
    ReservationFlow.jsx     // proto-reservation.jsx
    reservation.config.js   // objekt MODES (ceny, kapacita)
    date-utils.js           // DOW, epochDay, fmtDM, fmtDMY, seed, weekStart
  styles/
    tokens.css              // :root proměnné z styles.css
    base.css                // zbytek styles.css
    reservation.css         // proto.css
```

### Co je potřeba změnit oproti prototypu

1. **ES moduly místo `window.*`.** V prototypu se komponenty sdílí přes
   `window.SokolHeader = ...` / `Object.assign(window, {...})`. Nahraďte
   standardním `export` / `import`.
2. **Žádný Babel-in-browser.** Vite transpiluje JSX při buildu. Smažte CDN
   `<script>` tagy pro React/ReactDOM/Babel — místo toho `npm i react react-dom`.
3. **Router.** Prototyp má naivní router (`useState('route')` + podmíněný render
   v `App`). Pro produkci doporučujeme **React Router** s reálnými cestami
   (`/o-nas`, `/tenis`, `/posilovna`, `/kontakt`) kvůli sdílení odkazů a SEO.
   Mapování route → komponenta je v `proto-app.jsx` (funkce `App`).
4. **Fonty.** Prototyp načítá Google Fonts přes `<link>`. Ponechte, nebo
   self-hostněte (`@fontsource/...`) pro produkci. Použité rodiny:
   `Source Serif 4`, `Source Sans 3`, `JetBrains Mono`.
6. **Obrázek hero (`<image-slot>`).** V prototypu je hero obrázek řešen web
   componentou `<image-slot>`, do které uživatel přetáhne ilustraci (persistuje se
   do sidecar souboru). V **produkci nahraďte obyčejným `<img>`** (resp.
   `<picture>` / CDN / `next/image`) s reálnou fotkou/ilustrací areálu — `image-slot.js`
   do produkce nepatří, je to jen nástroj pro prototyp. Zachovejte `object-fit: cover`
   a full-bleed v rámci hero kontejneru + světlý závoj pro čitelnost titulku.
5. **Data rezervací.** Viz sekce 7 — momentálně deterministická pseudonáhoda;
   nahradit reálným API.

---

## 5. Navigace a routing

**Výchozí obrazovka je Úvod (`home`).** Logo (kolečko „S" + „SOKOL / KRAMOLNA")
vede zpět na úvod. Horní navigace, **pořadí položek je závazné**:

| Pořadí | Label | Route (prototyp) | Doporučená cesta |
|---|---|---|---|
| — | (logo) → Úvod | `home` | `/` |
| 1 | O nás | `onas` | `/o-nas` |
| 2 | Tenis | `tenis` | `/tenis` |
| 3 | Posilovna | `gym` | `/posilovna` |
| 4 | Kontakt | `kontakt` | `/kontakt` |

- Aktivní položka je zvýrazněná zlatou (`--sk-gold`) s 2px podtržením
  (`.sk-navlink.is-active`).
- Logo (kolečko „S" + „SOKOL / KRAMOLNA") je klikací → vede na Tenis
  (resp. doporučeně na úvod / `/`).
- Hover na nelinku: barva přechází na `--sk-gold`.

---

## 6. Obrazovky / pohledy

### 6.0 Úvodní stránka (`HomePage`) — výchozí
Sloupcový layout: header → scrollovatelný obsah (hero + tlačítka + info panel + footer).

- **Hero** (`.skp-home-hero`): výška `44vh`, min. `360px`. Obrázek krajiny/areálu
  je vyplněn přes **`<image-slot>`** (`fit: cover`, full-bleed). Vlevo nahoře
  překryt titulek **„Sokol Kramolna"** (Source Serif 4, 800, jeden řádek,
  `clamp(44px,5.6vw,76px)`) + dvouřádkový podtitul. Pod text je položen světlý
  levý závoj (`.skp-home-hero-scrim`) kvůli čitelnosti na libovolném obrázku.
- **Dvě velká CTA tlačítka** (`.sk-action-card`): Tenis (zelené `--sk-green-800`)
  a Posilovna (rezavé `--sk-rust`), radius 16px, stín, ikona vlevo + titul + popis +
  „ZOBRAZIT →". Překrývají spodek hera (negativní `margin-top: -80px`, `z-index: 3`),
  zarovnané vlevo (`max-width: 780px`). **Klikací** → navigace na `tenis` / `gym`.
- **Info panel** (`.skp-info-row`): orámovaný zaoblý panel (`--sk-cream-50`, 1px
  border, radius 16px) se čtyřmi sekcemi (Kde nás najdete / Kontakt / Provozní doba /
  Sokol), **oddělenými svislými hairline čarami** (`border-left` na sloupcích kromě
  prvního). Každá sekce má ikonu + nadpis (Source Serif 4) + obsah.
- **Zápatí** (`SokolFooter`): čistý zelený pruh (žádná dekorace stromků).

### 6.1 Header (společný)
- Výška **76px**, pozadí `--sk-green-800`, padding `0 56px`, `gap: 56px`.
- Vlevo logo: kolečko 48×48px s 1.5px krémovým okrajem, uvnitř kurzíva „S"
  (Source Serif 4, 800, 22px). Vedle dvouřádkový text „SOKOL" / „KRAMOLNA"
  (Source Serif 4, 700, 17px).
- Uprostřed/vpravo `nav` s `gap: 36px`, položky 15px / weight 500, krémové.
- Vpravo dekorativní pruh `[ panorama Kramolny ]` (180px, monospace 9px).

### 6.2 Footer (společný)
- `SokolFooter`: „Sokol Kramolna © 2024" + odkazy „Ochrana osobních údajů",
  „Provozní řád areálu". Třída `.sk-footer`.

### 6.3 Stránka aktivity — Tenis / Posilovna (`ActivityPage`)
Sdílená komponenta řízená configem `ACT[mode]` (`mode` = `'tenis'` | `'gym'`).

Hlavička stránky (`.sk-pagehead`): `h1` (titul) + perex vlevo, vpravo **sub-nav
s taby**: `Přehled` · `Ceník` · `Rezervace kurtu`/`Rezervace vstupu`.

**Tab Přehled** (`ActivityOverview`):
- Grid `1.15fr / 0.95fr`, gap 20px.
- Vlevo **hero karta** (`.skp-hero-card`): pozadí `--sk-green-800`, radius 16px,
  padding `30px 32px`. Obsahuje eyebrow (monospace, zlatá), `h2` (Source Serif 4,
  800, 40px), perex, řádek **3 statistik** dole, a CTA tlačítko (rust pozadí).
- Vpravo (`.skp-side`): panel „Pravidla rezervace" (seznam) + panel „Otevírací
  doba" (řádky den/čas + poznámka).

**Tab Ceník** (`ActivityPricing`):
- Grid `1.4fr / 1fr`. Vlevo panel s ceníkem (řádky položka/cena, hlavička).
  Vpravo poznámková karta + tmavě zelený panel „Rezervovat hned" s CTA.

Konkrétní obsah (texty, ceny, statistiky, pravidla, otevírací doba) je v objektu
`ACT` na začátku `proto-activity.jsx` — přeneste jako data soubor.

### 6.4 Rezervační wizard (`ReservationFlow`) — JÁDRO PRODUKTU
Sdílený mezi tenis a gym, řízený configem `MODES[mode]`.

**Stepper** nahoře: 1 Termín → 2 Vaše údaje → 3 Potvrzení.
Stav `active` (zelená), `done` (rust + ✓), budoucí (šedá).

Layout kroků 1–3: grid `1fr / 320px` — vlevo hlavní obsah, vpravo **sticky
summary panel** (`Souhrn rezervace`) s živým přepočtem ceny a navigačními tlačítky.

**Krok 1 — Termín (kalendář):**
- Týdenní mřížka 7 dní × hodiny **8:00–20:00** (`HOURS = [8..20]`).
- Navigace po týdnech: „‹ / Tento týden / ›". Lze jít max **3 týdny dopředu**
  (`weekOff` 0–3), ne do minulosti.
- Stavy slotu: `free` (volno, zelená `--sk-status-ok`, klikací) ·
  `busy`/`full` (obsazeno, oranžová `--sk-status-busy`) · `past` (proběhlo,
  šrafované, nelze) · `sel` (vaše volba, tmavě zelená + ✓).
- **Slučování bloků:** kliknutím na sousední volné hodiny se spojí do delšího
  souvislého bloku. Odebrat lze jen krajní hodinu (zachová se souvislost).
  Logika viz `clickSlot` v `proto-reservation.jsx`.
- **Posilovna navíc:** v každém volném slotu se zobrazuje **počet volných míst**
  (kapacita 15); plné sloty = 0.
- Legenda + tip pod kalendářem.

**Krok 2 — Vaše údaje (formulář):**
- Pole: Jméno a příjmení*, E-mail*, Telefon*, Poznámka (nepovinné), checkbox
  souhlasu*.
- **Validace:** jméno ≥ 2 znaky; e-mail regex `^[^@\s]+@[^@\s]+\.[^@\s]+$`;
  telefon ≥ 9 číslic (po odstranění mezer); souhlas zaškrtnut. Chyby se ukazují
  až po pokusu pokračovat (`touched`). Chybné pole má červený okraj (`.err`).

**Krok 3 — Kontrola:**
- Souhrn termínu, kontaktu a platby. Sekce mají odkaz „Změnit" zpět na krok 1/2.
- Celková cena „k úhradě na místě".

**Potvrzení (krok 4 — success):**
- Vygeneruje se kód `SK-XXXXX` (5 znaků z `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`),
  „odeslaný na e-mail". Rekapitulace rezervace. Tlačítka „Nová rezervace" /
  „Hotovo".

**Cenová logika** (`MODES[mode].priceFor`):
- Tenis: víkend → 220 Kč/h; Po–Pá 16:00+ → 220 Kč/h (špička); jinak 160 Kč/h.
- Gym: jednorázový vstup 100 Kč/blok.
- Celková cena = součet cen za jednotlivé hodiny bloku.

### 6.5 O nás (`OnasPage`)
- Lead odstavec (Source Serif 4, 26px).
- Dvousloupcový layout `1.3fr / 1fr`: vlevo text (3 odstavce) + 3 karty hodnot
  (ikona + titul + popis); vpravo panel **„Z naší historie"** s vertikální
  timeline (kolečka s letopočty + popis).

### 6.6 Kontakt (`KontaktPage`)
- Grid `1fr / 1.1fr`. Vlevo karty: Adresa, Telefon, E-mail (ikona + label +
  hodnota) + panel „Provozní doba areálu" (řádky, dnešek zvýrazněn rust).
- Vpravo **stylizovaná SVG mapka** (`KramolnaMap`) s pinem a popiskem.
  Pozn.: mapka je dekorativní placeholder — pro produkci zvažte reálnou mapu
  (Mapy.cz / Leaflet / OSM).

---

## 7. Stav, data a API (co dořešit při migraci)

- **Stav prototypu** je čistě klientský; route + aktivní taby se ukládají do
  `localStorage` (`LS_KEY = 'sk-proto-state'`). Pro produkci nahraďte routerem.
- **Dostupnost slotů** je v prototypu **deterministická pseudonáhoda**
  (funkce `seed(dayNo, h)` → busy/free, příp. zbývající kapacita). To je jen
  placeholder pro demo.
  → **K implementaci:** napojit na reálné API — endpoint vracející dostupnost
  slotů pro daný kurt/posilovnu a týden, a endpoint pro vytvoření rezervace.
- **„Teď"** je v prototypu zafixované na `NOW = 30. 5. 2026, 14:20`
  (`proto-reservation.jsx`). V produkci nahraďte `new Date()` (a serverovým časem).
- **Odeslání e-mailu** s potvrzovacím kódem je jen vizuální — propojte s reálným
  backendem (potvrzovací e-mail + double-opt-in odkaz, jak naznačuje copy).
- **Souhlas / GDPR**: checkbox odkazuje na „provozní řád" a zpracování údajů —
  doplňte reálné dokumenty.

---

## 8. Design tokeny

Definováno v `styles.css` v `:root`. Použijte je jako jediný zdroj pravdy.

### Barvy
| Token | Hex | Použití |
|---|---|---|
| `--sk-green-900` | `#143028` | nejtmavší zelená, stíny okrajů |
| `--sk-green-800` | `#1a3a2e` | **primární** — header, tlačítka, hero, nadpisy |
| `--sk-green-700` | `#1f4537` | hover primárního tlačítka |
| `--sk-green-600` | `#2c5847` | focus okraje, hover slotu |
| `--sk-green-400` | `#6a8e7a` | tlumená zelená |
| `--sk-green-100` | `#d9e1d5` | světlá zelená |
| `--sk-cream-50` | `#faf5e8` | text na tmavé, karty |
| `--sk-cream-100` | `#f3ecdc` | **pozadí stránky** |
| `--sk-cream-200` | `#ede4ce` | jemné plochy, ikonová pozadí |
| `--sk-cream-300` | `#e2d8be` | okraje/scrollbar, disabled |
| `--sk-rust` | `#c45a35` | **akcent** — CTA, „done", zvýraznění |
| `--sk-rust-dark` | `#a64a2a` | hover akcentu |
| `--sk-rust-soft` | `#d97a55` | jemný akcent |
| `--sk-gold` | `#d4a82a` | aktivní nav, eyebrow text |
| `--sk-ink` | `#0f2a1e` | hlavní text |
| `--sk-ink-soft` | `#2c3e36` | sekundární text |
| `--sk-mute` | `#5a6b62` | popisky, tlumený text |
| `--sk-line` | `rgba(20,48,40,.10)` | okraje |
| `--sk-line-soft` | `rgba(20,48,40,.06)` | jemné oddělovače |
| `--sk-status-ok` | `#b7d4a8` | volný slot |
| `--sk-status-busy` | `#e89a5b` | obsazený slot |
| `--sk-status-na` | `#d6d3c8` | nedostupné |

### Typografie
| Rodina | Použití |
|---|---|
| **Source Serif 4** (400–800) | nadpisy, displeje, ceny, čísla statistik |
| **Source Sans 3** (400–700) | běžný text, UI, tlačítka |
| **JetBrains Mono** (400–500) | eyebrow/labely (uppercase, letter-spacing), dekorace |

Příklady velikostí: hero `h2` 40px/800; home title 84px/800; sekce `h1`
(viz `.sk-pagehead h1` v styles.css); potvrzovací kód 32px mono; body 14–16px.

### Tvary a efekty
- Radius: tlačítka/inputy `9–10px`, karty `12–18px`, kolečka/odznaky `50%`.
- Výška tlačítek a inputů: `44–46px`.
- Focus ring inputu: `box-shadow: 0 0 0 3px rgba(44,88,71,0.12)` + zelený okraj.
- Přechody: barva/pozadí typicky `.12–.16s`.

---

## 9. Assets

- **Žádné bitmapové assety.** Veškerá grafika je SVG kreslená inline
  (ikony v `Icon` objektu v `shared.jsx`, mapka `KramolnaMap` v `proto-pages.jsx`,
  stromová lišta `TreeDeco`).
- **Placeholdery:** „panorama Kramolny" v headeru je záměrný placeholder.
  **Hero obrázek na úvodní stránce** je `<image-slot>` — v produkci nahraďte
  reálnou fotkou/ilustrací areálu (viz sekce 4, bod 6).
- **Mapka** je dekorativní — viz pozn. v 6.6.
- **Ikony:** doporučujeme ponechat vlastní SVG sadu z `Icon` (pin, phone, clock,
  shield, racket, dumbbell, arrowR, chev, cal, burger), nebo nahradit
  ekvivalenty z icon knihovny dle zvyklostí codebase.

---

## 10. Soubory v původním projektu (reference)

V projektu webu existují i tyto soubory (nejsou nutné pro migraci prototypu,
ale poskytují kontext):
- `Sokol Kramolna Web.html` — statická „web" verze (homepage + plné stránky)
  na design canvasu.
- `Vizuální směry.html` — explorace vizuálních směrů.
- `Sokol Kramolna Prototyp.html` — **tento klikatelný prototyp** (zdroj pravdy
  pro chování), přiložen ve `reference/`.
