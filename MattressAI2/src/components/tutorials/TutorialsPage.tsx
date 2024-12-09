import React from 'react';
import { Rocket } from 'lucide-react';
import TutorialCard from './TutorialCard';
import FAQSection from './FAQSection';

const TutorialsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold text-gradient">MattressAI Help and Accelerator Section</h1>
        <Rocket className="w-8 h-8 text-blue-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TutorialCard
          title="Book Live Sessions 📅"
          description="Schedule Live Sessions with MattressAI's Experts, who can assist with Setup, Strategy and Troubleshooting."
          image="/dashboard-preview.png"
          type="live"
        />

        <TutorialCard
          title="Tutorials and FAQs 🤖"
          description="Quickly learn how to use MattressAI's features with our easy to follow video tutorials from our Founders and Lead Developers."
          image="/faq-preview.png"
          type="tutorials"
        />
      </div>

      <FAQSection />
    </div>
  );
};

export default TutorialsPage;