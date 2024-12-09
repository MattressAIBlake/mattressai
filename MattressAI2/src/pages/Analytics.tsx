import React from 'react';
import TrafficChart from '../components/analytics/TrafficChart';

const Analytics = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gradient mb-6">Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Traffic Overview</h2>
          <TrafficChart />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Engagement</h2>
          {/* Engagement metrics will go here */}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Conversion</h2>
          {/* Conversion metrics will go here */}
        </div>
      </div>
    </div>
  );
};

export default Analytics; 