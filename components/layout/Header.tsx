
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
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  if (isAuthPage) {
    return null;
  }

  return (
    <header className="flex items-center justify-between h-16 px-4 bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-30 w-full shrink-0">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="md:hidden" onClick={toggleSidebar}>
          <MenuIcon className="w-6 h-6" />
        </Button>
        <Link to={"/"}>
          <div className="flex items-center gap-2">
            <BananaIcon className={`w-8 h-8`} />
            <h1 className="text-xl font-bold font-serif text-foreground">Promofye</h1>
          </div>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {user && (
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
        )}
        {!user && (
          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;