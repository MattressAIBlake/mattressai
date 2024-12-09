import React from 'react';
import { Building2 } from 'lucide-react';
import Card from '../ui/Card';

const CurrentTier = () => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">Current Tier</h2>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-blue-500" />
        </div>
        <span className="text-lg font-medium">Premium Plan</span>
      </div>
      <div className="mt-4">
        <div className="bg-gray-100 rounded-lg px-4 py-3">
          <span className="text-gray-600">**** **** ****</span>
        </div>
        <button className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
          Modify
        </button>
      </div>
    </Card>
  );
};

export default CurrentTier;