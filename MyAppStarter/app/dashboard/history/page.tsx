import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/prisma/prismaClient';
import IdeaCard from '@/components/IdeaCard';
import { ExtendedSession } from '@/app/lib/auth';

interface Idea {
  id: string;
  summary: string;
  createdAt: Date;
  environment: string;
}

interface HistoryPageProps {
  searchParams: { page?: string };
}

const PAGE_SIZE = 9;

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const session = await getServerSession(authOptions) as ExtendedSession | null;
  if (!session?.user) redirect('/api/auth/signin');

  const page = Math.max(1, parseInt(searchParams.page || '1', 10));
  const skip = (page - 1) * PAGE_SIZE;

  const [ideas, total] = await Promise.all([
    prisma.idea.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      select: { id: true, summary: true, createdAt: true, environment: true },
    }),
    prisma.idea.count({ where: { userId: session.user.id } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Generated Ideas</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {ideas.map((idea: Idea) => (
          <IdeaCard key={idea.id} idea={idea} showRegenerate />
        ))}
      </div>
      <div className="flex justify-center gap-4">
        <a
          href={`?page=${page - 1}`}
          className={`px-4 py-2 rounded bg-gray-200 text-gray-700 font-medium ${page === 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-300'}`}
          aria-label="Previous page"
          tabIndex={0}
        >
          Prev
        </a>
        <span className="px-4 py-2 text-gray-600">Page {page} of {totalPages}</span>
        <a
          href={`?page=${page + 1}`}
          className={`px-4 py-2 rounded bg-gray-200 text-gray-700 font-medium ${page === totalPages ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-300'}`}
          aria-label="Next page"
          tabIndex={0}
        >
          Next
        </a>
      </div>
    </div>
  );
} 