// =============================================================================
// PRICING CONFIGURATION - Single Source of Truth
// =============================================================================
// Update pricing here and it will propagate across the entire site
// =============================================================================

export type PricingTier = {
  id: string;
  name: string;
  price: number | "custom";
  priceDisplay: string;
  period: string;
  description: string;
  target: string;
  features: string[];
  highlighted?: boolean;
  ctaText: string;
  badge?: string;
};

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    price: 149,
    priceDisplay: "$149",
    period: "/month",
    description: "Perfect for small furniture stores",
    target: "Small furniture stores, 1-2 locations",
    features: [
      "1 user seat",
      "100 AI-generated descriptions/mo",
      "50 social posts/mo",
      "20 furniture-specific templates",
      "500 products in catalog",
      "Email support",
    ],
    ctaText: "Get Started",
  },
  {
    id: "growth",
    name: "Growth",
    price: 399,
    priceDisplay: "$399",
    period: "/month",
    description: "For growing retailers & regional chains",
    target: "Growing retailers, regional chains",
    features: [
      "5 user seats",
      "500 AI generations/mo",
      "Unlimited social scheduling",
      "Full template library",
      "2,500 products",
      "Room visualization (basic)",
      "Email + chat support",
      "Analytics dashboard",
    ],
    highlighted: true,
    badge: "Most Popular",
    ctaText: "Get Started",
  },
  {
    id: "pro",
    name: "Pro",
    price: 799,
    priceDisplay: "$799",
    period: "/month",
    description: "For multi-location retailers",
    target: "Multi-location retailers, mid-market brands",
    features: [
      "15 user seats",
      "Unlimited AI generations",
      "Advanced room visualization + AR",
      "Full PIM capabilities",
      "10,000 products",
      "Multi-channel publishing",
      "White-label options",
      "Priority support",
      "Custom brand voice training",
    ],
    ctaText: "Get Started",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "custom",
    priceDisplay: "Custom",
    period: "pricing",
    description: "For large manufacturers & national chains",
    target: "Large furniture manufacturers, national chains",
    features: [
      "Unlimited seats",
      "API access",
      "Custom integrations (ERP, eComm)",
      "Dedicated success manager",
      "SLA guarantees",
      "Custom AI model training",
      "Advanced analytics & attribution",
    ],
    ctaText: "Contact Sales",
  },
];

// Additional seat pricing
export const ADDITIONAL_SEAT_PRICE = {
  min: 29,
  max: 49,
  display: "$29-49/mo per additional seat",
};

// Tool stack cost comparison
export const TOOL_STACK_COST = {
  min: 1650,
  max: 4300,
  display: "$1,650 - $4,300/mo",
  savings: "50-80%",
};

// Key value propositions
export const VALUE_PROPS = {
  noContracts: "Month-to-month. Cancel anytime.",
  noCommitment: "No contracts. No commitments. No guilt.",
  flexibility: "Stay because it works, not because you're locked in.",
  returnPolicy: "Leave whenever. We'll still be here if you come back.",
};

// Pricing FAQ
export const PRICING_FAQ = [
  {
    question: "Can I change plans anytime?",
    answer: "Yes! Upgrade or downgrade whenever you need. Changes take effect on your next billing cycle.",
  },
  {
    question: "Is there a contract or commitment?",
    answer: "Nope. Every plan is month-to-month. Cancel with one click. No retention calls, no guilt trips.",
  },
  {
    question: "What happens if I go over my limits?",
    answer: "We'll let you know before you hit limits and give you options to upgrade or wait until your next cycle.",
  },
  {
    question: "Do you offer annual pricing?",
    answer: "We can offer a discount for annual prepayment, but we don't require it. Month-to-month flexibility is the default.",
  },
];
