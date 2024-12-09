import React from 'react';
import { Info } from 'lucide-react';

const ShareHeader = () => {
  return (
    <div className="gradient-bg text-white p-6 rounded-xl shadow-lg">
      <div className="flex items-center gap-2">
        <Info className="h-5 w-5" />
        <p className="text-sm font-medium">
          Select from the options below to share your MattressAI Assistants to your customers.
        </p>
      </div>
    </div>
  );
};

export default ShareHeader;