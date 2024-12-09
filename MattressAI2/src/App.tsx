import { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { QueryProvider } from './providers/QueryProvider';
import Layout from './components/layout/Layout';

// Lazy load components
const Login = lazy(() => import('./pages/Login'));
const HomePage = lazy(() => import('./components/home/HomePage'));
const ChatConfig = lazy(() => import('./pages/ChatConfig'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Sessions = lazy(() => import('./pages/Sessions'));
const Share = lazy(() => import('./pages/Share'));
const Settings = lazy(() => import('./pages/Settings'));
const Brands = lazy(() => import('./pages/Brands'));
const AssistantConfig = lazy(() => import('./pages/AssistantConfig'));
const Membership = lazy(() => import('./pages/Membership'));
const Feedback = lazy(() => import('./pages/Feedback'));
const Tutorials = lazy(() => import('./pages/Tutorials'));

// Loading component
const Loading = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Show loading state while checking auth
  if (isLoading) {
    return <Loading />;
  }

  const router = createBrowserRouter([
    {
      path: '/',
      element: isAuthenticated ? <Layout /> : <Navigate to="/login" replace />,
      children: [
        {
          path: '/',
          element: (
            <Suspense fallback={<Loading />}>
              <HomePage />
            </Suspense>
          ),
        },
        {
          path: '/sessions',
          element: (
            <Suspense fallback={<Loading />}>
              <Sessions />
            </Suspense>
          ),
        },
        {
          path: '/analytics',
          element: (
            <Suspense fallback={<Loading />}>
              <Analytics />
            </Suspense>
          ),
        },
        {
          path: '/share',
          element: (
            <Suspense fallback={<Loading />}>
              <Share />
            </Suspense>
          ),
        },
        {
          path: '/settings',
          element: (
            <Suspense fallback={<Loading />}>
              <Settings />
            </Suspense>
          ),
        },
        {
          path: '/brands',
          element: (
            <Suspense fallback={<Loading />}>
              <Brands />
            </Suspense>
          ),
        },
        {
          path: '/assistant-config',
          element: (
            <Suspense fallback={<Loading />}>
              <AssistantConfig />
            </Suspense>
          ),
        },
        {
          path: '/membership',
          element: (
            <Suspense fallback={<Loading />}>
              <Membership />
            </Suspense>
          ),
        },
        {
          path: '/feedback',
          element: (
            <Suspense fallback={<Loading />}>
              <Feedback />
            </Suspense>
          ),
        },
        {
          path: '/tutorials',
          element: (
            <Suspense fallback={<Loading />}>
              <Tutorials />
            </Suspense>
          ),
        },
      ],
    },
    {
      path: '/login',
      element: !isAuthenticated ? (
        <Suspense fallback={<Loading />}>
          <Login />
        </Suspense>
      ) : (
        <Navigate to="/" replace />
      ),
    },
  ]);

  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  );
}

export default App;