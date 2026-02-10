import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { THEME_TRANSITIONS } from '../../utils/themeUtils';
import { memo, useEffect } from 'react';
import logoSrc from '../../assets/images/qiulab-logo.svg';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
  Users,
  Activity,
  Menu,
  ShoppingCart,
  ClipboardList,
  BarChart3,
  Eye,
  Database,
  TrendingUp
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar, isMobile }) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  // Pastikan sidebar merespon klik dengan benar
  useEffect(() => {
    // Hanya log dalam mode development dan jika debugging aktif
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_UI === 'true') {
      console.log("Sidebar state:", { isOpen, isMobile, isDarkMode });
    }
  }, [isOpen, isMobile, isDarkMode]);

  // If sidebar is closed in mobile view, don't render content at all
  if (isMobile && !isOpen) {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={`fixed top-4 left-4 z-50 ${THEME_TRANSITIONS.default}`}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
  };

  // Determine which navigation items to show based on user role
  const renderNavItems = () => {
    return (
      <>
        {/* Team System */}
        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
          {isOpen && (
            <div className="px-3 py-2 text-xs font-semibold text-white uppercase tracking-wider bg-blue-600 dark:bg-blue-700 rounded-md">
              Team System
            </div>
          )}
        </div>
        <NavItem to="/monitoring-order" icon={TrendingUp} label="Order Monitoring" isOpen={isOpen} />
        <NavItem to="/setup-request" icon={Settings} label="Setup Request" isOpen={isOpen} />
        <NavItem to="/statistics" icon={BarChart3} label="Statistik" isOpen={isOpen} />
        <NavItem to="/generate" icon={FileSpreadsheet} label="Generate" isOpen={isOpen} />

        {/* Team Sweeping */}
        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
          {isOpen && (
            <div className="px-3 py-2 text-xs font-semibold text-white uppercase tracking-wider bg-green-600 dark:bg-green-700 rounded-md">
              Team Sweeping
            </div>
          )}
        </div>
        <NavItem to="/otomasi/get-order" icon={ShoppingCart} label="Get Order" isOpen={isOpen} />
        <NavItem to="/monitoring" icon={Eye} label="Cek Order" isOpen={isOpen} />
        <NavItem to="/refreshdb" icon={Database} label="RefreshDB" isOpen={isOpen} />

        {/* Special access for admin users */}
        {(user?.role === 'admin' || user?.is_admin) && (
          <>
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
              {isOpen && (
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Khusus Admin
                </div>
              )}
            </div>
            <NavItem to="/manage-users" icon={Users} label="Kelola Pengguna" isOpen={isOpen} />
          </>
        )}
      </>
    );
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 transition-opacity duration-300"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30",
          "bg-white dark:bg-gray-800 shadow-md",
          "flex flex-col h-full overflow-hidden pt-14",
          "transform transition-all duration-300 ease-in-out",
          isOpen ? "w-48" : "w-12",
          THEME_TRANSITIONS.default
        )}
        aria-label="Sidebar"
      >
        {/* Main Navigation */}
        <ScrollArea className="flex-1 px-2 py-2">
          <nav className="space-y-1">
            {renderNavItems()}

            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
              <NavItem to="/profile" icon={User} label="Profile" isOpen={isOpen} />
            </div>
          </nav>
        </ScrollArea>

        {/* Bottom Section */}
        <div className="px-2 py-2 border-t border-gray-200 dark:border-gray-700">
          {/* Theme Toggler */}
          <Button
            variant="ghost"
            className={cn(
              "flex items-center w-full px-2 py-2 text-sm font-medium rounded-md",
              "transition-all duration-200 ease-in-out",
              "hover:scale-105 relative group",
              "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
              THEME_TRANSITIONS.default
            )}
            onClick={toggleDarkMode}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5">
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </span>
            {isOpen && (
              <span className="ml-2.5">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            )}
          </Button>

          {/* Logout */}
          <Button
            variant="ghost"
            className={cn(
              "flex items-center w-full px-2 py-2 text-sm font-medium rounded-md mt-1",
              "transition-all duration-200 ease-in-out",
              "hover:scale-105 relative group",
              "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
              THEME_TRANSITIONS.default
            )}
            onClick={handleLogout}
            aria-label="Logout"
          >
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5">
              <LogOut className="h-5 w-5" />
            </span>
            {isOpen && (
              <span className="ml-2.5">Logout</span>
            )}
          </Button>
        </div>
      </aside>
    </>
  );
};

// Memoize NavItem untuk optimasi performa
const NavItem = memo(({ to, icon: Icon, label, isOpen }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        "flex items-center px-2 py-2 text-sm font-medium rounded-md",
        "transition-all duration-200 ease-in-out",
        "hover:scale-105 relative group",
        isActive
          ? "bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 scale-105"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
        THEME_TRANSITIONS.default
      )}
      aria-label={label}
    >
      {({ isActive }) => (
        <>
          <span className="flex-shrink-0 flex items-center justify-center w-5 h-5">
            <Icon className="h-5 w-5" />
          </span>
          {isOpen ? (
            <span className="ml-2.5 truncate">{label}</span>
          ) : (
            <span className="absolute left-12 ml-2 px-2 py-1 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-md">
              {label}
            </span>
          )}
          {isActive && (
            <span className="absolute left-0 w-1 h-6 bg-primary-600 dark:bg-primary-400 rounded-r-md"></span>
          )}
        </>
      )}
    </NavLink>
  );
});

NavItem.displayName = 'NavItem';

export default Sidebar; 