import { getServerSession } from 'next-auth/next';
import { authOptions } from './lib/auth';
import Link from 'next/link';

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="text-center space-y-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold">Turn Your Tweets into App Ideas</h1>
      <p className="text-xl">
        Sign in with your X account, and we'll analyze your bookmarks to generate an AI-powered
        app blueprint with Cursor prompts.
      </p>
      
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <div className="p-6 border rounded shadow hover:shadow-md transition-shadow">
          <div className="text-3xl mb-3">1</div>
          <h2 className="text-xl font-semibold mb-2">Connect with X</h2>
          <p>Sign in with your X account to access your bookmarked tweets.</p>
        </div>
        <div className="p-6 border rounded shadow hover:shadow-md transition-shadow">
          <div className="text-3xl mb-3">2</div>
          <h2 className="text-xl font-semibold mb-2">Generate Blueprint</h2>
          <p>Our AI will analyze your bookmarks and create an app blueprint with Cursor prompts.</p>
        </div>
        <div className="p-6 border rounded shadow hover:shadow-md transition-shadow">
          <div className="text-3xl mb-3">3</div>
          <h2 className="text-xl font-semibold mb-2">Unlock Full Access</h2>
          <p>Preview 50% for free, then pay to unlock the complete blueprint and prompts.</p>
        </div>
      </div>

      {!session && (
        <div className="mt-8">
          <Link 
            href="/api/auth/signin/google"
            className="px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Sign in with Google
          </Link>
        </div>
      )}

      {session && (
        <div className="mt-8">
          <Link 
            href="/dashboard"
            className="px-6 py-3 text-lg font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            Go to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
} 