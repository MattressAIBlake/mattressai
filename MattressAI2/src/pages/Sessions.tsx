import React from 'react';
import SessionsHeader from '../components/sessions/SessionsHeader';
import SessionsSearch from '../components/sessions/SessionsSearch';
import SessionsTable from '../components/sessions/SessionsTable';

const Sessions = () => {
  return (
    <div className="space-y-6">
      <SessionsHeader />
      <SessionsSearch />
      <SessionsTable />
    </div>
  );
};

export default Sessions; 