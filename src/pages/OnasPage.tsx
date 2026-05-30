import { Icon } from '../components/Icon';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import type { Route } from '../types';

type Props = { onNavigate: (route: Route) => void };

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

export function OnasPage({ onNavigate }: Props) {
  return (
    <div className="sk-page skp-page">
      <Header active="O nás" onNavigate={onNavigate} />

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

      <Footer />
    </div>
  );
}
