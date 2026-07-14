import type { ComponentProps } from 'react';
import { useZoneAll } from '../../content/hooks';
import { useEdit } from '../../content/edit-context';
import { EditableText } from '../../content/editable';
import type { UiTextData } from '../../content/types';

/**
 * Editační vrstva rezervačního průvodce: komponenta <T/> pro texty z resv.texts,
 * plovoucí navigátor stavů průvodce a náhled návratových stránek z e-mailu.
 * Vše se aktivuje jen v editaci (plátno adminu); na veřejném webu <T/> vykreslí
 * čistý text a navigátor se nerenderuje vůbec.
 */

type TProps = {
  k: string;
  fallback: string;
  as?: ComponentProps<typeof EditableText>['as'];
  className?: string;
};

/** Text průvodce dle klíče v zóně resv.texts — inline editovatelný na plátně. */
export function T({ k, fallback, as = 'span', className }: TProps) {
  const edit = useEdit();
  const all = useZoneAll<UiTextData>('resv.texts');
  const obj = all.find((o) => o.data.key === k);
  // Mimo editaci se skrytý objekt chová jako chybějící (shodně s useZone / funkcí t()).
  const value = (edit.enabled ? obj?.data.text : obj && !obj.hidden ? obj.data.text : undefined) ?? fallback;
  return (
    <EditableText
      as={as}
      multiline
      className={className}
      value={value}
      onSave={(text) =>
        obj
          ? void edit.patchData(obj.id, { key: k, text })
          : void edit.createInZone('resv.texts', 'ui_text', { key: k, text })
      }
    />
  );
}

// ---- Návratové stránky z e-mailu (renderuje je worker; zde jen editační náhled) ----

export type EmailScreenKey =
  | 'email_link_invalid'
  | 'email_confirm_ok'
  | 'email_confirm_already'
  | 'email_confirm_notfound'
  | 'email_cancel_ok'
  | 'email_cancel_notfound';

const EMAIL_SCREENS: { key: EmailScreenKey; label: string; fallback: string }[] = [
  { key: 'email_confirm_ok', label: 'Potvrzení — úspěch', fallback: 'Rezervace byla úspěšně potvrzena. Děkujeme!' },
  { key: 'email_confirm_already', label: 'Potvrzení — již potvrzeno', fallback: 'Rezervace již byla potvrzena dříve. Děkujeme!' },
  { key: 'email_confirm_notfound', label: 'Potvrzení — nenalezena', fallback: 'Rezervace nebyla nalezena nebo již neexistuje.' },
  { key: 'email_cancel_ok', label: 'Zrušení — úspěch', fallback: 'Rezervace byla úspěšně zrušena.' },
  { key: 'email_cancel_notfound', label: 'Zrušení — nenalezena', fallback: 'Rezervace nebyla nalezena nebo již byla zrušena.' },
  { key: 'email_link_invalid', label: 'Neplatný odkaz', fallback: 'Neplatný odkaz.' },
];

/** Náhled stránky, kterou worker vrací po kliknutí na odkaz v e-mailu (layout kopíruje worker.ts html()). */
export function EmailReturnScreen({ screen }: { screen: EmailScreenKey }) {
  const def = EMAIL_SCREENS.find((s) => s.key === screen)!;
  return (
    <div className="sk-ed-email-screen">
      <p><T k={def.key} fallback={def.fallback} /></p>
      <p className="sk-ed-email-screen-note">
        Stránka po kliknutí na odkaz v e-mailu ({def.label.toLowerCase()}). Text se zobrazuje bez formátování.
      </p>
    </div>
  );
}

// ---- Navigátor stavů průvodce ----

type NavigatorProps = {
  step: number;
  setStep: (n: number) => void;
  emailVerification: boolean;
  setEmailVerification: (v: boolean) => void;
  emailSent: boolean;
  setEmailSent: (v: boolean) => void;
  showRules: boolean;
  setShowRules: (v: boolean) => void;
  emailScreen: EmailScreenKey | null;
  setEmailScreen: (k: EmailScreenKey | null) => void;
};

const STEP4_VARIANTS: { label: string; verification: boolean; sent: boolean }[] = [
  { label: 'potvrdit e-mailem', verification: true, sent: true },
  { label: 'potvrzeno automaticky', verification: true, sent: false },
  { label: 'shrnutí odesláno', verification: false, sent: true },
  { label: 'bez e-mailu', verification: false, sent: false },
];

/**
 * Plovoucí panel v editaci: přepíná kroky průvodce (bez odesílání dat), varianty
 * závěrečné obrazovky, provozní řád a návratové stránky z e-mailu.
 */
export function EditStepNavigator(p: NavigatorProps) {
  const goStep = (n: number) => {
    p.setEmailScreen(null);
    p.setShowRules(false);
    p.setStep(n);
  };
  const goStep4 = (verification: boolean, sent: boolean) => {
    p.setEmailScreen(null);
    p.setShowRules(false);
    p.setEmailVerification(verification);
    p.setEmailSent(sent);
    p.setStep(4);
  };
  const inWizard = !p.emailScreen;

  return (
    <div className="sk-ed-resv-nav">
      <div className="sk-ed-resv-nav-row">
        <span className="sk-ed-resv-nav-label">Kroky</span>
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            type="button"
            className={inWizard && !p.showRules && p.step === n ? 'is-active' : ''}
            onClick={() => goStep(n)}
          >{n}. {n === 1 ? 'Termín' : n === 2 ? 'Vaše údaje' : 'Potvrzení'}</button>
        ))}
        <button
          type="button"
          className={inWizard && p.step === 2 && p.showRules ? 'is-active' : ''}
          onClick={() => { p.setEmailScreen(null); p.setStep(2); p.setShowRules(true); }}
        >Provozní řád</button>
        <label className="sk-ed-resv-nav-check" title="Přepíná texty kroků 2 a 3 podle nastavení e-mailového ověřování">
          <input
            type="checkbox"
            checked={p.emailVerification}
            onChange={(e) => p.setEmailVerification(e.target.checked)}
          />
          E-mailové ověřování
        </label>
      </div>
      <div className="sk-ed-resv-nav-row">
        <span className="sk-ed-resv-nav-label">Hotovo</span>
        {STEP4_VARIANTS.map((v) => (
          <button
            key={v.label}
            type="button"
            className={inWizard && p.step === 4 && p.emailVerification === v.verification && p.emailSent === v.sent ? 'is-active' : ''}
            onClick={() => goStep4(v.verification, v.sent)}
          >{v.label}</button>
        ))}
        <select
          className={p.emailScreen ? 'is-active' : ''}
          value={p.emailScreen ?? ''}
          onChange={(e) => p.setEmailScreen((e.target.value || null) as EmailScreenKey | null)}
        >
          <option value="">Stránky z e-mailu…</option>
          {EMAIL_SCREENS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>
      <div className="sk-ed-resv-nav-hint">
        Popisky tlačítek a validační hlášky jsou pevně v kódu — zde se editují jen texty obsahu.
      </div>
    </div>
  );
}
