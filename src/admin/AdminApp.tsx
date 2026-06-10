import { useEffect, useState } from 'react';
import { apiGet, type AdminUser } from './api';
import { LoginScreen } from './LoginScreen';
import { AdminLayout } from './AdminLayout';
import './admin.css';

export default function AdminApp() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    apiGet<AdminUser>('/api/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return <div className="cms-loading">Načítání…</div>;
  }

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return <AdminLayout user={user} onLogout={() => setUser(null)} />;
}
