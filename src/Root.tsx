import { Suspense, lazy } from 'react';
import App from './App.tsx';
import { ContentProvider } from './content/ContentProvider.tsx';

const AdminApp = lazy(() => import('./admin/AdminApp.tsx'));
const AdminCanvas = lazy(() => import('./admin/AdminCanvas.tsx'));
const path = window.location.pathname;
const isCanvasRoute = path.startsWith('/admin/canvas');
const isAdminRoute = path.startsWith('/admin');

export function Root() {
  if (isCanvasRoute) {
    return (
      <Suspense fallback={null}>
        <AdminCanvas />
      </Suspense>
    );
  }
  if (isAdminRoute) {
    return (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    );
  }
  return (
    <ContentProvider>
      <App />
    </ContentProvider>
  );
}
