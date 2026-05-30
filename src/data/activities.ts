export type ActivityMode = 'tenis' | 'gym';

type Stat = { v: string; k: string };
type Hours = [string, string];
type PriceRow = { lbl: string; sub: string; val: string };

export type ActivityConfig = {
  nav: string;
  title: string;
  intro: string;
  resvTab: string;
  heroEyebrow: string;
  heroTitle: string;
  heroText: string;
  stats: Stat[];
  ctaLabel: string;
  rules: string[];
  hours: Hours[];
  hoursNote: string;
  price: {
    rows: PriceRow[];
    noteTitle: string;
    note: string;
  };
};

export const ACT: Record<ActivityMode, ActivityConfig> = {
  tenis: {
    nav: 'Tenis',
    title: 'Tenis',
    intro: 'Jeden antukový kurt v klidném prostředí areálu. Rezervace online v hodinových blocích — jednoduše, bez registrace.',
    resvTab: 'Rezervace kurtu',
    heroEyebrow: 'Antukový kurt · Sokol Kramolna',
    heroTitle: 'Zahrajte si na našem kurtu',
    heroText: 'Udržovaná antuka, osvětlení pro hru do večera a online rezervace na pár kliknutí. K dispozici je jeden kurt — proto doporučujeme rezervovat předem.',
    stats: [
      { v: '1', k: 'Antukový kurt' },
      { v: '8–21', k: 'Otevřeno denně' },
      { v: 'od 160', k: 'Kč / hodina' },
    ],
    ctaLabel: 'Rezervovat kurt',
    rules: [
      'Rezervovat lze nejdříve 21 dní a nejpozději 1 hodinu předem.',
      'Hodinové bloky lze spojit do delší hry.',
      'Storno zdarma nejpozději 24 hodin před začátkem.',
      'Při dešti správce kurt uzavře a rezervaci bezplatně zruší.',
    ],
    hours: [
      ['Pondělí – Pátek', '8:00 – 21:00'],
      ['Sobota – Neděle', '9:00 – 20:00'],
    ],
    hoursNote: 'V hlavní sezóně (květen–září). Mimo sezónu dle dohody se správcem.',
    price: {
      rows: [
        { lbl: 'Mimo špičku', sub: 'Po–Pá 8:00–16:00', val: '160 Kč' },
        { lbl: 'Špička', sub: 'Po–Pá 16:00–21:00', val: '220 Kč' },
        { lbl: 'Víkend a svátky', sub: 'So–Ne celý den', val: '220 Kč' },
      ],
      noteTitle: 'Co je v ceně',
      note: 'Cena je za hodinu hry na celém kurtu, bez ohledu na počet hráčů. Síť a značení jsou připravené. Členové Sokola Kramolna mají 20 % slevu po přihlášení.',
    },
  },
  gym: {
    nav: 'Posilovna',
    title: 'Posilovna',
    intro: 'Plně vybavená posilovna v budově sokolovny. Rezervujte si hodinový vstup online — vidíte volnou kapacitu i dopředu.',
    resvTab: 'Rezervace vstupu',
    heroEyebrow: 'Posilovna · Sokol Kramolna',
    heroTitle: 'Cvičte, kdy se vám to hodí',
    heroText: 'Činky, multifunkční klec, kardio zóna i kladkový stroj na ploše 80 m². Rezervací vstupu máte jistotu místa — kapacita je 15 osob v jednom bloku.',
    stats: [
      { v: '80 m²', k: 'Plocha posilovny' },
      { v: '15', k: 'Míst v bloku' },
      { v: 'od 100', k: 'Kč / vstup' },
    ],
    ctaLabel: 'Rezervovat vstup',
    rules: [
      'Vstup se rezervuje v hodinových blocích, kapacita 15 osob.',
      'Členové s čipem mají přístup i mimo přítomnost správce.',
      'První návštěvu doporučujeme s instruktorem — seznámení zdarma.',
      'Storno zdarma nejpozději 24 hodin před začátkem.',
    ],
    hours: [
      ['Pondělí – Pátek', '6:00 – 22:00'],
      ['Sobota – Neděle', '8:00 – 20:00'],
    ],
    hoursNote: 'Rezervovat online lze v provozních hodinách správce (8:00–20:00).',
    price: {
      rows: [
        { lbl: 'Jednorázový vstup', sub: 'Hodinový blok', val: '100 Kč' },
        { lbl: 'Permanentka 10 vstupů', sub: 'Platnost 6 měsíců', val: '800 Kč' },
        { lbl: 'Měsíční permanentka', sub: 'Neomezený vstup', val: '700 Kč' },
        { lbl: 'Roční členství', sub: 'Jen členové Sokola', val: '3 900 Kč' },
      ],
      noteTitle: 'Dobré vědět',
      note: 'Permanentky a členství vyřídíte u správce nebo online při rezervaci. Úvodní 30minutové seznámení s instruktorem je pro nové návštěvníky zdarma.',
    },
  },
};
