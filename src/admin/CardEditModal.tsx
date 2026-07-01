import { useState } from 'react';
import { createPortal } from 'react-dom';
import { MediaPickerModal } from './MediaPickerModal';
import { ImageDims } from './ImageDims';
import { useMediaFileName } from './useMediaFileName';
import { CARD_TONES, ROUTE_OPTIONS } from './schema';
import { Icon } from '../components/Icon';
import { CARD_ICON_SPEC } from '../content/image-specs';
import type { ActionCardData, CardTone } from '../content/types';

const DEFAULT_CARD: ActionCardData = {
  img: '', title: 'Nová karta', sub: 'Popis karty', cta: 'ZOBRAZIT', route: 'home', tone: 'green',
};

type Props = {
  /** Výchozí hodnoty při úpravě; chybí → režim vytvoření. */
  initial?: ActionCardData;
  onSave: (data: ActionCardData) => void;
  onClose: () => void;
};

/**
 * Modál akční karty: obrázek (s doporučeným poměrem), cílová stránka a barva z palety.
 * Texty (nadpis, popis, tlačítko) se upravují inline přímo na kartě.
 */
export function CardEditModal({ initial, onSave, onClose }: Props) {
  const base = initial ?? DEFAULT_CARD;
  const [img, setImg] = useState(base.img);
  const [route, setRoute] = useState(base.route);
  const [tone, setTone] = useState<CardTone>(base.tone);
  const [picking, setPicking] = useState(false);
  const fileName = useMediaFileName(img);

  const save = () => onSave({ ...base, img, route, tone });

  // Portál do <body> — modál unikne stacking contextu karty i děděným CSS selektorům.
  return createPortal(
    <div className="cms-modal-overlay" onClick={onClose}>
      <div className="cms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cms-modal-head">
          <h3>{initial ? 'Upravit akční kartu' : 'Nová akční karta'}</h3>
          <button type="button" className="cms-modal-close" onClick={onClose} aria-label="Zavřít">✕</button>
        </div>
        <div className="cms-modal-body">
          <div className="skp-field cms-field">
            <label>Obrázek (ikona)</label>
            <div className="sk-card-img-row">
              <div className="sk-card-img-preview">
                {img ? <img src={img} alt="" /> : <span className="sk-card-img-empty">bez obrázku</span>}
              </div>
              <button type="button" className="cms-btn-secondary" onClick={() => setPicking(true)}>
                <Icon.pencil size={16} /> Vybrat obrázek
              </button>
            </div>
            <p className="cms-field-help">
              {img
                ? <>Aktuální obrázek: <strong>{fileName ?? '…'}</strong> (<ImageDims src={img} />)</>
                : 'Aktuální obrázek: bez obrázku'}
            </p>
            <p className="cms-field-help">{CARD_ICON_SPEC.hint}</p>
          </div>

          <div className="skp-field cms-field">
            <label htmlFor="sk-card-route">Cílová stránka</label>
            <select id="sk-card-route" className="skp-input cms-select" value={route} onChange={(e) => setRoute(e.target.value)}>
              {ROUTE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="skp-field cms-field">
            <label>Barva karty</label>
            <div className="sk-tone-palette">
              {CARD_TONES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={'sk-tone-swatch' + (tone === t.value ? ' is-active' : '')}
                  style={{ background: t.color }}
                  onClick={() => setTone(t.value as CardTone)}
                  title={t.label}
                  aria-label={t.label}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="cms-modal-foot">
          <button type="button" className="cms-btn-secondary" onClick={onClose}>Zrušit</button>
          <button type="button" className="skp-btn-primary" onClick={save}>Uložit</button>
        </div>
      </div>
      {picking && (
        <MediaPickerModal
          spec={CARD_ICON_SPEC}
          current={img}
          onPick={(url) => { setImg(url); setPicking(false); }}
          onClose={() => setPicking(false)}
        />
      )}
    </div>,
    document.body,
  );
}
