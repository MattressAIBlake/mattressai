import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

const Layout = ({ children, className = '' }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-cyan to-primary-blue">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <main className={`grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 ${className}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout; 