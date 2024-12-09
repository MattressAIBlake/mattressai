import React from 'react';
import { Calendar, PlayCircle } from 'lucide-react';
import Card from '../ui/Card';

interface TutorialCardProps {
  title: string;
  description: string;
  image: string;
  type: 'live' | 'tutorials';
}

const TutorialCard: React.FC<TutorialCardProps> = ({
  title,
  description,
  image,
  type
}) => {
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 p-8">
          <div className="flex flex-col items-center text-center text-white">
            <img
              src="https://dashboard.themattressai.com/logo.png"
              alt="MattressAI Logo"
              className="w-16 h-16 mb-4"
            />
            <h2 className="text-3xl font-bold mb-2">
              {type === 'live' ? 'Book a Live Session with Us' : 'Tutorials, Help and FAQs'}
            </h2>
            <p className="text-gray-400">Supercharge your Sales with AI</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold flex items-center gap-2 mb-2">
          {title}
          {type === 'live' ? (
            <Calendar className="w-5 h-5 text-blue-500" />
          ) : (
            <PlayCircle className="w-5 h-5 text-blue-500" />
          )}
        </h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </Card>
  );
};

export default TutorialCard;