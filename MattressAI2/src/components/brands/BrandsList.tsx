import React from 'react';
import BrandToggle from './BrandToggle';
import { useBrandsStore } from './brandsStore';

const BrandsList = () => {
  const brands = useBrandsStore(state => state.brands);
  
  const groupedBrands = brands.reduce((acc, brand) => {
    const firstLetter = brand.name[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(brand);
    return acc;
  }, {} as Record<string, typeof brands>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedBrands).map(([letter, brands]) => (
        <div key={letter} className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900 bg-gray-100 px-4 py-2 rounded-lg">
            {letter}
          </h2>
          <div className="space-y-1">
            {brands.map((brand) => (
              <BrandToggle
                key={brand.id}
                name={brand.name}
                enabled={brand.enabled}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BrandsList;