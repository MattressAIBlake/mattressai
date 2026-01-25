// =============================================================================
// TOOL REPLACEMENT DATA - Single Source of Truth
// =============================================================================
// All the tools Furn replaces and their costs
// =============================================================================

export type ToolCategory = {
  id: string;
  name: string;
  tools: Tool[];
  furnReplacement: string;
};

export type Tool = {
  name: string;
  monthlyMin: number;
  monthlyMax: number;
  costDisplay: string;
  perUser?: boolean;
};

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: "content-creation",
    name: "Content Creation & Asset Management",
    furnReplacement: "Product graphics, social templates, marketing collateral, DAM",
    tools: [
      { name: "Canva Pro", monthlyMin: 15, monthlyMax: 30, costDisplay: "$15-30/user", perUser: true },
      { name: "Adobe Creative Cloud", monthlyMin: 55, monthlyMax: 85, costDisplay: "$55-85/user", perUser: true },
      { name: "Figma", monthlyMin: 15, monthlyMax: 45, costDisplay: "$15-45/user", perUser: true },
      { name: "Brandfolder/Bynder", monthlyMin: 200, monthlyMax: 800, costDisplay: "$200-800/mo" },
    ],
  },
  {
    id: "ai-content",
    name: "AI Content Generation",
    furnReplacement: "Product descriptions, ad copy, marketing content, lifestyle imagery",
    tools: [
      { name: "ChatGPT Plus", monthlyMin: 20, monthlyMax: 20, costDisplay: "$20/user", perUser: true },
      { name: "Jasper AI", monthlyMin: 49, monthlyMax: 125, costDisplay: "$49-125/user", perUser: true },
      { name: "Copy.ai", monthlyMin: 49, monthlyMax: 49, costDisplay: "$49/user", perUser: true },
      { name: "Midjourney/DALL-E", monthlyMin: 10, monthlyMax: 30, costDisplay: "$10-30/user", perUser: true },
    ],
  },
  {
    id: "social-media",
    name: "Social Media Management",
    furnReplacement: "Scheduling, publishing, visual planning, analytics",
    tools: [
      { name: "Hootsuite/Buffer", monthlyMin: 99, monthlyMax: 249, costDisplay: "$99-249/mo" },
      { name: "Later", monthlyMin: 25, monthlyMax: 80, costDisplay: "$25-80/mo" },
      { name: "Sprout Social", monthlyMin: 249, monthlyMax: 499, costDisplay: "$249-499/mo" },
    ],
  },
  {
    id: "email-marketing",
    name: "Email Marketing",
    furnReplacement: "Email campaigns, automation, newsletters, drip campaigns",
    tools: [
      { name: "Klaviyo", monthlyMin: 45, monthlyMax: 700, costDisplay: "$45-700/mo" },
      { name: "Mailchimp", monthlyMin: 20, monthlyMax: 350, costDisplay: "$20-350/mo" },
    ],
  },
  {
    id: "pim",
    name: "Product Information Management",
    furnReplacement: "Product data syndication, centralized product info, catalogs",
    tools: [
      { name: "Salsify", monthlyMin: 2000, monthlyMax: 2000, costDisplay: "$2,000+/mo" },
      { name: "Akeneo", monthlyMin: 500, monthlyMax: 2500, costDisplay: "$500-2,500/mo" },
      { name: "Plytix", monthlyMin: 300, monthlyMax: 900, costDisplay: "$300-900/mo" },
    ],
  },
  {
    id: "visualization",
    name: "Room Visualization & AR",
    furnReplacement: "Room visualization, 3D product views, AR configurators",
    tools: [
      { name: "Roomvo", monthlyMin: 200, monthlyMax: 1000, costDisplay: "$200-1,000/mo" },
      { name: "Cylindo", monthlyMin: 500, monthlyMax: 500, costDisplay: "Custom pricing" },
      { name: "Threekit", monthlyMin: 500, monthlyMax: 500, costDisplay: "$500+/mo" },
    ],
  },
  {
    id: "analytics",
    name: "Analytics & Attribution",
    furnReplacement: "Attribution, ROAS tracking, marketing analytics",
    tools: [
      { name: "Triple Whale", monthlyMin: 129, monthlyMax: 279, costDisplay: "$129-279/mo" },
      { name: "Northbeam", monthlyMin: 500, monthlyMax: 500, costDisplay: "$500+/mo" },
    ],
  },
];

