// Registr typů objektů a struktury sekcí CMS.
// Řídí generické formuláře (ObjectForm) i seznamy zón (ZoneList).

export type FieldWidget =
  | 'text'
  | 'multiline'   // textarea; podporuje mini-markup (\n, **tučně**)
  | 'select'
  | 'icon'        // výběr ikony z registru Icon
  | 'image'       // cesta k obrázku; v další fázi výběr z knihovny médií
  | 'lines'       // pole řádků (string[]) jako textarea
  | 'contact_hours'; // řádky provozní doby globálních kontaktů

export type FieldDef = {
  key: string;
  label: string;
  widget: FieldWidget;
  options?: { value: string; label: string }[];
  help?: string;
};

export type TypeDef = {
  label: string;          // název typu pro UI ("Akční karta")
  fields: FieldDef[];
  empty: Record<string, unknown>;  // výchozí data nového objektu
};

export const ICON_OPTIONS = ['pin', 'phone', 'clock', 'shield', 'email', 'cal', 'racket', 'dumbbell'];

const ROUTE_OPTIONS = [
  { value: 'home', label: 'Domů' },
  { value: 'onas', label: 'O nás' },
  { value: 'tenis', label: 'Tenis' },
  { value: 'gym', label: 'Posilovna' },
  { value: 'kontakt', label: 'Kontakt' },
];

const MARKUP_HELP = 'Nový řádek = zalomení, **text** = tučně.';

