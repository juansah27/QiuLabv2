import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

const mainNavItems = [
  { text: 'Setup Request', path: '/setup-request' },
  { text: 'Get Order', path: '/otomasi/get-order' },
  { text: 'RefreshDB', path: '/refreshdb' },
  // ... other existing nav items
];

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {mainNavItems.map((item) => (
        <Button
          key={item.path}
          variant="ghost"
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            location.pathname === item.path
              ? "text-primary"
              : "text-muted-foreground"
          )}
          asChild
        >
          <Link to={item.path}>
            {item.text}
          </Link>
        </Button>
      ))}
    </nav>
  );
};

export default Navbar; 