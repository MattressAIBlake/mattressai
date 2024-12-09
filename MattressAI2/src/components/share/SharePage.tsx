import React from 'react';
import ShareHeader from './ShareHeader';
import ShareOptions from './ShareOptions';
import TrafficChart from '../analytics/TrafficChart';
import TutorialHelp from '../tutorials/TutorialHelp';

const SharePage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gradient mb-6">Share MattressAI</h1>
      <ShareHeader />
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <ShareOptions />
        </div>
        <div className="col-span-4">
          <TrafficChart />
        </div>
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <TutorialHelp />
        </div>
        <div className="col-span-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Tutorials</h2>
            <div className="space-y-4">
              <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse"></div>
              <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharePage;