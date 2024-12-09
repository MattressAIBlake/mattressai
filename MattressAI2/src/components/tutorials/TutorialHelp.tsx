import React from 'react';
import { GraduationCap } from 'lucide-react';

const TutorialHelp = () => {
  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold mb-4">Need help?</h2>
      <p className="text-gray-600 mb-4">Check out our Tutorials Page.</p>
      <button className="btn-primary flex items-center gap-2">
        <GraduationCap className="h-5 w-5" />
        Tutorials
      </button>
    </div>
  );
};

export default TutorialHelp;