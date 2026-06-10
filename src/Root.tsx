import { Suspense, lazy } from 'react';
import App from './App.tsx';

const AdminApp = lazy(() => import('./admin/AdminApp.tsx'));
const isAdminRoute = window.location.pathname.startsWith('/admin');

export function Root() {
  if (isAdminRoute) {
    return (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    );
  }
  return <App />;
}
