import React from 'react';
import LeadCard from './LeadCard';
import ShareMethodsCard from './ShareMethodsCard';
import RecentSessions from './RecentSessions';
import CurrentBrands from './CurrentBrands';
import TrafficChart from '../analytics/TrafficChart';
import EmbedMattressAI from '../settings/EmbedMattressAI';

const HomePage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gradient mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        <div className="md:col-span-1 lg:col-span-3">
          <LeadCard />
        </div>
        <div className="md:col-span-1 lg:col-span-4">
          <ShareMethodsCard />
        </div>
        <div className="md:col-span-2 lg:col-span-5">
          <TrafficChart />
        </div>
        <div className="md:col-span-2 lg:col-span-7">
          <RecentSessions />
        </div>
        <div className="md:col-span-2 lg:col-span-5">
          <CurrentBrands />
        </div>
        <div className="md:col-span-2 lg:col-span-12">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Chat Configuration</h2>
            <EmbedMattressAI />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;