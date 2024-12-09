import React from 'react';
import { Home, Users, BarChart2, Share2, Settings, Building2, UserCircle, MessageSquare, GraduationCap, ChevronLeft, Menu, Bot } from 'lucide-react';
import NavItem from './NavItem';
import { useSidebarStore } from '../../stores/sidebarStore';

const Sidebar = () => {
  const { isCollapsed, toggleSidebar, isMobileOpen, setMobileOpen } = useSidebarStore();

  const menuItems = [
    { section: 'Merchant Dashboard', items: [
      { icon: Home, label: 'Home', href: '/' },
      { icon: Users, label: 'Sessions', href: '/sessions' },
      { icon: BarChart2, label: 'Analytics', href: '/analytics', badge: 'Building' },
      { icon: Share2, label: 'Share', href: '/share' },
    ]},
    { section: 'Assistant Setup', items: [
      { icon: Settings, label: 'Settings', href: '/settings' },
      { icon: Building2, label: 'Inventory', href: '/brands' },
      { icon: Bot, label: 'Assistant Config', href: '/assistant-config' },
    ]},
    { section: 'Merchant Section', items: [
      { icon: UserCircle, label: 'Membership', href: '/membership', badge: 'Premium' },
      { icon: MessageSquare, label: 'Feedback', href: '/feedback' },
      { icon: GraduationCap, label: 'Tutorials', href: '/tutorials' },
    ]},
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside 
        className={`bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-50 shadow-sm transition-all duration-300
          ${isCollapsed ? 'w-20' : 'w-64'}
          lg:translate-x-0 
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <Building2 className="h-8 w-8 text-blue-600 flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                MattressAI
              </span>
            )}
            <button 
              onClick={toggleSidebar}
              className="ml-auto p-1.5 hover:bg-gray-100 rounded-lg transition-colors lg:block hidden"
            >
              <ChevronLeft className={`h-5 w-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={() => setMobileOpen(false)}
              className="ml-auto p-1.5 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
          <nav className="space-y-8">
            {menuItems.map((section, index) => (
              <div key={index}>
                {!isCollapsed && (
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    {section.section}
                  </h3>
                )}
                <ul className="space-y-1">
                  {section.items.map((item, itemIndex) => (
                    <NavItem
                      key={itemIndex}
                      icon={item.icon}
                      label={item.label}
                      href={item.href}
                      badge={item.badge}
                      collapsed={isCollapsed}
                      onClick={() => setMobileOpen(false)}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;