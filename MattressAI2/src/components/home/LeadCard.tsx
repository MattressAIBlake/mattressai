import React from 'react';
import { Sparkles } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

const LeadCard = () => {
  return (
    <Card className="p-6 flex flex-col items-center">
      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg flex items-center justify-center mb-6">
        <Sparkles className="w-12 h-12 text-white" />
      </div>
      <div className="w-full space-y-3">
        <Button 
          variant="secondary"
          className="w-full text-center py-3"
        >
          Lead Lite
        </Button>
        <Button 
          variant="gradient"
          className="w-full text-center py-3"
        >
          Lead Plus
        </Button>
      </div>
    </Card>
  );
};

export default LeadCard;