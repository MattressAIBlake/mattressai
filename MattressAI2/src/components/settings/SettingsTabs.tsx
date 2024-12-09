import React from 'react';
import { Badge } from '../ui/Badge';

type TabType = 'account' | 'configuration' | 'questions' | 'embed' | 'embedV2';

interface SettingsTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const SettingsTabs: React.FC<SettingsTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'account', label: 'Account Settings' },
    { id: 'configuration', label: 'Assistant Configuration' },
    { id: 'questions', label: 'Assistant Questions' },
    { id: 'embed', label: 'Embed MattressAI' },
    { id: 'embedV2', label: 'Embed MattressAI (V2)', badge: 'Beta Feature' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id as TabType)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === tab.id
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="flex items-center gap-2">
            {tab.label}
            {tab.badge && (
              <Badge variant="primary" className="ml-2">
                {tab.badge}
              </Badge>
            )}
          </span>
        </button>
      ))}
    </div>
  );
};

export default SettingsTabs;