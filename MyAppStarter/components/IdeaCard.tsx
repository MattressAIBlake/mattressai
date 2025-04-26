'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Idea {
  id: string;
  summary: string;
  createdAt: Date;
  paid: boolean;
}

interface IdeaCardProps {
  idea: Idea;
}

const IdeaCard = ({ idea }: IdeaCardProps) => {
  const formattedDate = formatDistanceToNow(new Date(idea.createdAt), {
    addSuffix: true,
  });

  return (
    <Link 
      href={`/dashboard/${idea.id}`}
      className="block p-6 border border-gray-200 rounded-lg shadow hover:shadow-md transition-shadow"
      tabIndex={0}
      aria-label={`View app idea: ${idea.summary.substring(0, 50)}...`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white flex-1">
          {idea.summary.length > 60 
            ? `${idea.summary.substring(0, 60)}...` 
            : idea.summary}
        </h3>
        {idea.paid ? (
          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
            Unlocked
          </span>
        ) : (
          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
            Preview
          </span>
        )}
      </div>
      <div className="text-sm text-gray-500 mt-2">
        Created {formattedDate}
      </div>
    </Link>
  );
};

export default IdeaCard; 