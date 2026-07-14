// Sdílené specifikace obrázků pro WYSIWYG editaci. Bez závislostí (bezpečné i pro
// veřejný balíček). Používá je hero (HomePage) i ikona akční karty (CardEditModal),
// přes jednu komponentu MediaPickerModal — žádné duplikované magické hodnoty.

export type ImageSpec = {
  /** Cílová zobrazovací šířka v px (poměr stran se zachová, nezvětšuje se nad zdroj). */
  maxWidth: number;
  /** Nápověda zobrazená v dialogu výběru obrázku. */
  hint: string;
};

// Cílová šířka = SKUTEČNÁ zobrazovací šířka prvku v layoutu (změřeno):
//  - Hero (.skp-home-hero img) se zobrazuje max. 1200 px na šířku (.sk-page má max-width:1200px).
//  - Ikona karty (.sk-action-icon) je 100 px široká (desktop).
export const HERO_IMAGE_SPEC: ImageSpec = {
  maxWidth: 1200,
  hint: 'Hero se na webu zobrazuje max. 1200 px na šířku. Větší obrázek se zmenší na 1200 px, menší zůstane beze změny (nezvětšujeme). Poměr stran se zachová.',
};

export const CARD_ICON_SPEC: ImageSpec = {
  maxWidth: 100,
  hint: 'Ikona karty se zobrazuje 100 px na šířku. Větší obrázek se zmenší na 100 px, menší zůstane beze změny (nezvětšujeme). Poměr stran se zachová.',
};

// Logo (.sk-logo-img) je vysoké 48 px, šířka auto — 96 px pokryje i retina displeje.
export const LOGO_IMAGE_SPEC: ImageSpec = {
  maxWidth: 96,
  hint: 'Logo se v hlavičce zobrazuje 48 px na výšku. Stačí obrázek do 96 px šířky; větší se zmenší, poměr stran se zachová.',
};
