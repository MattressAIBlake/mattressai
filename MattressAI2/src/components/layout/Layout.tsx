import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import EmailVerification from '../auth/EmailVerification';
import SuperAdminSetup from '../auth/SuperAdminSetup';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64">
        <Header />
        <EmailVerification />
        <SuperAdminSetup />
        <main className="pt-24 px-4 lg:px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;