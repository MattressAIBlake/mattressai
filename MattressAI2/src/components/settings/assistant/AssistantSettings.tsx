import React from 'react';
import FormField from '../../ui/FormField';

const AssistantSettings = () => {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-6">Assistant Settings</h2>
      
      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <p className="text-gray-700">
          Modify your Assistant's details and characteristics.
          These help the Assistant understand how it should
          act with your customers.
        </p>
      </div>

      <div className="space-y-6">
        <FormField
          label="Assistant Name"
          description="Give your assistant a name."
          defaultValue="MattressAI"
        />

        <FormField
          label="Company Description"
          description="Let the assistant know what the company does."
          defaultValue="You work at MattressAI. You communicate with shoppers and help them find the right mattress for them."
          multiline
          rows={4}
        />

        <FormField
          label="Assistant Persona"
          description="Tell the assistant how it should act."
          defaultValue="You are helpful and detailed. Latex is great for cooling and back issues."
          multiline
          rows={4}
        />

        <FormField
          label="Assistant Greeting"
          description="The initial message shown when a customer starts a session. If nothing is set MattressAI will create one using settings you have listed."
          defaultValue="I'm the AI Mattress Assistant from MattressAI, here to help you find the perfect mattress. Are you ready to begin? (Assuming you own/manage a mattress store)"
          multiline
          rows={4}
        />
      </div>
    </div>
  );
};

export default AssistantSettings;