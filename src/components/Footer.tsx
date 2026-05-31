export function Footer() {
  return (
    <footer className="sk-footer">
      <span>Sokol Kramolna © {new Date().getFullYear()}</span>
      <div className="sk-footer-links">
        <a>Ochrana osobních údajů</a>
        <a>Provozní řád areálu</a>
      </div>
    </footer>
  );
}
