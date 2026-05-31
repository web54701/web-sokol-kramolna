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
    intro: 'Jeden antukový kurt v klidném prostředí areálu, v provozu od dubna do října. Rezervace online v hodinových blocích — jednoduše, bez registrace.',
    resvTab: 'Rezervace kurtu',
    heroEyebrow: 'Antukový kurt · Sokol Kramolna',
    heroTitle: 'Zahrajte si na našem kurtu',
    heroText: 'Udržovaná antuka částečně stíněná vzrostlými lípami — příjemný chládek i v letních vedrech. Jeden kurt na celý areál, rezervace online na pár kliknutí.',
    stats: [
      { v: '1', k: 'Antukový kurt' },
      { v: 'duben–říjen', k: 'Sezóna' },
      { v: '100', k: 'Kč / hodina' },
    ],
    ctaLabel: 'Rezervovat kurt',
    rules: [
      'Rezervovat lze až 21 dní dopředu — nejzazší lhůtu nehlídáme, klidně i těsně před hrou.',
      'Hodinové bloky lze spojit do delší hry.',
      'Storno zdarma kdykoliv.',
      'Klíče vyzvedněte u p. Mikšíčka (Kramolna 279) nejdříve 15 minut před začátkem; po hře je vraťte na stejné místo a uhraďte pronájem osobně.',
      'Po hře prosíme o úklid kurtu — lajnovačka, vlečka na antuky a hadice jsou připraveny u kurtu.',
      'Hraje se za přirozeného denního světla — kurt osvětlení nemá.',
    ],
    hours: [
      ['Pondělí – Pátek', '8:00 – 21:00'],
      ['Sobota – Neděle', '9:00 – 20:00'],
    ],
    hoursNote: 'Kurt je v provozu od dubna do října. Mimo sezónu se nehraje.',
    price: {
      rows: [
        { lbl: 'Nečlenové', sub: 'Hodinový pronájem kurtu', val: '100 Kč' },
        { lbl: 'Členové Sokola', sub: 'Měsíční paušál, neomezené hraní', val: '100 Kč / měsíc' },
      ],
      noteTitle: 'Jak zaplatit',
      note: 'Cena je za celý kurt bez ohledu na počet hráčů — ať přijdou dva nebo čtyři, platí se stejně. Zaplatit lze osobně při vrácení klíčů nebo převodem na účet Sokola Kramolna.',
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
