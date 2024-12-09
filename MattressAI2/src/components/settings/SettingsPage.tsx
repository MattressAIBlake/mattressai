import React, { useState } from 'react';
import Card from '../ui/Card';
import AccountSettings from './AccountSettings';
import AssistantConfiguration from './AssistantConfiguration';
import AssistantQuestions from './AssistantQuestions';
import EmbedMattressAI from './EmbedMattressAI';

type TabType = 'account' | 'configuration' | 'questions' | 'embed';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('account');

  const tabs = [
    { id: 'account', label: 'Account Settings' },
    { id: 'configuration', label: 'Assistant Configuration' },
    { id: 'questions', label: 'Assistant Questions' },
    { id: 'embed', label: 'Embed MattressAI' },
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return <AccountSettings />;
      case 'configuration':
        return <AssistantConfiguration />;
      case 'questions':
        return <AssistantQuestions />;
      case 'embed':
        return <EmbedMattressAI />;
      default:
        return <AccountSettings />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {renderContent()}
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;