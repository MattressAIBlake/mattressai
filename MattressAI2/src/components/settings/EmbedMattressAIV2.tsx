import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const EmbedMattressAIV2 = () => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-semibold">Embed MattressAI V2</h2>
        <Badge variant="primary">Coming Soon</Badge>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-600">
          The next generation of MattressAI embedding is currently in development.
          Stay tuned for enhanced features and improved integration options.
        </p>
      </div>
    </Card>
  );
};

export default EmbedMattressAIV2;