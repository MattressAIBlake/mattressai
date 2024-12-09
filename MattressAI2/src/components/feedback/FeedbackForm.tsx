import React, { useState } from 'react';
import RatingGroup from './RatingGroup';
import Button from '../ui/Button';

const FeedbackForm = () => {
  const [formData, setFormData] = useState({
    overallExperience: 0,
    chatQuality: 0,
    chatConsistency: 0,
    chatSpeed: 0,
    feedback: '',
    suggestions: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Feedback submitted:', formData);
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RatingGroup
          title="Overall Experience"
          value={formData.overallExperience}
          onChange={(value) => setFormData({ ...formData, overallExperience: value })}
        />
        <RatingGroup
          title="Chat Quality"
          value={formData.chatQuality}
          onChange={(value) => setFormData({ ...formData, chatQuality: value })}
        />
        <RatingGroup
          title="Chat Consistency"
          value={formData.chatConsistency}
          onChange={(value) => setFormData({ ...formData, chatConsistency: value })}
        />
        <RatingGroup
          title="Chat Speed"
          value={formData.chatSpeed}
          onChange={(value) => setFormData({ ...formData, chatSpeed: value })}
        />
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Feedback</label>
          <textarea
            value={formData.feedback}
            onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
            className="w-full h-32 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Share your feedback..."
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Suggestions for Improvement
          </label>
          <textarea
            value={formData.suggestions}
            onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
            className="w-full h-32 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Share your suggestions..."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="gradient" className="px-8">
          Submit
        </Button>
      </div>
    </form>
  );
};

export default FeedbackForm;