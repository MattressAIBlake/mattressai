import React from 'react';
import { useBrandsStore } from './brandsStore';

interface BrandToggleProps {
  name: string;
  enabled: boolean;
}

const BrandToggle: React.FC<BrandToggleProps> = ({ name, enabled }) => {
  const toggleBrand = useBrandsStore(state => state.toggleBrand);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 rounded-lg transition-colors">
      <span className="text-gray-900">{name}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={enabled}
          onChange={() => toggleBrand(name)}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );
};

export default BrandToggle;