export const TYPES: Record<string, TypeDef> = {
  logo: {
    label: 'Logo a název',
    fields: [
      { key: 'img', label: 'Obrázek loga', widget: 'image' },
      { key: 'line1', label: 'Název — 1. řádek', widget: 'text' },
      { key: 'line2', label: 'Název — 2. řádek', widget: 'text' },
    ],
    empty: { img: '', line1: '', line2: '' },
  },
  nav_item: {
    label: 'Položka menu',
    fields: [
      { key: 'label', label: 'Text', widget: 'text' },
      { key: 'route', label: 'Stránka', widget: 'select', options: ROUTE_OPTIONS },
    ],
    empty: { label: '', route: 'home' },
  },
  contact_global: {
    label: 'Globální kontaktní údaje',
    fields: [
      { key: 'orgName', label: 'Název organizace', widget: 'text' },
      { key: 'phone', label: 'Telefon', widget: 'text' },
      { key: 'email', label: 'E-mail', widget: 'text' },
      { key: 'addressLines', label: 'Adresa (řádky)', widget: 'lines' },
      { key: 'hoursTitle', label: 'Nadpis provozní doby', widget: 'text' },
      { key: 'hours', label: 'Provozní doba', widget: 'contact_hours' },
      { key: 'hoursNote', label: 'Poznámka k provozní době', widget: 'multiline' },
    ],
    empty: {
      orgName: '', phone: '', email: '', addressLines: [],
      hoursTitle: '', hours: [], hoursNote: '',
    },
  },
  footer_link: {
    label: 'Odkaz v patičce',
    fields: [
      { key: 'label', label: 'Text', widget: 'text' },
      { key: 'href', label: 'Odkaz (URL)', widget: 'text', help: 'Zatím může zůstat prázdné.' },
    ],
    empty: { label: '', href: '' },
  },
  text: {
    label: 'Text',
    fields: [{ key: 'text', label: 'Text', widget: 'multiline', help: MARKUP_HELP }],
    empty: { text: '' },
  },
  hero: {
    label: 'Hero sekce',
    fields: [
      { key: 'img', label: 'Obrázek', widget: 'image' },
      { key: 'imgAlt', label: 'Popis obrázku (alt)', widget: 'text' },
      { key: 'title', label: 'Nadpis', widget: 'text' },
      { key: 'subtitle', label: 'Podtitulek', widget: 'multiline', help: MARKUP_HELP },
    ],
    empty: { img: '', imgAlt: '', title: '', subtitle: '' },
  },
  action_card: {
    label: 'Akční karta',
    fields: [
      { key: 'img', label: 'Obrázek', widget: 'image' },
      { key: 'title', label: 'Nadpis', widget: 'text' },
      { key: 'sub', label: 'Popis', widget: 'multiline', help: MARKUP_HELP },
      { key: 'cta', label: 'Text tlačítka', widget: 'text' },
      { key: 'route', label: 'Cílová stránka', widget: 'select', options: ROUTE_OPTIONS },
      {
        key: 'tone', label: 'Barva', widget: 'select',
        options: [{ value: 'green', label: 'Zelená' }, { value: 'rust', label: 'Cihlová' }],
      },
    ],
    empty: { img: '', title: '', sub: '', cta: 'ZOBRAZIT', route: 'home', tone: 'green' },
  },
  info_col: {
    label: 'Info sloupec',
    fields: [
      { key: 'icon', label: 'Ikona', widget: 'icon' },
      { key: 'title', label: 'Nadpis', widget: 'text' },
      {
        key: 'kind', label: 'Obsah', widget: 'select',
        options: [
          { value: 'text', label: 'Vlastní text' },
          { value: 'contact', label: 'Telefon + e-mail (z globálních kontaktů)' },
          { value: 'hours', label: 'Provozní doba (z globálních kontaktů)' },
        ],
      },
      { key: 'body', label: 'Text', widget: 'multiline', help: `${MARKUP_HELP} U provozní doby slouží jako poznámka pod tabulkou.` },
    ],
    empty: { icon: 'pin', title: '', kind: 'text', body: '' },
  },
  pagehead: {
    label: 'Úvod stránky',
    fields: [
      { key: 'title', label: 'Nadpis (H1)', widget: 'text' },
      { key: 'intro', label: 'Úvodní text', widget: 'multiline' },
    ],
    empty: { title: '', intro: '' },
  },
  paragraph: {
    label: 'Odstavec',
    fields: [{ key: 'text', label: 'Text', widget: 'multiline', help: MARKUP_HELP }],
    empty: { text: '' },
  },
  value_card: {
    label: 'Karta hodnoty',
    fields: [
      { key: 'icon', label: 'Ikona', widget: 'icon' },
      { key: 'title', label: 'Titulek', widget: 'text' },
      { key: 'desc', label: 'Popis', widget: 'multiline' },
    ],
    empty: { icon: 'shield', title: '', desc: '' },
  },
  timeline_item: {
    label: 'Položka historie',
    fields: [
      { key: 'year', label: 'Rok / období', widget: 'text' },
      { key: 'title', label: 'Titulek', widget: 'text' },
      { key: 'desc', label: 'Popis', widget: 'multiline' },
    ],
    empty: { year: '', title: '', desc: '' },
  },
  activity_meta: {
    label: 'Texty aktivity',
    fields: [
      { key: 'heroEyebrow', label: 'Drobný titulek (eyebrow)', widget: 'text' },
      { key: 'heroTitle', label: 'Hlavní nadpis', widget: 'text' },
      { key: 'heroText', label: 'Hlavní text', widget: 'multiline' },
      { key: 'ctaLabel', label: 'Text rezervačního tlačítka', widget: 'text' },
      { key: 'resvTab', label: 'Název záložky rezervace', widget: 'text' },
      { key: 'hoursNote', label: 'Poznámka k otevírací době', widget: 'multiline' },
      { key: 'priceNoteTitle', label: 'Nadpis poznámky u ceníku', widget: 'text' },
      { key: 'priceNote', label: 'Poznámka u ceníku', widget: 'multiline' },
    ],
    empty: {
      resvTab: 'Rezervace', heroEyebrow: '', heroTitle: '', heroText: '',
      ctaLabel: '', hoursNote: '', priceNoteTitle: '', priceNote: '',
    },
  },
  stat: {
    label: 'Statistika',
    fields: [
      { key: 'v', label: 'Hodnota', widget: 'text' },
      { key: 'k', label: 'Popisek', widget: 'text' },
    ],
    empty: { v: '', k: '' },
  },
  rule: {
    label: 'Pravidlo',
    fields: [{ key: 'text', label: 'Text pravidla', widget: 'multiline' }],
    empty: { text: '' },
  },
  hours_row: {
    label: 'Řádek otevírací doby',
    fields: [
      { key: 'days', label: 'Dny', widget: 'text' },
      { key: 'time', label: 'Čas', widget: 'text' },
    ],
    empty: { days: '', time: '' },
  },
  price_row: {
    label: 'Řádek ceníku',
    fields: [
      { key: 'lbl', label: 'Položka', widget: 'text' },
      { key: 'sub', label: 'Podtitulek', widget: 'text' },
      { key: 'val', label: 'Cena', widget: 'text' },
    ],
    empty: { lbl: '', sub: '', val: '' },
  },
  contact_card: {
    label: 'Kontaktní karta',
    fields: [
      { key: 'icon', label: 'Ikona', widget: 'icon' },
      { key: 'label', label: 'Popisek', widget: 'text' },
      {
        key: 'bigSource', label: 'Hlavní údaj', widget: 'select',
        options: [
          { value: 'custom', label: 'Vlastní text' },
          { value: 'phone', label: 'Telefon (z globálních kontaktů)' },
          { value: 'email', label: 'E-mail (z globálních kontaktů)' },
          { value: 'address', label: 'Adresa (z globálních kontaktů)' },
        ],
      },
      { key: 'big', label: 'Vlastní hlavní text', widget: 'text', help: 'Použije se jen při volbě „Vlastní text".' },
      { key: 'note', label: 'Poznámka', widget: 'multiline' },
    ],
    empty: { icon: 'pin', label: '', bigSource: 'custom', big: '', note: '' },
  },
  map: {
    label: 'Mapa',
    fields: [
      { key: 'url', label: 'URL mapy (iframe)', widget: 'text' },
      { key: 'title', label: 'Popis mapy', widget: 'text' },
    ],
    empty: { url: '', title: '' },
  },
};

