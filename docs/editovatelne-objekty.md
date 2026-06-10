# Soupis editovatelných vizuálních objektů webu Sokol Kramolna

## Kontext

Administrátor by měl mít možnost editovat obsah webu bez zásahu do kódu. Dnes je veškerý statický obsah hardcoded v JSX/TS souborech (jen rezervace, blokace a nastavení e-mailového ověření jsou v D1 databázi). Tento dokument je inventář všech vizuálních/obsahových objektů — podklad pro budoucí návrh editačního rozhraní.

---

## A. Typy objektů (opakující se struktury)

| # | Typ objektu | Struktura (pole) | Kde se vyskytuje | Počet |
|---|------------|------------------|------------------|-------|
| 1 | **Položka menu** | text, cílová stránka | Header (`src/components/Header.tsx:5-10`) | 4 (O nás, Tenis, Posilovna, Kontakt) |
| 2 | **Akční karta** (velké tlačítko) | obrázek, nadpis, popis (2 řádky), text CTA | Homepage (`src/pages/HomePage.tsx:30-48`) | 2 (Tenis, Posilovna) |
| 3 | **Hero sekce** | obrázek na pozadí, H1, podtitulek | Homepage (`HomePage.tsx:18-28`) | 1 |
| 4 | **Info sloupec** | ikona, nadpis, text (více řádků) | Homepage info pás (`HomePage.tsx:50-73`) | 4 (Kde nás najdete, Kontakt, Provozní doba, Sokol) |
| 5 | **Stránkový úvod (pagehead)** | H1, intro text | O nás, Kontakt, Tenis, Posilovna | 4 |
| 6 | **Volný text / odstavce** | nadpis sekce + odstavce | O nás (`OnasPage.tsx:36-50`) | 1 lead + 3 odstavce |
| 7 | **Karta hodnoty** | ikona, titulek, popis | O nás (`OnasPage.tsx:16-20`) | 3 |
| 8 | **Položka timeline** | rok/období, titulek, popis | O nás (`OnasPage.tsx:8-14`) | 5 |
| 9 | **Statistika (stat)** | hodnota, popisek | Tenis + Posilovna přehled (`src/data/activities.ts`) | 3 + 3 |
| 10 | **Hero aktivity** | eyebrow, H2, text | Tenis + Posilovna (`activities.ts`) | 2 |
| 11 | **Pravidlo rezervace** (položka seznamu) | text | Tenis (6×), Posilovna (4×) (`activities.ts`) | 10 |
| 12 | **Řádek otevírací doby** | dny, čas | Tenis, Posilovna, Kontakt | 2+2+2 + poznámky |
| 13 | **Řádek ceníku** | název, podtitulek, cena | Tenis (2×), Posilovna (4×) (`activities.ts`) | 6 + poznámky k ceníku |
| 14 | **Kontaktní karta** | ikona, label, hlavní údaj, poznámka | Kontakt (`KontaktPage.tsx:38-61`) | 3 (adresa, telefon, e-mail) |
| 15 | **Mapa** | URL iframe | Kontakt (`KontaktPage.tsx:84-90`) | 1 |
| 16 | **Odkaz v patičce** | text, cíl | Footer (`src/components/Footer.tsx`) | 2 (Ochrana os. údajů, Provozní řád) |
| 17 | **Logo + název webu** | obrázek, text | Header | 1 |
| 18 | **Obrázky** | soubor v `public/` | hero.webp, raketa.webp, cinka.webp, sokol_kramolna.png | 4 |
| 19 | **Globální kontaktní údaje** (sdílený objekt) | telefon, e-mail, adresa (3 řádky), provozní doby, poznámky | Homepage info sloupce, Kontakt, `activities.ts` (hours) — edituje se jednou, propisuje se všude | 1 |
| 20 | **E-mailová šablona** | předmět, tělo (potvrzení / ověření / zrušení rezervace) | `src/worker.ts` | ~3 |
| 21 | **Provozní řád** | strukturovaný text (sekce s nadpisy a body) | modál v `ReservationFlow.tsx:572-591` + odkaz v patičce | 1 |
| 22 | **Texty rezervačního průvodce** | popisky kroků, názvy polí, popisy platebních metod, text souhlasu, potvrzovací hlášky | `ReservationFlow.tsx` | ~15 textů |

## B. Soupis po stránkách

### Header (všechny stránky) — `src/components/Header.tsx`

- Logo (obrázek `sokol_kramolna.png`) + text „SOKOL KRAMOLNA"
- 4 položky menu: O nás, Tenis, Posilovna, Kontakt (konstanta `NAV_ITEMS`)

### Footer (všechny stránky) — `src/components/Footer.tsx`

- Copyright text „Sokol Kramolna © [rok]"
- Odkazy: „Ochrana osobních údajů", „Provozní řád areálu"

### Homepage — `src/pages/HomePage.tsx`

- Hero: obrázek `/hero.webp`, H1 „Sokol Kramolna", podtitulek
- 2 akční karty (Tenis, Posilovna): obrázek + nadpis + popis + CTA „ZOBRAZIT"
- 4 info sloupce: adresa, kontakt (telefon, e-mail), provozní doba, text o Sokolu

### O nás — `src/pages/OnasPage.tsx`

- Pagehead: H1 + intro
- Lead odstavec + 3 odstavce textu
- 3 karty hodnot (ikona, titulek, popis)
- Timeline: 5 položek (rok, titulek, popis)

### Tenis / Posilovna — `src/pages/ActivityPage.tsx` + `src/data/activities.ts`

Obsah obou aktivit je centralizovaný v konstantě `ACT` v `activities.ts` — názvy, intro, hero (eyebrow/H2/text), 3 statistiky, text CTA, pravidla rezervace, otevírací doby + poznámka, ceník (řádky + poznámka). Toto je nejlépe strukturovaná část — datový model už existuje, jen je hardcoded.

- Navíc texty rezervačního formuláře a provozní řád v modálu (`src/features/reservation/ReservationFlow.tsx`)

### Kontakt — `src/pages/KontaktPage.tsx`

- Pagehead: H1 + intro
- 3 kontaktní karty: adresa (název spolku + 3 řádky), telefon + poznámka, e-mail + poznámka
- Tabulka provozní doby (2 řádky) + poznámka
- Mapa (iframe `https://mapy.com/s/hevufegega`)

## C. Přijatá rozhodnutí (2026-06-10)

- Soupis **zahrnuje** i obsah mimo stránky: e-mailové šablony, provozní řád (modál) a texty rezervačního průvodce — typy 20–22 výše.
- Duplicitní údaje (telefon 776 026 304, e-mail kramolna@sokol.eu, adresa, provozní doby — dnes nezávisle na Homepage, Kontaktu i v `activities.ts`) se povedou jako **jeden sdílený objekt „globální kontaktní údaje"** (typ 19), editovatelný na jednom místě s propisem všude.

## D. Co už admin editovat umí (existující admin sekce)

Přes záložku „Správa" (aktivace: 5× klik na logo): rezervace (CRUD), blokace termínů, nastavení e-mailového ověření per aktivita. Statický obsah editovat nelze.
