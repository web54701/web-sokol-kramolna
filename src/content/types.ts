// Datový model obsahu CMS. Objekty žijí v pojmenovaných zónách (např. 'home.cards'),
// pořadí určuje `sort`, `data` je JSON dle typu objektu.

export type Visibility = 'all' | 'desktop' | 'mobile';

export type ContentObject = {
  id: number;
  zone: string;
  type: string;
  sort: number;
  hidden: boolean;
  visibility: Visibility;
  data: Record<string, unknown>;
};

/** Položka výchozího obsahu (seed + fallback) — sort se dopočítá z pořadí v poli. */
export type ContentSeed = {
  zone: string;
  type: string;
  data: Record<string, unknown>;
};

// ---- Datové typy jednotlivých objektů ----

export type LogoData = { img: string; line1: string; line2: string };
export type NavItemData = { label: string; route: string };

export type ContactHoursRow = { days: string; daysShort: string; time: string; weekend: boolean };
export type ContactGlobalData = {
  orgName: string;
  phone: string;
  email: string;
  addressLines: string[];
  hoursTitle: string;
  hours: ContactHoursRow[];
  hoursNote: string;
};

export type FooterLinkData = { label: string; href: string };
export type TextData = { text: string };

export type HeroData = { img: string; imgAlt: string; title: string; subtitle: string };
export type ActionCardData = {
  img: string;
  title: string;
  sub: string;
  cta: string;
  route: string;
  tone: 'green' | 'rust';
};
export type InfoColData = {
  icon: string;
  title: string;
  kind: 'text' | 'contact' | 'hours';
  body: string;
};

export type PageheadData = { title: string; intro: string };
export type ParagraphData = { text: string };
export type ValueCardData = { icon: string; title: string; desc: string };
export type TimelineItemData = { year: string; title: string; desc: string };

export type ActivityMetaData = {
  resvTab: string;
  heroEyebrow: string;
  heroTitle: string;
  heroText: string;
  ctaLabel: string;
  hoursNote: string;
  priceNoteTitle: string;
  priceNote: string;
};
export type StatData = { v: string; k: string };
export type RuleData = { text: string };
export type HoursRowData = { days: string; time: string };
export type PriceRowData = { lbl: string; sub: string; val: string };

export type UiTextData = { key: string; text: string };

export type EmailTemplateData = { key: string; subject: string; body: string };

export type DocSection = { title: string; items: string[] };
export type DocData = { title: string; intro: string; sections: DocSection[]; footer: string };

export type ContactCardData = {
  icon: string;
  label: string;
  /** 'custom' = vlastní text v `big`; jinak se hodnota propisuje z global.contact */
  bigSource: 'custom' | 'phone' | 'email' | 'address';
  big: string;
  note: string;
};
export type MapData = { url: string; title: string };
