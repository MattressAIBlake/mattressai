import React from 'react';
import { Mail, MessageSquare, QrCode, Link2 } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

const ShareMethodsCard = () => {
  const methods = [
    { icon: Mail, label: 'Send Via Email' },
    { icon: MessageSquare, label: 'Send Via SMS' },
    { icon: QrCode, label: 'Send QR Code' },
    { icon: Link2, label: 'Copy Link' },
  ];

  return (
    <Card className="p-6">
      <div className="flex gap-3 mb-6">
        <Button variant="secondary" size="sm" className="flex-1">
          Lite
        </Button>
        <Button variant="gradient" size="sm" className="flex-1">
          Plus
        </Button>
      </div>
      <div className="space-y-2">
        {methods.map((method, index) => (
          <Button
            key={index}
            variant="ghost"
            icon={method.icon}
            className="w-full justify-start text-gray-600 border border-gray-200 hover:border-gray-300"
          >
            {method.label}
          </Button>
        ))}
      </div>
    </Card>
  );
};

export default ShareMethodsCard;