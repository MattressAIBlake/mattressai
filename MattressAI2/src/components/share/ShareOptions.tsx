import React, { useState } from 'react';
import { Mail, MessageSquare, Link2, QrCode, Download } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

const ShareOptions = () => {
  const [activeType, setActiveType] = useState<'lite' | 'plus'>('plus');

  return (
    <div className="grid grid-cols-2 gap-8">
      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <Button 
            variant={activeType === 'lite' ? 'gradient' : 'secondary'} 
            className="flex-1"
            onClick={() => setActiveType('lite')}
          >
            Lite
          </Button>
          <Button 
            variant={activeType === 'plus' ? 'gradient' : 'secondary'} 
            className="flex-1"
            onClick={() => setActiveType('plus')}
          >
            Plus
          </Button>
        </div>
        <div className="space-y-3">
          <Button
            variant="ghost"
            icon={Mail}
            className="w-full justify-start border border-gray-200 hover:border-gray-300 py-3.5 px-4"
          >
            Lead Via Email
          </Button>
          <Button
            variant="ghost"
            icon={MessageSquare}
            className="w-full justify-start border border-gray-200 hover:border-gray-300 py-3.5 px-4"
          >
            Lead Via SMS
          </Button>
          <Button
            variant="ghost"
            icon={Link2}
            className="w-full justify-start border border-gray-200 hover:border-gray-300 py-3.5 px-4"
          >
            Copy Lead Link
          </Button>
        </div>
      </Card>
      <Card className="p-6">
        <div className="flex justify-center mb-6 p-8 bg-gray-50 rounded-lg">
          <QrCode className="h-48 w-48" />
        </div>
        <Button variant="gradient" className="w-full" icon={Download}>
          Download QR
        </Button>
      </Card>
    </div>
  );
};

export default ShareOptions;