import React from 'react';
import { FileText } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const CurrentBrands = () => {
  const brands = ['TEMPUR-PEDIC', 'Helix', 'Avocado', 'Naturepedic'];

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Current Brands</h2>
        <Button variant="secondary" size="sm" icon={FileText}>
          Merchant Brands
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {brands.map((brand, index) => (
          <span
            key={index}
            className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium"
          >
            {brand}
          </span>
        ))}
      </div>
    </Card>
  );
};

export default CurrentBrands;