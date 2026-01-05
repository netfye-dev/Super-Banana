import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from './hooks/useTheme';
import { HistoryProvider } from './hooks/useHistory';
import { SettingsProvider } from './hooks/useSettings';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Header from './components/layout/Header';
import SettingsModal from './components/layout/SettingsModal';
import HomePage from './pages/HomePage';
import EditorPage from './pages/EditorPage';
import ProductPage from './pages/ProductPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import ReimaginerPage from './pages/ReimaginerPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AdminPage from './pages/AdminPage';
import SubscriptionPage from './pages/SubscriptionPage';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

// Fix: Removed the explicit 'Transition' type annotation to let TypeScript infer the object's type, bypassing the type conflict.
const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
};

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/editor/:id?" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
        <Route path="/product/:id?" element={<ProtectedRoute><ProductPage /></ProtectedRoute>} />
        <Route path="/reimaginer/:id?" element={<ProtectedRoute><ReimaginerPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  );
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        {!isAuthPage && <Header />}
        <main className="flex-1">
            <AnimatedRoutes />
        </main>
        <SettingsModal />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HistoryProvider>
          <SettingsProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </SettingsProvider>
        </HistoryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
