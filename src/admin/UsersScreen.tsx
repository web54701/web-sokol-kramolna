import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiSend, type AdminUser } from './api';

type UserRow = {
  id: number;
  email: string;
  name: string;
  created_at: string;
  last_login_at: string | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
}

export function UsersScreen({ currentUser }: { currentUser: AdminUser }) {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // formulář nového uživatele
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  // změna hesla existujícího uživatele
  const [pwUserId, setPwUserId] = useState<number | null>(null);
  const [pwValue, setPwValue] = useState('');

  const reload = useCallback(() => {
    apiGet<UserRow[]>('/api/admin/users')
      .then((data) => { setUsers(data); setError(null); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Načtení selhalo.'));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      reload();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Akce se nezdařila.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await run(() => apiSend('POST', '/api/admin/users', {
      email: newEmail, name: newName, password: newPassword,
    }));
    if (ok) { setNewEmail(''); setNewName(''); setNewPassword(''); }
  };

  const changePassword = async (id: number) => {
    const ok = await run(() => apiSend('PATCH', `/api/admin/users/${id}`, { password: pwValue }));
    if (ok) { setPwUserId(null); setPwValue(''); }
  };

  const removeUser = async (u: UserRow) => {
    if (!confirm(`Opravdu smazat uživatele ${u.email}?`)) return;
    await run(() => apiSend('DELETE', `/api/admin/users/${u.id}`));
  };

  if (users === null) return <div className="cms-loading">Načítání…</div>;

  return (
    <div className="cms-page-editor">
      <h2 className="cms-page-title">Uživatelé</h2>

      <section className="cms-zone">
        <div className="cms-zone-head"><h3>Přidat uživatele</h3></div>
        <form className="cms-user-form" onSubmit={addUser}>
          <input className="skp-input" type="email" placeholder="E-mail" required
            value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          <input className="skp-input" type="text" placeholder="Jméno"
            value={newName} onChange={(e) => setNewName(e.target.value)} />
          <input className="skp-input" type="password" placeholder="Heslo (min. 8 znaků)" required minLength={8}
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <button type="submit" className="skp-btn-primary" disabled={busy}>Přidat</button>
        </form>
      </section>

      <section className="cms-zone">
        <div className="cms-zone-head"><h3>Účty</h3></div>
        <div className="cms-zone-list">
          {users.map((u) => (
            <div key={u.id} className="cms-zone-item">
              <div className="cms-zone-item-text">
                <span className="cms-zone-item-title">
                  {u.name || u.email}
                  {u.id === currentUser.id && <span className="cms-badge">vy</span>}
                </span>
                <span className="cms-user-meta">
                  {u.email} · vytvořen {formatDate(u.created_at)} · poslední přihlášení {formatDate(u.last_login_at)}
                </span>
              </div>
              <div className="cms-zone-item-actions">
                {pwUserId === u.id ? (
                  <>
                    <input className="skp-input cms-pw-input" type="password" placeholder="Nové heslo" minLength={8}
                      value={pwValue} onChange={(e) => setPwValue(e.target.value)} />
                    <button className="cms-btn-secondary" disabled={busy || pwValue.length < 8}
                      onClick={() => changePassword(u.id)}>Uložit</button>
                    <button className="cms-row-btn" onClick={() => { setPwUserId(null); setPwValue(''); }}>✕</button>
                  </>
                ) : (
                  <>
                    <button className="cms-btn-secondary" onClick={() => { setPwUserId(u.id); setPwValue(''); }}>
                      Změnit heslo
                    </button>
                    {u.id !== currentUser.id && (
                      <button className="cms-row-btn" onClick={() => removeUser(u)} title="Smazat">🗑</button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {error && <p className="cms-login-error">{error}</p>}
    </div>
  );
}
