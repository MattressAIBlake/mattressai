'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import ReactMarkdown from 'react-markdown';

interface Idea {
  id: string;
  summary: string;
  rules: string;
  prompts: string;
  environment: string;
  paid: boolean;
  createdAt: string;
}

export default function IdeaDetailPage() {
  const { ideaId } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (session && ideaId) {
      fetchIdeaDetails();
    }
  }, [session, ideaId, status, router]);

  const fetchIdeaDetails = async () => {
    try {
      const res = await fetch(`/api/ideas/${ideaId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch idea');
      }
      const data = await res.json();
      setIdea(data);
    } catch (error) {
      console.error('Error fetching idea:', error);
      toast.error('Failed to load idea details');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!idea) return;
    
    setIsCheckoutLoading(true);
    try {
      const res = await fetch('/api/stripe/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId: idea.id }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to initialize payment');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  if (loading || status === 'loading') {
    return <LoadingSkeleton />;
  }

  if (!idea) {
    return (
      <div className="text-center p-8">
        <p className="text-xl text-red-600">Idea not found</p>
        <button 
          onClick={() => router.push('/dashboard')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isPreview = !idea.paid;

  // Functions to handle displaying preview or full content
  const getPreviewContent = (content: string) => {
    if (!content) return '';
    return isPreview ? content.slice(0, Math.floor(content.length / 2)) + '...' : content;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <button
        onClick={() => router.push('/dashboard')}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Dashboard
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold">{idea.summary}</h1>
          {isPreview && (
            <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
              Preview Mode
            </span>
          )}
          {idea.paid && (
            <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
              Full Access
            </span>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">App Rules</h2>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
            <ReactMarkdown>{getPreviewContent(idea.rules)}</ReactMarkdown>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Cursor Prompts</h2>
          <SyntaxHighlighter 
            language="javascript"
            style={dracula}
            className="rounded-md text-sm"
          >
            {getPreviewContent(idea.prompts)}
          </SyntaxHighlighter>
        </div>

        {isPreview && (
          <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
            <h3 className="text-lg font-semibold mb-2">Unlock Full Content</h3>
            <p className="mb-4">
              You're viewing a preview (50%) of the generated content. 
              Unlock the full app blueprint and Cursor prompts!
            </p>
            <button
              onClick={handleUnlock}
              disabled={isCheckoutLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
            >
              {isCheckoutLoading ? 'Processing...' : 'Purchase Full Access ($10)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 