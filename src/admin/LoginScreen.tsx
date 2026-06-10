import { useState } from 'react';
import { apiSend, type AdminUser } from './api';

export function LoginScreen({ onLogin }: { onLogin: (user: AdminUser) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const user = await apiSend<AdminUser>('POST', '/api/auth/login', { email, password });
      onLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Přihlášení se nezdařilo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cms-login-wrap">
      <form className="cms-login" onSubmit={submit}>
        <img src="/logo_sokol.png" alt="" className="cms-login-logo" />
        <h1>Správa webu</h1>
        <p className="cms-login-sub">Sokol Kramolna</p>
        <div className="skp-field">
          <label htmlFor="cms-email">E-mail</label>
          <input
            id="cms-email"
            className="skp-input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="skp-field">
          <label htmlFor="cms-password">Heslo</label>
          <input
            id="cms-password"
            className="skp-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="cms-login-error">{error}</p>}
        <button type="submit" className="skp-btn-primary cms-login-btn" disabled={busy}>
          {busy ? 'Přihlašování…' : 'Přihlásit se'}
        </button>
      </form>
    </div>
  );
}
