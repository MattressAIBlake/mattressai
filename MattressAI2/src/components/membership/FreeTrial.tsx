import React from 'react';
import { Check, Building2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const FreeTrial = () => {
  const features = [
    'Get Free Access to MattressAI.',
    'Get Access to Premium Features for 15 Days.',
    'Test our Premium Plan.',
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">15 Day Free Trial</h2>
        <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-blue-500" />
        </div>
      </div>
      
      <div className="space-y-4 mb-6">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-3">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-gray-700">{feature}</span>
          </div>
        ))}
      </div>

      <Button variant="gradient" className="w-full">
        Start Trial
      </Button>
    </Card>
  );
};

export default FreeTrial;