import { IconByName } from '../components/IconByName';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useZone, useSingleton, visibilityClass } from '../content/hooks';
import { renderInline } from '../content/inline';
import type { PageheadData, TextData, ParagraphData, ValueCardData, TimelineItemData } from '../content/types';
import type { Route } from '../types';

type Props = { onNavigate: (route: Route) => void; isAdmin?: boolean; onAdminActivate?: () => void };

export function OnasPage({ onNavigate, isAdmin, onAdminActivate }: Props) {
  const head = useSingleton<PageheadData>('onas.head');
  const lead = useSingleton<TextData>('onas.lead');
  const paragraphs = useZone<ParagraphData>('onas.body');
  const values = useZone<ValueCardData>('onas.values');
  const timelineHead = useSingleton<TextData>('onas.timeline_head');
  const timeline = useZone<TimelineItemData>('onas.timeline');

  return (
    <div className="sk-page skp-page">
      <Header active="onas" onNavigate={onNavigate} isAdmin={isAdmin} onAdminActivate={onAdminActivate} />

      <div className="sk-pagewrap">
        <div className="sk-pagehead">
          <div className="sk-pagehead-l">
            <h1>{head?.title}</h1>
            <p>{head?.intro}</p>
          </div>
        </div>

        <div className="skp-scroll">
          <p className="skp-onas-lead">
            {lead?.text}
          </p>

          <div className="skp-onas-cols">
            <div className="skp-onas-body">
              {paragraphs.map((p) => (
                <p key={p.id} className={visibilityClass(p.visibility).trim() || undefined}>
                  {renderInline(p.data.text)}
                </p>
              ))}

              <div className="skp-values">
                {values.map((v) => (
                  <div key={v.id} className={'skp-value' + visibilityClass(v.visibility)}>
                    <div className="ic"><IconByName name={v.data.icon} /></div>
                    <div className="t">{v.data.title}</div>
                    <div className="d">{v.data.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <section className="sk-panel">
              <h3>{timelineHead?.text}</h3>
              <div className="skp-timeline">
                {timeline.map((e) => (
                  <div key={e.id} className={'skp-tl-item' + visibilityClass(e.visibility)}>
                    <div className="skp-tl-year">{e.data.year}</div>
                    <div className="skp-tl-body">
                      <div className="t">{e.data.title}</div>
                      <div className="d">{e.data.desc}</div>
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
