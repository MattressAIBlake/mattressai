import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: string;
  collapsed?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ 
  icon: Icon, 
  label, 
  href, 
  badge, 
  collapsed = false,
  onClick 
}) => {
  const location = useLocation();
  const isActive = location.pathname === href;
  
  return (
    <li>
      <Link
        to={href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus-ring ${
          isActive
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
        title={collapsed ? label : undefined}
        onClick={onClick}
      >
        <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
        {!collapsed && (
          <>
            <span>{label}</span>
            {badge && (
              <span className={`ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                badge === 'Premium' 
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {badge}
              </span>
            )}
          </>
        )}
      </Link>
    </li>
  );
};

export default NavItem;