
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import { SunIcon, MoonIcon, MenuIcon, BananaIcon, SettingsIcon } from '../icons/LucideIcons';
import { useSettings } from '../../hooks/useSettings';

const toggleSidebar = () => {
  const sidebar = document.getElementById('sidebar');
  sidebar?.classList.toggle('-translate-x-full');
};

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { toggleSettings } = useSettings();
  const { user, profile, subscription, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="flex items-center justify-between h-16 px-4 lg:px-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-border sticky top-0 z-50 w-full">
      <div className="flex items-center gap-6">
        <Link to={"/"}>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-sky-600 flex items-center justify-center">
              <span className="text-xl">🚀</span>
            </div>
            <h1 className="text-xl font-bold font-display text-foreground">Promofye</h1>
          </div>
        </Link>
        {user && (
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/editor">
              <Button variant="ghost" size="sm">Thumbnails</Button>
            </Link>
            <Link to="/product">
              <Button variant="ghost" size="sm">Product Photos</Button>
            </Link>
            <Link to="/reimaginer">
              <Button variant="ghost" size="sm">Reimagine</Button>
            </Link>
            {profile?.is_admin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm">Admin</Button>
              </Link>
            )}
          </nav>
        )}
      </div>
      <div className="flex items-center gap-2">
        {user ? (
          <>
            <Link to="/subscription">
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <span className="text-sm">
                  {subscription?.subscription_plans?.name || 'Free'} Plan
                </span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={toggleSettings}>
              <SettingsIcon className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </Button>
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Sign Up</Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;