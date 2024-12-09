import React from 'react';
import { HelpCircle } from 'lucide-react';
import Card from '../ui/Card';

const FAQSection = () => {
  const faqs = [
    {
      question: 'What is MattressAI?',
      answer: 'MattressAI is a cutting-edge lead generation tool tailored specifically for brick and mortar mattress retailers. It utilizes AI powered assistants to help mattress businesses engage and nurture potential customers.'
    },
    {
      question: 'How do the MattressAI assistants work?',
      answer: `We offer two main AI assistants:
1. MattressAI Leads Lite Assistant: Focuses on generating leads by engaging with the general non-buying audience, asking questions about their preferences, and then collecting contact information for you.
2. MattressAI Leads Plus Assistant: Is designed to suggest the perfect mattress fitting to your customers based on their preferences. This assistant can also be customized to suggest specific brands you offer.`
    }
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="w-6 h-6 text-blue-500" />
        <h2 className="text-2xl font-bold">Frequently Asked Questions (FAQ's)</h2>
      </div>
      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div key={index} className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
            <p className="text-gray-600 whitespace-pre-line">{faq.answer}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default FAQSection;