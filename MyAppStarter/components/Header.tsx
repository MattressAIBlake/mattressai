'use client';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import ThemeToggle from './ThemeToggle';
import Image from 'next/image';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-800">
      <Link href="/">
        <h1 className="text-xl font-bold">My App Starter</h1>
      </Link>
      <nav className="space-x-4">
        {session ? (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <button 
              onClick={() => signOut()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              tabIndex={0}
              aria-label="Sign out"
            >
              Sign Out
            </button>
            {session.user?.image && (
              <Image 
                src={session.user.image}
                alt={session.user.name || "User"}
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
          </>
        ) : (
          <button 
            onClick={() => signIn('google')}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            tabIndex={0}
            aria-label="Sign in with Google"
          >
            Sign in with Google
          </button>
        )}
        <ThemeToggle />
      </nav>
    </header>
  );
} 