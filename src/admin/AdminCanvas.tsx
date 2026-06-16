import { EditorProvider } from './EditorProvider';
import { HomePage } from '../pages/HomePage';
import './admin.css';      // styly modálů (cms-modal-*) použité v editačních dialozích
import './live-editor.css';

/**
 * Samostatné editační plátno načítané v iframe uvnitř LiveEditoru.
 * Díky iframe má vlastní viewport, takže responzivní breakpointy (desktop/mobil)
 * fungují věrně i při WYSIWYG editaci přímo na stránce.
 */
export default function AdminCanvas() {
  return (
    <EditorProvider>
      <HomePage onNavigate={() => { /* v editaci nenavigujeme */ }} />
    </EditorProvider>
  );
}
