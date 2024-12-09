import React, { useState } from 'react';
import { Check } from 'lucide-react';
import Card from '../ui/Card';

const PricingTiers = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Standard Plan',
      price: 199,
      features: [
        'AI-driven Lead Generation',
        'Instant customer contact & chat summary relay',
        'Unlimited Lead Lite chats',
      ],
      buttonText: 'Choose',
      buttonVariant: 'secondary',
    },
    {
      name: 'Premium Plan',
      price: 699,
      features: [
        'Everything from Standard',
        'Access to both Lite and Plus Assistants',
        'Up to 500 Lead Plus chats per month',
      ],
      buttonText: 'Modify',
      buttonVariant: 'gradient',
      highlighted: true,
    },
    {
      name: 'Unlimited Plan',
      price: 1699,
      features: [
        'Unlimited access to Assistants',
        'Access to both Lite and Plus Assistants',
        'No chat volume limitations',
      ],
      buttonText: 'Choose',
      buttonVariant: 'secondary',
    },
  ];

  return (
    <Card className="p-6">
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-lg overflow-hidden">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2.5 text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2.5 text-sm font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Yearly Billing
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`rounded-xl p-6 ${
              plan.highlighted
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                : 'bg-white border border-gray-200'
            }`}
          >
            <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
            <div className="flex items-baseline mb-6">
              <span className="text-3xl font-bold">${plan.price}</span>
              <span className="ml-2 text-sm opacity-80">/ Month</span>
            </div>

            <div className="space-y-4 mb-8">
              {plan.features.map((feature, featureIndex) => (
                <div key={featureIndex} className="flex items-center gap-3">
                  <Check className={`w-5 h-5 ${plan.highlighted ? 'text-white' : 'text-green-500'}`} />
                  <span className={plan.highlighted ? 'text-white' : 'text-gray-700'}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <button
              className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
                plan.buttonVariant === 'gradient'
                  ? 'bg-white text-blue-600 hover:bg-blue-50'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {plan.buttonText}
            </button>

            <div className="mt-4 text-center">
              <span className={`text-sm ${plan.highlighted ? 'text-white/80' : 'text-gray-500'}`}>
                Secure Payment via Stripe
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PricingTiers;