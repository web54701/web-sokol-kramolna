import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useZoneAll, useSingletonObject, visibilityClass } from '../content/hooks';
import { useEdit } from '../content/edit-context';
import { EditableText, EditableIcon, RowActions, AddRowSlot } from '../content/editable';
import type { PageheadData, TextData, ParagraphData, ValueCardData, TimelineItemData } from '../content/types';
import type { Route } from '../types';

type Props = { onNavigate: (route: Route) => void; isAdmin?: boolean; onAdminActivate?: () => void };

export function OnasPage({ onNavigate, isAdmin, onAdminActivate }: Props) {
  const edit = useEdit();
  const head = useSingletonObject<PageheadData>('onas.head');
  const lead = useSingletonObject<TextData>('onas.lead');
  const allParagraphs = useZoneAll<ParagraphData>('onas.body');
  const allValues = useZoneAll<ValueCardData>('onas.values');
  const timelineHead = useSingletonObject<TextData>('onas.timeline_head');
  const allTimeline = useZoneAll<TimelineItemData>('onas.timeline');

  const paragraphs = edit.enabled ? allParagraphs : allParagraphs.filter((p) => !p.hidden);
  const values = edit.enabled ? allValues : allValues.filter((v) => !v.hidden);
  const timeline = edit.enabled ? allTimeline : allTimeline.filter((t) => !t.hidden);

  const saveHead = (patch: Partial<PageheadData>) => {
    if (head) void edit.patchData(head.id, { ...head.data, ...patch });
  };
  const saveLead = (text: string) => { if (lead) void edit.patchData(lead.id, { text }); };
  const saveTimelineHead = (text: string) => { if (timelineHead) void edit.patchData(timelineHead.id, { text }); };

  return (
    <div className="sk-page skp-page">
      <Header active="onas" onNavigate={onNavigate} isAdmin={isAdmin} onAdminActivate={onAdminActivate} />

      <div className="sk-pagewrap">
        <div className="sk-pagehead">
          <div className="sk-pagehead-l">
            <EditableText as="h1" value={head?.data.title ?? ''} onSave={(t) => saveHead({ title: t })} />
            <EditableText as="p" multiline value={head?.data.intro ?? ''} onSave={(t) => saveHead({ intro: t })} />
          </div>
        </div>

        <div className="skp-scroll">
          <EditableText as="p" className="skp-onas-lead" multiline value={lead?.data.text ?? ''} onSave={saveLead} />

          <div className="skp-onas-cols">
            <div className="skp-onas-body">
              {paragraphs.map((p) => (
                <div key={p.id} className={'sk-ed-row' + visibilityClass(p.visibility) + (p.hidden ? ' sk-ed-hidden' : '')}>
                  <EditableText as="p" multiline value={p.data.text} onSave={(t) => void edit.patchData(p.id, { text: t })} />
                  <RowActions
                    hidden={p.hidden}
                    onToggleHidden={() => void edit.setHidden(p.id, !p.hidden)}
                    onDelete={() => { if (window.confirm('Opravdu smazat odstavec?')) void edit.remove(p.id); }}
                  />
                </div>
              ))}
              <AddRowSlot
                label="Přidat odstavec"
                onClick={() => void edit.createInZone('onas.body', 'paragraph', { text: 'Nový odstavec' })}
              />

              <div className="skp-values">
                {values.map((v) => (
                  <div key={v.id} className={'skp-value sk-ed-row' + visibilityClass(v.visibility) + (v.hidden ? ' sk-ed-hidden' : '')}>
                    <div className="ic">
                      <EditableIcon name={v.data.icon} onPick={(n) => void edit.patchData(v.id, { ...v.data, icon: n })} />
                    </div>
                    <EditableText as="div" className="t" value={v.data.title} onSave={(t) => void edit.patchData(v.id, { ...v.data, title: t })} />
                    <EditableText as="div" className="d" multiline value={v.data.desc} onSave={(t) => void edit.patchData(v.id, { ...v.data, desc: t })} />
                    <RowActions
                      hidden={v.hidden}
                      onToggleHidden={() => void edit.setHidden(v.id, !v.hidden)}
                      onDelete={() => { if (window.confirm('Opravdu smazat hodnotu?')) void edit.remove(v.id); }}
                    />
                  </div>
                ))}
              </div>
              <AddRowSlot
                label="Přidat hodnotu"
                onClick={() => void edit.createInZone('onas.values', 'value_card', { icon: 'shield', title: 'Nová hodnota', desc: '' })}
              />
            </div>

            <section className="sk-panel">
              <EditableText as="h3" value={timelineHead?.data.text ?? ''} onSave={saveTimelineHead} />
              <div className="skp-timeline">
                {timeline.map((e) => (
                  <div key={e.id} className={'skp-tl-item sk-ed-row' + visibilityClass(e.visibility) + (e.hidden ? ' sk-ed-hidden' : '')}>
                    <EditableText as="div" className="skp-tl-year" value={e.data.year} onSave={(t) => void edit.patchData(e.id, { ...e.data, year: t })} />
                    <div className="skp-tl-body">
                      <EditableText as="div" className="t" value={e.data.title} onSave={(t) => void edit.patchData(e.id, { ...e.data, title: t })} />
                      <EditableText as="div" className="d" multiline value={e.data.desc} onSave={(t) => void edit.patchData(e.id, { ...e.data, desc: t })} />
                    </div>
                    <RowActions
                      hidden={e.hidden}
                      onToggleHidden={() => void edit.setHidden(e.id, !e.hidden)}
                      onDelete={() => { if (window.confirm('Opravdu smazat událost historie?')) void edit.remove(e.id); }}
                    />
                  </div>
                ))}
              </div>
              <AddRowSlot
                label="Přidat událost"
                onClick={() => void edit.createInZone('onas.timeline', 'timeline_item', { year: '', title: 'Nová událost', desc: '' })}
              />
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
