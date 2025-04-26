"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import IdeaCard from '@/components/IdeaCard';
import Link from 'next/link';
import LoadingSkeleton from "@/components/LoadingSkeleton";
import toast from 'react-hot-toast';

interface Idea {
  id: string;
  summary: string;
  createdAt: Date;
  paid: boolean;
}

const ENV_OPTIONS = [
  { label: "Cursor", value: "cursor" },
  { label: "Windsurf", value: "windsurf" },
  { label: "Replit Agent", value: "replit" },
  { label: "Codex CLI", value: "codex" },
];

function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [environment, setEnvironment] = useState<string>(ENV_OPTIONS[0].value);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarksLoaded, setBookmarksLoaded] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch('/api/ideas')
        .then(res => res.json())
        .then(data => {
          setIdeas(data);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching ideas:', error);
          toast.error('Failed to load ideas');
          setIsLoading(false);
        });
    }
  }, [session]);

  useEffect(() => {
    if (session && !bookmarksLoaded) {
      setIsLoading(true);
      fetch('/api/bookmarks')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch bookmarks');
          return res.json();
        })
        .then(data => {
          setBookmarks(data.data || []);
          setBookmarksLoaded(true);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching bookmarks:', error);
          toast.error('Failed to load bookmarks from X');
          setIsLoading(false);
        });
    }
  }, [session, bookmarksLoaded]);

  // Accessibility: close modal on Esc
  useEffect(() => {
    if (!isModalOpen) return;
    
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  // Accessibility: focus trap
  useEffect(() => {
    if (isModalOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isModalOpen]);

  const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setError("");
    setEnvironment(ENV_OPTIONS[0].value);
  }, []);

  const handleEnvironmentChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setEnvironment(e.target.value);
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ environment }),
      });
      if (!res.ok) {
        throw new Error("Failed to generate idea");
      }
      const data = await res.json();
      setIdeas((prev: Idea[]) => [
        {
          id: data.ideaId,
          summary: data.summary,
          createdAt: new Date(),
          paid: false
        },
        ...prev,
      ]);
      setIsModalOpen(false);
      toast.success('Idea generated! View 50% preview.');
      router.push(`/dashboard/${data.ideaId}`);
    } catch (err) {
      setError("Could not generate idea. Please try again.");
      toast.error('Failed to generate idea.');
    } finally {
      setIsGenerating(false);
    }
  }, [environment, router]);

  if (status === 'loading' || isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your App Ideas</h1>
        <div className="flex gap-4 items-center">
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Generate New Idea"
            tabIndex={0}
            onClick={handleOpenModal}
            onKeyDown={(e: ReactKeyboardEvent<HTMLButtonElement>) => { if (e.key === "Enter" || e.key === " ") handleOpenModal(); }}
          >
            Generate New Idea
          </button>
          {ideas.length > 0 && (
            <Link
              href="/dashboard/history"
              className="text-blue-600 hover:text-blue-800 font-medium"
              aria-label="View All Ideas"
              tabIndex={0}
            >
              View All
            </Link>
          )}
        </div>
      </div>

      {bookmarks.length === 0 && bookmarksLoaded && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-8">
          <p className="text-yellow-800">
            No bookmarks found in your X account. Please add some bookmarks to generate app ideas.
          </p>
        </div>
      )}

      {ideas.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">No ideas generated yet</h2>
          <p className="mb-4">Click "Generate New Idea" to create your first app blueprint.</p>
          <button
            onClick={handleOpenModal}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            tabIndex={0}
          >
            Generate Your First Idea
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea: Idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          aria-modal="true"
          role="dialog"
        >
          <div
            ref={modalRef}
            tabIndex={-1}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-md outline-none"
          >
            <h2 className="text-xl font-semibold mb-4">Generate New Idea</h2>
            {bookmarks.length === 0 && bookmarksLoaded ? (
              <div>
                <p className="text-red-600 mb-4">
                  No bookmarks found in your X account. Please add some bookmarks to generate app ideas.
                </p>
                <button
                  type="button"
                  className="w-full py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 mb-2"
                  onClick={handleCloseModal}
                  aria-label="Close modal"
                  tabIndex={0}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <label htmlFor="environment" className="block mb-2 font-medium">
                  Development Environment
                </label>
                <select
                  id="environment"
                  name="environment"
                  value={environment}
                  onChange={handleEnvironmentChange}
                  className="w-full mb-4 p-2 border rounded focus:ring-2 focus:ring-blue-400"
                  aria-label="Select environment"
                >
                  {ENV_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2"
                  aria-label="Submit to generate idea"
                  tabIndex={0}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating...' : 'Generate'}
                </button>
                {error && <div className="text-red-600 mt-2">{error}</div>}
                <button
                  type="button"
                  className="mt-4 text-gray-500 hover:text-gray-700 underline"
                  onClick={handleCloseModal}
                  aria-label="Close modal"
                  tabIndex={0}
                  onKeyDown={(e: ReactKeyboardEvent<HTMLButtonElement>) => { if (e.key === "Enter" || e.key === " ") handleCloseModal(); }}
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage; 