// Flattened list of all tools for hero animation
export const ALL_TOOLS = TOOL_CATEGORIES.flatMap((category) =>
  category.tools.map((tool) => ({
    ...tool,
    category: category.name,
  }))
);

// Get a representative sample of tools for the hero animation (one from each category + some extras)
export const HERO_TOOLS = [
  { name: "Canva Pro", price: "$15-30/mo" },
  { name: "Adobe CC", price: "$55-85/mo" },
  { name: "ChatGPT Plus", price: "$20/mo" },
  { name: "Jasper AI", price: "$49-125/mo" },
  { name: "Midjourney", price: "$10-30/mo" },
  { name: "Hootsuite", price: "$99-249/mo" },
  { name: "Sprout Social", price: "$249-499/mo" },
  { name: "Klaviyo", price: "$45-700/mo" },
  { name: "Salsify", price: "$2,000+/mo" },
  { name: "Roomvo", price: "$200-1K/mo" },
  { name: "Triple Whale", price: "$129-279/mo" },
];

// Tool stack cost breakdown by category
export const COST_BREAKDOWN = [
  { category: "Content Creation", min: 300, max: 500 },
  { category: "AI Tools", min: 100, max: 200 },
  { category: "Social Media", min: 200, max: 400 },
  { category: "Email Marketing", min: 100, max: 300 },
  { category: "PIM", min: 500, max: 1500 },
  { category: "Visualization", min: 300, max: 1000 },
  { category: "Analytics", min: 150, max: 400 },
];

// Total monthly spend range
export const TOTAL_TOOL_SPEND = {
  min: COST_BREAKDOWN.reduce((sum, cat) => sum + cat.min, 0),
  max: COST_BREAKDOWN.reduce((sum, cat) => sum + cat.max, 0),
};

// Simplified replacement list for the comparison grid
export const REPLACEMENT_LIST = [
  {
    tools: "Canva Pro / Adobe CC / Figma",
    feature: "Product graphics & design tools",
  },
  {
    tools: "ChatGPT / Jasper AI / Copy.ai",
    feature: "AI product descriptions & copy",
  },
  {
    tools: "Midjourney / DALL-E",
    feature: "AI lifestyle imagery & mockups",
  },
  {
    tools: "Hootsuite / Buffer / Sprout",
    feature: "Social media scheduling & analytics",
  },
  {
    tools: "Klaviyo / Mailchimp",
    feature: "Email campaigns & automation",
  },
  {
    tools: "Salsify / Akeneo / Plytix",
    feature: "Product information management",
  },
  {
    tools: "Roomvo / Cylindo / Threekit",
    feature: "Room visualization & AR",
  },
  {
    tools: "Triple Whale / Northbeam",
    feature: "Analytics & attribution",
  },
];

// Key differentiators
export const DIFFERENTIATORS = [
  {
    title: "Furniture-Trained AI",
    description: "Knows dimensions, materials, room contexts — not generic AI that confuses your sectional for a horse.",
  },
  {
    title: "One Platform",
    description: "Eliminates 6-8 tool subscriptions. One login, one invoice, one place for everything.",
  },
  {
    title: "Industry Templates",
    description: "Pre-built for furniture lifestyle marketing. Not generic templates you have to customize.",
  },
  {
    title: "Room Visualization Built-In",
    description: "AR and room visualization included, not a $500/mo add-on.",
  },
  {
    title: "Marketplace Ready",
    description: "Export product data to Amazon, Wayfair, and marketplaces with one click.",
  },
];
