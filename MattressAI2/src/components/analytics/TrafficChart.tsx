import React from 'react';

const TrafficChart = () => {
  return (
    <div className="card p-6 overflow-hidden">
      <h2 className="text-lg font-semibold mb-6">Assistant Chat Traffic</h2>
      <div className="h-48 flex items-end">
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent"></div>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-full relative z-10"
          >
            <path
              d="M0,50 Q25,20 50,60 T100,30"
              fill="none"
              stroke="rgb(59, 130, 246)"
              strokeWidth="2"
              className="drop-shadow-md"
            />
            <path
              d="M0,50 Q25,20 50,60 T100,30"
              fill="url(#gradient)"
              strokeWidth="0"
              opacity="0.2"
            />
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(59, 130, 246)" />
                <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default TrafficChart;