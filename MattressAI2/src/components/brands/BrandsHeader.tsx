import React from 'react';
import { Info } from 'lucide-react';

const BrandsHeader = () => {
  return (
    <div className="gradient-bg text-white p-6 rounded-xl">
      <div className="flex items-center gap-2">
        <Info className="h-5 w-5" />
        <p className="text-sm font-medium">
          Select which Brands your MattressAI Leads Plus Assistant will use during its conversations with customers.
        </p>
      </div>
    </div>
  );
};

export default BrandsHeader;