import React from 'react';
import { Moon, User, Menu } from 'lucide-react';
import Button from '../ui/Button';
import Breadcrumbs from './Breadcrumbs';
import { useSidebarStore } from '../../stores/sidebarStore';

const Header = () => {
  const setMobileOpen = useSidebarStore((state) => state.setMobileOpen);
  const currentPath = window.location.pathname;
  
  const getBreadcrumbItems = () => {
    const paths = currentPath.split('/').filter(Boolean);
    return paths.map((path) => ({
      label: path.charAt(0).toUpperCase() + path.slice(1),
      href: `/${paths.slice(0, paths.indexOf(path) + 1).join('/')}`,
    }));
  };

  return (
    <header className="h-16 fixed right-0 top-0 left-0 lg:left-64 bg-white border-b border-gray-200 z-10 backdrop-blur-sm bg-white/90">
      <div className="h-full px-4 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setMobileOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block">
            <Breadcrumbs items={getBreadcrumbItems()} />
          </div>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-4">
          <Button variant="primary" className="hidden lg:flex">
            Premium Plan
          </Button>
          <div className="hidden sm:flex items-center gap-2 text-green-500 bg-green-50 px-3 py-1.5 rounded-full">
            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium">Online</span>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Moon className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;