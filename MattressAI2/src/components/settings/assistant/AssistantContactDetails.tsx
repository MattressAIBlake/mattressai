import React from 'react';
import FormField from '../../ui/FormField';

const AssistantContactDetails = () => {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-6">Assistant Contact Details</h2>
      
      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <p className="text-gray-700">
          Add contact details to receive your Assistant's leads. These can often be linked directly to your
          CRM software. MattressAI will send sessions directly to you.
        </p>
      </div>

      <div className="space-y-6">
        <FormField
          label="Admin Mobile Number"
          description="Your assistant will send info to this number. If you have Podium, add that number."
          defaultValue="5738811864"
          type="tel"
        />

        <FormField
          label="Admin Email for Summary"
          description="Your assistant will send info to this email. Your store email is perfect."
          defaultValue="blake@themattressai.com"
          type="email"
        />

        <FormField
          label="Chat Redirect Links"
          description="When a chat session ends, send the user back to your landing page, deals page or elsewhere."
          defaultValue="https://calendly.com/blakemattressai"
          type="url"
        />
      </div>
    </div>
  );
};

export default AssistantContactDetails;