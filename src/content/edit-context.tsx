import { createContext, useContext } from 'react';

/**
 * Editační vrstva WYSIWYG CMS. Ve výchozím stavu vypnutá (`enabled: false`),
 * takže Editable* komponenty na veřejném webu vykreslí čistý obsah bez režie.
 * Zapíná ji jen <EditorProvider> v admin plátně (LiveEditor).
 */
export type EditApi = {
  enabled: boolean;
  /** Uloží nová data objektu. Objekty z fallbacku (id < 0) se nejdřív POSTem zhmotní. */
  patchData: (id: number, data: Record<string, unknown>) => Promise<void>;
  /** Skryje/zobrazí objekt (hidden). */
  setHidden: (id: number, hidden: boolean) => Promise<void>;
  /** Smaže objekt. */
  remove: (id: number) => Promise<void>;
  /** Vytvoří nový objekt v zóně (na konec). */
  createInZone: (zone: string, type: string, data: Record<string, unknown>) => Promise<void>;
};

const DISABLED: EditApi = {
  enabled: false,
  patchData: async () => {},
  setHidden: async () => {},
  remove: async () => {},
  createInZone: async () => {},
};

export const EditContext = createContext<EditApi>(DISABLED);

export function useEdit(): EditApi {
  return useContext(EditContext);
}
