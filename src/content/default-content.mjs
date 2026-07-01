// Výchozí obsah webu — JEDINÝ ZDROJ PRAVDY pro D1 seed (scripts/generate-seed.mjs)
// i pro fallback frontendu při nedostupné databázi (ContentProvider).
// Plain JS modul, aby ho uměl načíst Node skript i Vite. Typy viz default-content.d.mts.
//
// Mini-markup v textech: '\n' = zalomení řádku, **text** = tučně.
// '{year}' v patičce = aktuální rok.

export const DEFAULT_CONTENT = [
  // ---- Globální: logo, menu, kontakty, patička ----
  { zone: 'global.logo', type: 'logo', data: { img: '/logo_sokol.png', line1: 'SOKOL', line2: 'KRAMOLNA' } },

  { zone: 'global.nav', type: 'nav_item', data: { label: 'O nás', route: 'onas' } },
  { zone: 'global.nav', type: 'nav_item', data: { label: 'Tenis', route: 'tenis' } },
  { zone: 'global.nav', type: 'nav_item', data: { label: 'Posilovna', route: 'gym' } },
  { zone: 'global.nav', type: 'nav_item', data: { label: 'Kontakt', route: 'kontakt' } },

  {
    zone: 'global.contact', type: 'contact_global', data: {
      orgName: 'T.J. Sokol Kramolna',
      phone: '776 026 304',
      email: 'kramolna@sokol.eu',
      addressLines: ['Kramolna 85', '547 01 Kramolna', 'Královéhradecký kraj'],
      hoursTitle: 'Provozní doba areálu',
      hours: [
        { days: 'Pondělí – Pátek', daysShort: 'Po – Pá', time: '8:00 – 21:00', weekend: false },
        { days: 'Sobota – Neděle', daysShort: 'So – Ne', time: '9:00 – 20:00', weekend: true },
      ],
      hoursNote: 'Posilovna je pro členy s čipem přístupná i mimo přítomnost správce.',
    },
  },

  { zone: 'global.footer', type: 'footer_link', data: { label: 'Ochrana osobních údajů', href: '' } },
  { zone: 'global.footer', type: 'footer_link', data: { label: 'Provozní řád areálu', href: '' } },
  { zone: 'global.footer_meta', type: 'text', data: { text: 'Sokol Kramolna © {year}' } },

  // ---- Homepage ----
  {
    zone: 'home.hero', type: 'hero', data: {
      img: '/hero.webp',
      imgAlt: 'Antukový tenisový kurt',
      title: 'Sokol Kramolna',
      subtitle: 'Sportovní areál v srdci Kramolny.\nTenisový kurt a posilovna pro všechny.',
    },
  },

  { zone: 'home.cards', type: 'action_card', data: { img: '/raketa.webp', title: 'Tenis', sub: 'Rezervace kurtu\na ceník', cta: 'ZOBRAZIT', route: 'tenis', tone: 'green' } },
  { zone: 'home.cards', type: 'action_card', data: { img: '/cinka.webp', title: 'Posilovna', sub: 'Rezervace vstupu\na ceník', cta: 'ZOBRAZIT', route: 'gym', tone: 'rust' } },

  { zone: 'home.info', type: 'info_col', data: { icon: 'pin', title: 'Kde nás najdete', kind: 'address', body: '' } },
  { zone: 'home.info', type: 'info_col', data: { icon: 'phone', title: 'Kontakt', kind: 'contact', body: '' } },
  { zone: 'home.info', type: 'info_col', data: { icon: 'clock', title: 'Provozní doba', kind: 'hours', body: 'Podrobnosti na stránkách aktivit.' } },
  { zone: 'home.info', type: 'info_col', data: { icon: 'shield', title: 'Sokol', kind: 'text', body: 'Jsme součástí tradiční české tělovýchovné organizace.' } },

  // ---- O nás ----
  { zone: 'onas.head', type: 'pagehead', data: { title: 'O nás', intro: 'Tělocvičná jednota Sokol Kramolna — sport a spolkový život v podhůří u Náchoda.' } },
  { zone: 'onas.lead', type: 'text', data: { text: 'Jsme dobrovolný spolek, který v Kramolně nabízí prostor pro sport, setkávání a péči o společný areál — a navazuje na více než stoletou tradici českého Sokola.' } },

  { zone: 'onas.body', type: 'paragraph', data: { text: 'Tělocvičná jednota **Sokol Kramolna** působí v obci pod úpatím Krkonoš, nedaleko Náchoda. Kramolnu dnes tvoří tři části — **Kramolna, Lhotky a Trubějov** — a žije v ní kolem 1 100 obyvatel. První písemná zmínka o vsi pochází z roku 1415.' } },
  { zone: 'onas.body', type: 'paragraph', data: { text: 'Provozujeme **antukový tenisový kurt** a **posilovnu** v budově sokolovny, pořádáme turnaje a společenské akce a staráme se o areál jako o živé místo setkávání. Okolí láká i k pohybu v přírodě — vsí prochází turistické i cyklistické trasy a nedaleko stojí rozhledna Dobrošov.' } },
  { zone: 'onas.body', type: 'paragraph', data: { text: 'Jsme součástí **České obce sokolské**, jedné z nejstarších tělovýchovných organizací v Evropě, a spadáme pod **župu Podkrkonošskou – Jiráskovu**. Hlásíme se k jejím hodnotám: zdravý pohyb, otevřenost všem a péče o obec.' } },

  { zone: 'onas.values', type: 'value_card', data: { icon: 'shield', title: 'Zdravý pohyb', desc: 'Sport přístupný všem věkovým skupinám, od dětí po seniory.' } },
  { zone: 'onas.values', type: 'value_card', data: { icon: 'pin', title: 'Péče o obec', desc: 'Udržujeme areál jako místo setkávání v srdci Kramolny.' } },
  { zone: 'onas.values', type: 'value_card', data: { icon: 'clock', title: 'Tradice i dnešek', desc: 'Hlásíme se k hodnotám Sokola „Tužme se" a otevíráme je dnešní době.' } },

  { zone: 'onas.timeline_head', type: 'text', data: { text: 'Z naší historie' } },
  { zone: 'onas.timeline', type: 'timeline_item', data: { year: '1862', title: 'Vznik Sokola', desc: 'Tělocvičnou jednotu Sokol Pražský zakládají Miroslav Tyrš a Jindřich Fügner. Začíná tradice českého spolkového cvičení.' } },
  { zone: 'onas.timeline', type: 'timeline_item', data: { year: '20. l.', title: 'Sokol v Kramolně', desc: 'V obci se rozvíjí čilý spolkový život a vzniká i místní tělocvičná jednota Sokol Kramolna.' } },
  { zone: 'onas.timeline', type: 'timeline_item', data: { year: '1941', title: 'Zákaz za okupace', desc: 'Činnost Sokola je nacisty zastavena (Akce Sokol). Datum 8. října se dnes připomíná jako Památný den sokolstva.' } },
  { zone: 'onas.timeline', type: 'timeline_item', data: { year: '1990', title: 'Obnova činnosti', desc: 'Po listopadu 1989 se Česká obec sokolská i místní jednoty vracejí k práci a majetku.' } },
  { zone: 'onas.timeline', type: 'timeline_item', data: { year: 'Dnes', title: 'Sport pro obec', desc: 'Provozujeme antukový kurt a posilovnu, pořádáme akce a pečujeme o areál pro občany Kramolny i okolí.' } },

  // ---- Tenis ----
  { zone: 'tenis.head', type: 'pagehead', data: { title: 'Tenis', intro: 'Jeden antukový kurt v klidném prostředí areálu, v provozu od dubna do října. Rezervace online v hodinových blocích — jednoduše, bez registrace.' } },
  {
    zone: 'tenis.meta', type: 'activity_meta', data: {
      resvTab: 'Rezervace kurtu',
      heroEyebrow: 'Antukový kurt · Sokol Kramolna',
      heroTitle: 'Zahrajte si na našem kurtu',
      heroText: 'Udržovaná antuka částečně stíněná vzrostlými lípami — příjemný chládek i v letních vedrech. Jeden kurt na celý areál, rezervace online na pár kliknutí.',
      ctaLabel: 'Rezervovat kurt',
      hoursNote: 'Kurt je v provozu od dubna do října. Mimo sezónu se nehraje.',
      priceNoteTitle: 'Jak zaplatit',
      priceNote: 'Cena je za celý kurt bez ohledu na počet hráčů — ať přijdou dva nebo čtyři, platí se stejně. Zaplatit lze osobně při vrácení klíčů nebo převodem na účet Sokola Kramolna.',
    },
  },
  { zone: 'tenis.stats', type: 'stat', data: { v: '1', k: 'Antukový kurt' } },
  { zone: 'tenis.stats', type: 'stat', data: { v: 'duben–říjen', k: 'Sezóna' } },
  { zone: 'tenis.stats', type: 'stat', data: { v: '100', k: 'Kč / hodina' } },
  { zone: 'tenis.rules', type: 'rule', data: { text: 'Rezervovat lze až 21 dní dopředu — nejzazší lhůtu nehlídáme, klidně i těsně před hrou.' } },
  { zone: 'tenis.rules', type: 'rule', data: { text: 'Hodinové bloky lze spojit do delší hry.' } },
  { zone: 'tenis.rules', type: 'rule', data: { text: 'Storno zdarma kdykoliv.' } },
  { zone: 'tenis.rules', type: 'rule', data: { text: 'Klíče vyzvedněte u p. Mikšíčka (Kramolna 279) nejdříve 15 minut před začátkem; po hře je vraťte na stejné místo a uhraďte pronájem osobně.' } },
  { zone: 'tenis.rules', type: 'rule', data: { text: 'Po hře prosíme o úklid kurtu — lajnovačka, vlečka na antuky a hadice jsou připraveny u kurtu.' } },
  { zone: 'tenis.rules', type: 'rule', data: { text: 'Hraje se za přirozeného denního světla — kurt osvětlení nemá.' } },
  { zone: 'tenis.hours', type: 'hours_row', data: { days: 'Pondělí – Pátek', time: '8:00 – 21:00' } },
  { zone: 'tenis.hours', type: 'hours_row', data: { days: 'Sobota – Neděle', time: '9:00 – 20:00' } },
  { zone: 'tenis.price', type: 'price_row', data: { lbl: 'Nečlenové', sub: 'Hodinový pronájem kurtu', val: '100 Kč' } },
  { zone: 'tenis.price', type: 'price_row', data: { lbl: 'Členové Sokola', sub: 'Měsíční paušál, neomezené hraní', val: '100 Kč / měsíc' } },

  // ---- Posilovna ----
  { zone: 'gym.head', type: 'pagehead', data: { title: 'Posilovna', intro: 'Plně vybavená posilovna v budově sokolovny. Rezervujte si hodinový vstup online — vidíte volnou kapacitu i dopředu.' } },
  {
    zone: 'gym.meta', type: 'activity_meta', data: {
      resvTab: 'Rezervace vstupu',
      heroEyebrow: 'Posilovna · Sokol Kramolna',
      heroTitle: 'Cvičte, kdy se vám to hodí',
      heroText: 'Činky, multifunkční klec, kardio zóna i kladkový stroj na ploše 80 m². Rezervací vstupu máte jistotu místa — kapacita je 15 osob v jednom bloku.',
      ctaLabel: 'Rezervovat vstup',
      hoursNote: 'Rezervovat online lze v provozních hodinách správce (8:00–20:00).',
      priceNoteTitle: 'Dobré vědět',
      priceNote: 'Permanentky a členství vyřídíte u správce nebo online při rezervaci. Úvodní 30minutové seznámení s instruktorem je pro nové návštěvníky zdarma.',
    },
  },
  { zone: 'gym.stats', type: 'stat', data: { v: '80 m²', k: 'Plocha posilovny' } },
  { zone: 'gym.stats', type: 'stat', data: { v: '15', k: 'Míst v bloku' } },
  { zone: 'gym.stats', type: 'stat', data: { v: 'od 100', k: 'Kč / vstup' } },
  { zone: 'gym.rules', type: 'rule', data: { text: 'Vstup se rezervuje v hodinových blocích, kapacita 15 osob.' } },
  { zone: 'gym.rules', type: 'rule', data: { text: 'Členové s čipem mají přístup i mimo přítomnost správce.' } },
  { zone: 'gym.rules', type: 'rule', data: { text: 'První návštěvu doporučujeme s instruktorem — seznámení zdarma.' } },
  { zone: 'gym.rules', type: 'rule', data: { text: 'Storno zdarma nejpozději 24 hodin před začátkem.' } },
  { zone: 'gym.hours', type: 'hours_row', data: { days: 'Pondělí – Pátek', time: '6:00 – 22:00' } },
  { zone: 'gym.hours', type: 'hours_row', data: { days: 'Sobota – Neděle', time: '8:00 – 20:00' } },
  { zone: 'gym.price', type: 'price_row', data: { lbl: 'Jednorázový vstup', sub: 'Hodinový blok', val: '100 Kč' } },
  { zone: 'gym.price', type: 'price_row', data: { lbl: 'Permanentka 10 vstupů', sub: 'Platnost 6 měsíců', val: '800 Kč' } },
  { zone: 'gym.price', type: 'price_row', data: { lbl: 'Měsíční permanentka', sub: 'Neomezený vstup', val: '700 Kč' } },
  { zone: 'gym.price', type: 'price_row', data: { lbl: 'Roční členství', sub: 'Jen členové Sokola', val: '3 900 Kč' } },

  // ---- Kontakt ----
  { zone: 'kontakt.head', type: 'pagehead', data: { title: 'Kontakt', intro: 'Najdete nás v Kramolně u Náchoda. Ozvěte se nám — rádi pomůžeme s rezervací i členstvím.' } },
  { zone: 'kontakt.cards', type: 'contact_card', data: { icon: 'pin', label: 'Adresa', bigSource: 'address', big: '', note: '' } },
  { zone: 'kontakt.cards', type: 'contact_card', data: { icon: 'phone', label: 'Telefon', bigSource: 'phone', big: '', note: 'Správce areálu — nejlépe v provozních hodinách.' } },
  { zone: 'kontakt.cards', type: 'contact_card', data: { icon: 'email', label: 'E-mail', bigSource: 'email', big: '', note: 'Spadáme pod Sokolskou župu Podkrkonošskou – Jiráskovu.' } },
  { zone: 'kontakt.map', type: 'map', data: { url: 'https://mapy.com/s/hevufegega', title: 'Mapa — Sokol Kramolna' } },

  // ---- E-mailové šablony (placeholdery {name}, {activity}, {date}, {hours}, {price}, {payment}, {confirmUrl}, {cancelUrl}) ----
  {
    zone: 'email.templates', type: 'email_template', data: {
      key: 'confirmation',
      subject: 'Potvrzení rezervace – TJ Sokol Kramolna',
      body: 'Dobrý den, {name},\n\nVaše rezervace byla přijata. Níže najdete shrnutí a odkazy pro potvrzení nebo zrušení.\n\nAktivita: {activity}\nDatum:    {date}\nHodiny:   {hours}\nCena:     {price} Kč\nPlatba:   {payment}\n\n─────────────────────────────────────────\nPOTVRDIT REZERVACI:\n{confirmUrl}\n\nZRUŠIT REZERVACI:\n{cancelUrl}\n─────────────────────────────────────────\n\nS pozdravem,\nTJ Sokol Kramolna',
    },
  },
  {
    zone: 'email.templates', type: 'email_template', data: {
      key: 'confirmed',
      subject: 'Rezervace potvrzena – TJ Sokol Kramolna',
      body: 'Dobrý den, {name},\n\nVaše rezervace byla potvrzena. Níže najdete souhrn.\n\nAktivita: {activity}\nDatum:    {date}\nHodiny:   {hours}\nCena:     {price} Kč\nPlatba:   {payment}\n\n─────────────────────────────────────────\nZRUŠIT REZERVACI:\n{cancelUrl}\n─────────────────────────────────────────\n\nS pozdravem,\nTJ Sokol Kramolna',
    },
  },

  // ---- Provozní řád (modál při rezervaci) ----
  {
    zone: 'legal.rad', type: 'doc', data: {
      title: 'Provozní řád tenisového kurtu',
      intro: 'Vítejte na našem kurtu! Abychom udrželi antuku v perfektním stavu pro vás i pro ty, co přijdou po vás, dodržujte prosím tato základní pravidla:',
      sections: [
        {
          title: '1. Klíče a bezpečnost',
          items: [
            '**Vstup a odchod:** Klíče od kurtu si vyzvedávejte a vracejte podle domluvených pravidel.',
            '**Zamykání:** Poslední hráč dne (nebo pokud po vás nikdo nenastupuje) je povinen kurt i zázemí vždy uzamknout.',
            '**Skládek:** Klíč od kurtu pasuje také do skládku s vybavením. Najdete v něm lajnovačku, vápno, košťata a síť. Po použití nářadí vše ukliďte zpět a skládek zamkněte.',
          ],
        },
        {
          title: '2. Údržba kurtu a lajnování',
          items: [
            '**Kropení:** Pokud je kurt suchý nebo práší, před hrou ho důkladně pokropte. Antuka se tím chrání před poničením.',
            '**Srovnání povrchu:** Případné díry po skluzu ihned zarovnejte (zašlápněte) ještě během hry.',
            '**Lajnování:** Kurt nemá pevné lajny. Před hrou (nebo podle potřeby) si kurt nalajnujte vápnem pomocí lajnovačky ze skládku.',
            '**Úklid po hře:** Každý hráč je povinen po skončení hry kurt stáhnout síťovanou metlou (od krajů ke středu), aby byl připravený pro další hráče.',
          ],
        },
        {
          title: '3. Obecné zásady',
          items: [
            'Na kurt je povolen vstup pouze v tenisové obuvi určené na antuku (hladký vzorek, ne hrubá podrážka/traktory).',
            'Chovejte se k vybavení ohleduplně a udržujte na kurtu i v jeho okolí pořádek.',
          ],
        },
      ],
      footer: 'Díky, že pomáháte udržovat kurt v super stavu! Hře zdar!',
    },
  },

  // ---- Texty rezervačního průvodce (klíčované; klíče neměnit) ----
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'cal_tip', text: 'Klikněte na volné hodiny. Sousední hodiny můžete **spojit do delšího bloku**.' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'sum_empty', text: 'Zatím nemáte vybraný termín.\nKlikněte na volné hodiny v kalendáři.' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'step2_lead_verify', text: 'Na e-mail vám pošleme potvrzovací odkaz a detaily rezervace.' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'step2_lead_noverify', text: 'Na e-mail vám pošleme shrnutí rezervace.' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'note_placeholder_tenis', text: 'Např. půjčení vybavení, počet hráčů…' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'note_placeholder_gym', text: 'Např. první návštěva, potřebuji instruktora…' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'payment_hotove_title', text: 'Osobně' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'payment_hotove_desc', text: 'Při vrácení klíčů u správce' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'payment_prevod_title', text: 'Převodem' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'payment_prevod_desc', text: 'Na účet Sokola Kramolna' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'payment_full_hotove', text: 'Osobně při vrácení klíčů' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'payment_full_prevod', text: 'Převodem na účet Sokola' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'rules_notice', text: 'Vstupem na kurt souhlasíte s' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'rules_notice_link', text: 'provozním řádem' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'review_cancel_verify', text: 'Rezervaci lze kdykoliv zdarma zrušit kliknutím na odkaz v potvrzovacím e-mailu.' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'review_cancel_noverify', text: 'Rezervaci lze zrušit kontaktováním správce.' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'success_lead_confirm', text: 'Termín je předběžně zarezervován. Aby byla rezervace platná, je nutné ji potvrdit kliknutím na odkaz v e-mailu.' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'success_lead_done', text: 'Rezervace je platná a termín je zarezervován.' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'success_title_confirm', text: 'Zkontrolujte e-mail a potvrďte rezervaci' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'success_note_confirm', text: 'Odkaz k potvrzení jsme odeslali na výše uvedenou adresu. Rezervaci lze stejným odkazem kdykoliv zdarma zrušit.' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'success_title_auto', text: 'Rezervace je potvrzena automaticky' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'success_note_auto', text: 'E-mail s odkazem se nepodařilo odeslat, proto jsme rezervaci potvrdili automaticky. Kontaktujte nás, pokud chcete rezervaci zrušit.' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'success_title_sent', text: 'Potvrzení bylo odesláno na e-mail' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'success_note_sent', text: 'Shrnutí rezervace jsme odeslali na výše uvedenou adresu. Chcete-li rezervaci zrušit, kontaktujte správce.' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'success_title_plain', text: 'Rezervace je potvrzena' } },
  { zone: 'resv.texts', type: 'ui_text', data: { key: 'success_note_plain', text: 'Chcete-li rezervaci zrušit, kontaktujte správce.' } },
];
