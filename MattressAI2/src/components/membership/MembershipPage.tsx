import React from 'react';
import CurrentTier from './CurrentTier';
import FreeTrial from './FreeTrial';
import PricingTiers from './PricingTiers';

const MembershipPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gradient">Membership</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <CurrentTier />
        <FreeTrial />
      </div>

      <PricingTiers />
    </div>
  );
};

export default MembershipPage;