export type ZoneDef = {
  zone: string;
  title: string;
  type: string;          // klíč do TYPES
  repeatable: boolean;   // false = singleton (jen editace), true = seznam s přidáváním
};

export type SectionDef = {
  title: string;
  zones: ZoneDef[];
};

/** Klíč odpovídá sectionKey() z AdminLayout. */
export const SECTIONS: Record<string, SectionDef> = {
  'page:home': {
    title: 'Domů',
    zones: [
      { zone: 'home.hero', title: 'Hero', type: 'hero', repeatable: false },
      { zone: 'home.cards', title: 'Akční karty', type: 'action_card', repeatable: true },
      { zone: 'home.info', title: 'Info pás', type: 'info_col', repeatable: true },
    ],
  },
  'page:onas': {
    title: 'O nás',
    zones: [
      { zone: 'onas.head', title: 'Úvod stránky', type: 'pagehead', repeatable: false },
      { zone: 'onas.lead', title: 'Hlavní odstavec (lead)', type: 'text', repeatable: false },
      { zone: 'onas.body', title: 'Odstavce textu', type: 'paragraph', repeatable: true },
      { zone: 'onas.values', title: 'Hodnoty', type: 'value_card', repeatable: true },
      { zone: 'onas.timeline_head', title: 'Nadpis historie', type: 'text', repeatable: false },
      { zone: 'onas.timeline', title: 'Historie (timeline)', type: 'timeline_item', repeatable: true },
    ],
  },
  'page:tenis': {
    title: 'Tenis',
    zones: [
      { zone: 'tenis.head', title: 'Úvod stránky', type: 'pagehead', repeatable: false },
      { zone: 'tenis.meta', title: 'Texty stránky', type: 'activity_meta', repeatable: false },
      { zone: 'tenis.stats', title: 'Statistiky', type: 'stat', repeatable: true },
      { zone: 'tenis.rules', title: 'Pravidla rezervace', type: 'rule', repeatable: true },
      { zone: 'tenis.hours', title: 'Otevírací doba', type: 'hours_row', repeatable: true },
      { zone: 'tenis.price', title: 'Ceník', type: 'price_row', repeatable: true },
    ],
  },
  'page:gym': {
    title: 'Posilovna',
    zones: [
      { zone: 'gym.head', title: 'Úvod stránky', type: 'pagehead', repeatable: false },
      { zone: 'gym.meta', title: 'Texty stránky', type: 'activity_meta', repeatable: false },
      { zone: 'gym.stats', title: 'Statistiky', type: 'stat', repeatable: true },
      { zone: 'gym.rules', title: 'Pravidla rezervace', type: 'rule', repeatable: true },
      { zone: 'gym.hours', title: 'Otevírací doba', type: 'hours_row', repeatable: true },
      { zone: 'gym.price', title: 'Ceník', type: 'price_row', repeatable: true },
    ],
  },
  'page:kontakt': {
    title: 'Kontakt',
    zones: [
      { zone: 'kontakt.head', title: 'Úvod stránky', type: 'pagehead', repeatable: false },
      { zone: 'kontakt.cards', title: 'Kontaktní karty', type: 'contact_card', repeatable: true },
      { zone: 'kontakt.map', title: 'Mapa', type: 'map', repeatable: false },
    ],
  },
  'global:identity': {
    title: 'Logo a menu',
    zones: [
      { zone: 'global.logo', title: 'Logo a název webu', type: 'logo', repeatable: false },
      { zone: 'global.nav', title: 'Položky menu', type: 'nav_item', repeatable: true },
    ],
  },
  'global:contact': {
    title: 'Kontaktní údaje',
    zones: [
      { zone: 'global.contact', title: 'Globální kontaktní údaje', type: 'contact_global', repeatable: false },
    ],
  },
  'global:footer': {
    title: 'Patička',
    zones: [
      { zone: 'global.footer_meta', title: 'Copyright', type: 'text', repeatable: false },
      { zone: 'global.footer', title: 'Odkazy', type: 'footer_link', repeatable: true },
    ],
  },
};

const PREVIEW_KEYS = ['title', 'label', 'heroTitle', 'lbl', 'text', 'orgName', 'days', 'v', 'year'];

/** Krátký náhled objektu do seznamu — preferovaná klíčová pole, jinak první textové. */
export function previewText(type: string, data: Record<string, unknown>): string {
  for (const key of PREVIEW_KEYS) {
    const v = data[key];
    if (typeof v === 'string' && v.trim()) return v.split('\n')[0];
  }
  const def = TYPES[type];
  if (!def) return '';
  for (const f of def.fields) {
    if (f.widget === 'text' || f.widget === 'multiline') {
      const v = data[f.key];
      if (typeof v === 'string' && v.trim()) return v.split('\n')[0];
    }
  }
  return '';
}
