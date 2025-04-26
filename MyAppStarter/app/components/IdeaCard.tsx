'use client';

import Link from 'next/link';

interface Idea {
  id: string;
  summary: string;
  createdAt: Date;
}

interface IdeaCardProps {
  idea: Idea;
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea }) => {
  return (
    <Link href={`/dashboard/${idea.id}`}>
      <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
        <h3 className="text-xl font-semibold mb-2">{idea.summary}</h3>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {new Date(idea.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default IdeaCard; 