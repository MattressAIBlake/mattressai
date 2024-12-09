import React from 'react';
import { Trophy } from 'lucide-react';
import FeedbackForm from './FeedbackForm';

const FeedbackPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gradient">Feedback</h1>
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
          <Trophy className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium">
            Submit Feedback for a chance to win a 3-Months Unlimited Plan for Free!
          </span>
        </div>
      </div>

      <div className="gradient-bg text-white p-6 rounded-xl">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">
            If you have any feedback or suggestions for MattressAI. Please let us know by filling out the form below.
          </p>
        </div>
      </div>

      <FeedbackForm />
    </div>
  );
};

export default FeedbackPage;