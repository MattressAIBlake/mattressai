// Core Account & User Types
export interface Account {
  id: string;
  retailerName: string;
  websiteUrl: string;
  numberOfLocations: number;
  onboardingStatus?: OnboardingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type OnboardingStatus = "not_started" | "in_progress" | "completed";

export type MemberRole = "owner" | "admin" | "manager" | "marketer" | "helper" | "viewer" | "designer" | "analyst";

export interface Member {
  id: string;
  accountId: string;
  userId: string;
  role: MemberRole;
  email: string;
  locationScopes?: string[]; // Array of location IDs this member can access
  createdAt: Date;
}

// Brand Pulse Lite Types (Phase 4)
export interface BrandMetric {
  id: string;
  accountId: string;
  // Time period
  startDate: Date;
  endDate: Date;
  // Blended metrics (proxies, not true dedup)
  blendedReach: number; // Sum of platform reaches (overestimate)
  blendedFrequency: number; // Weighted average frequency
  blendedImpressions: number; // Sum of impressions
  // Platform breakdown
  platformMetrics: Record<string, {
    reach: number;
    frequency: number;
    impressions: number;
  }>;
  // Attention proxies
  attentionMetrics: {
    videoViews: number;
    averageViewDuration?: number; // seconds
    videoCompletionRate?: number; // %
    engagementRate?: number; // (likes + comments + shares) / impressions
  };
  // Calculated at
  calculatedAt: Date;
}

export interface BrandAlert {
  id: string;
  accountId: string;
  alertType: "frequency_threshold" | "attention_threshold";
  threshold: number;
  currentValue: number;
  platform?: string;
  audienceId?: string;
  message: string;
  severity: "low" | "medium" | "high";
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  accountIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Brand Profile Types
export type VoiceAttribute = "friendly" | "upscale" | "local" | "playful" | "professional" | "casual" | "luxurious" | "family-oriented";

export type FocusCategory = "living room" | "bedroom" | "dining" | "mattresses" | "outdoor" | "office" | "home decor" | "lighting";

export interface BrandProfile {
  businessName: string;
  tagline: string;
  description: string;
  targetAudience: string;
  voiceAttributes: VoiceAttribute[];
  focusCategories: FocusCategory[];
  websiteUrl?: string;
  updatedAt: Date;
}

export interface BrandLegal {
  financingEnabled: boolean;
  financingDisclosure: string;
  warrantyEnabled: boolean;
  warrantySummary: string;
  warrantyFullText: string;
  updatedAt: Date;
}

export interface Guardrails {
  competitorNames: string[];
  bannedPhrases: string[];
  brandSafetyNotes: string;
  updatedAt: Date;
}

// Campaign Types
export type CampaignTypeOption = "holiday_sale" | "tax_refund" | "floor_model_clearance" | "new_collection" | "financing_push" | "custom";

export type MarketingChannel = "facebook" | "instagram" | "google_search" | "google_display" | "tiktok" | "pinterest" | "email";

export interface Campaign {
  id: string;
  accountId: string;
  name: string;
  campaignType: CampaignTypeOption;
  focusRooms: string[];
  focusCategories: FocusCategory[];
  channels: MarketingChannel[];
  startDate: Date;
  endDate: Date;
  budgetMin: number;
  budgetMax: number;
  campaignSummary: string;
  creativeBrief: string;
  audienceDescription: string;
  keyMessages: string[];
  status: "draft" | "active" | "paused" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

export interface CopyVariant {
  primaryText: string;
  headline: string;
  description: string;
  callToAction: string;
}

export interface ChannelPlan {
  id: string;
  campaignId: string;
  channel: MarketingChannel;
  copyVariants: CopyVariant[];
  targetingRecommendations: string;
  suggestedBudget: number;
  budgetReasoning: string;
  suggestedAssetIds: string[];
  createdAt: Date;
}

// Brand Pulse Lite Types (Phase 4)
export interface BrandMetric {
  id: string;
  accountId: string;
  // Time period
  startDate: Date;
  endDate: Date;
  // Blended metrics (proxies, not true dedup)
  blendedReach: number; // Sum of platform reaches (overestimate)
  blendedFrequency: number; // Weighted average frequency
  blendedImpressions: number; // Sum of impressions
  // Platform breakdown
  platformMetrics: Record<string, {
    reach: number;
    frequency: number;
    impressions: number;
  }>;
  // Attention proxies
  attentionMetrics: {
    videoViews: number;
    averageViewDuration?: number; // seconds
    videoCompletionRate?: number; // %
    engagementRate?: number; // (likes + comments + shares) / impressions
  };
  // Calculated at
  calculatedAt: Date;
}

export interface BrandAlert {
  id: string;
  accountId: string;
  alertType: "frequency_threshold" | "attention_threshold";
  threshold: number;
  currentValue: number;
  platform?: string;
  audienceId?: string;
  message: string;
  severity: "low" | "medium" | "high";
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

// Integration Types
// Note: These values must match what's stored in Firestore
export type IntegrationType = "meta_ads" | "google_ads" | "tiktok_ads" | "google_analytics" | "shopify" | "storis" | "furniture_wizard" | "sftp" | "pinterest";

export type IntegrationStatus = "connected" | "disconnected" | "error" | "pending";

export interface Integration {
  id: string;
  accountId: string;
  type: IntegrationType;
  status: IntegrationStatus;
  externalAccountId: string;
  externalAccountName?: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  errorMessage?: string;
  lastSyncAt?: Date;
  // For pending Google Ads integrations, contains list of accessible customers
  accessibleCustomers?: Array<{
    customerId: string;
    resourceName: string;
    descriptiveName?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Performance Metrics
export interface PerformanceMetrics {
  id: string;
  accountId: string;
  integrationId: string;
  integrationType: IntegrationType;
  date: Date;
  externalCampaignId: string;
  externalCampaignName: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  roas: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  createdAt: Date;
}

// Brand Pulse Lite Types (Phase 4)
export interface BrandMetric {
  id: string;
  accountId: string;
  // Time period
  startDate: Date;
  endDate: Date;
  // Blended metrics (proxies, not true dedup)
  blendedReach: number; // Sum of platform reaches (overestimate)
  blendedFrequency: number; // Weighted average frequency
  blendedImpressions: number; // Sum of impressions
  // Platform breakdown
  platformMetrics: Record<string, {
    reach: number;
    frequency: number;
    impressions: number;
  }>;
  // Attention proxies
  attentionMetrics: {
    videoViews: number;
    averageViewDuration?: number; // seconds
    videoCompletionRate?: number; // %
    engagementRate?: number; // (likes + comments + shares) / impressions
  };
  // Calculated at
  calculatedAt: Date;
}

export interface BrandAlert {
  id: string;
  accountId: string;
  alertType: "frequency_threshold" | "attention_threshold";
  threshold: number;
  currentValue: number;
  platform?: string;
  audienceId?: string;
  message: string;
  severity: "low" | "medium" | "high";
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export interface DashboardMetrics {
  totalSpend: number;
  totalRevenue: number;
  totalConversions: number;
  averageROAS: number;
  topPerformingCampaigns: Array<{
    id: string;
    name: string;
    revenue: number;
    roas: number;
  }>;
  channelBreakdown: Array<{
    channel: MarketingChannel;
    spend: number;
    revenue: number;
    roas: number;
  }>;
}

// Monthly Plan Types
export interface CampaignSlot {
  weekNumber: number;
  weekStartDate: Date;
  weekEndDate: Date;
  campaignId: string;
  campaignName: string;
  campaignType: CampaignTypeOption;
  focusCategories: FocusCategory[];
  estimatedBudget: number;
  rationale?: string;
}

export interface MonthlyPlanBrief {
  focusAreas: string[]; // 1-3 focus areas
  personas?: string[]; // Target personas/audiences
  products?: string[]; // Specific products to promote
  offers?: string[]; // Promotions, sales, offers
  channels?: MarketingChannel[]; // Preferred marketing channels
  budgetRange?: { min: number; max: number }; // Budget range in dollars
  goal?: string; // Primary goal/KPI (e.g., "Increase sales by 20%", "Launch new collection")
  constraints?: string; // Timing constraints, special considerations
  notes?: string; // Additional notes or context
}

export interface MonthlyPlan {
  id: string;
  accountId: string;
  month: number;
  year: number;
  focusAreas: string[];
  summary: string;
  campaignSlots: CampaignSlot[];
  status: "draft" | "active" | "completed";
  brief?: MonthlyPlanBrief; // Optional structured brief from chat input
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlyPlanInput {
  month: number;
  year: number;
  focusAreas: string[]; // Required for backward compatibility
  brandProfile: BrandProfile;
  brandLegal: BrandLegal;
  guardrails: Guardrails;
  brief?: MonthlyPlanBrief; // Optional full brief from chat input
  budgetRange?: { min: number; max: number };
  existingCampaigns?: Array<{
    id: string;
    name: string;
    type: CampaignTypeOption;
  }>;
}

export interface MonthlyPlanOutput {
  summary: string;
  campaignSlots: Array<{
    weekNumber: number;
    weekStartDate: string;
    weekEndDate: string;
    campaignName: string;
    campaignType: CampaignTypeOption;
    focusCategories: FocusCategory[];
    estimatedBudget: number;
    rationale: string;
  }>;
}

// Asset Types
export type AssetType = "image" | "video";

export interface Asset {
  id: string;
  accountId: string;
  storagePath: string;
  downloadUrl: string;
  thumbnailUrl?: string;
  type: AssetType;
  filename: string;
  fileSize: number;
  mimeType: string;
  rooms: string[];
  categories: string[];
  styleTags: string[];
  uploadedByUserId: string;
  // AI Analysis fields
  roomType?: string;
  style?: string;
  qualityScore?: number;
  dominantColors?: string[];
  autoTags?: string[];
  predictedPerformanceScore?: number;
  aiAnalyzedAt?: Date;
  // Presti (Google-powered) analysis snapshot
  prestiAnalysis?: unknown;
  prestiAnalyzedAt?: Date;
  // Collaboration fields
  likeCount?: number;
  commentCount?: number;
  lastCommentAt?: Date;
  allTags?: string[]; // Normalized union of rooms/categories/styleTags/autoTags
  createdAt: Date;
  updatedAt: Date;
}

// AI Generation Types
export interface CampaignConceptInput {
  brandProfile: BrandProfile;
  brandLegal: BrandLegal;
  guardrails: Guardrails;
  focusRooms: string[];
  focusCategories: FocusCategory[];
  campaignType: CampaignTypeOption;
  budgetRange: { min: number; max: number };
  targetAudience?: string;
}

export interface CampaignConceptOutput {
  campaignName: string;
  campaignSummary: string;
  creativeBrief: string;
  audienceDescription: string;
  keyMessages: string[];
  suggestedChannels: MarketingChannel[];
  budgetRecommendation: { min: number; max: number };
  budgetReasoning: string;
}

export interface ChannelCopyInput {
  brandProfile: BrandProfile;
  brandLegal: BrandLegal;
  guardrails: Guardrails;
  channel: MarketingChannel;
  campaignSummary: string;
  creativeBrief: string;
  budgetHint?: string;
  availableAssets?: Array<{
    id: string;
    filename: string;
    type: AssetType;
    rooms: string[];
    styleTags: string[];
    categories: string[];
  }>;
}

export interface ChannelCopyOutput {
  channel: MarketingChannel;
  copyVariants: CopyVariant[];
}

// Meta Ads Types
export interface MetaTargeting {
  ageMin?: number;
  ageMax?: number;
  genders?: number[];
  locations?: Array<{
    key: string;
    name: string;
  }>;
  interests?: string[];
  behaviors?: string[];
  customAudiences?: string[];
  lookalikeAudiences?: string[];
}

export interface MetaAdSet {
  name: string;
  targeting: MetaTargeting;
  optimizationGoal: string;
  billingEvent: string;
  bidAmount?: number;
  dailyBudget?: number;
  lifetimeBudget?: number;
  startTime: Date;
  endTime?: Date;
}

export interface MetaDeployment {
  campaignId: string;
  channelPlanId: string;
  adSets: MetaAdSet[];
  creative: {
    primaryText: string;
    headline: string;
    description: string;
    callToAction: string;
    imageUrl?: string;
    videoId?: string;
  };
}

// Image Editing Types
export type ImageEditAction =
  // Legacy/stub actions (older naming)
  | "remove_background"
  | "change_room"
  | "change_style"
  | "add_furniture"
  | "remove_object"
  // Current UI/actions
  | "background_swap"
  | "style_transfer"
  | "enhance"
  | "upscale"
  // Presti extended actions
  | "smart_crop"
  | "export_platform"
  | "generate_ad_creative"
  | "custom_edit";

export interface ImageEditRequest {
  accountId: string;
  assetId: string;
  action: ImageEditAction;
  roomType?: string;
  style?: string;
  enhancementLevel?: number;
}

export interface ImageEditResult {
  success: boolean;
  editedImageUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

// Buyer Persona Types
export interface BuyerPersona {
  name: string;
  age: string;
  income: string;
  lifestyle: string;
  motivations: string[];
  painPoints: string[];
  shoppingBehavior: string;
  preferredChannels: string[];
}

// Competitor Scan Types
export interface CompetitorAd {
  id: string;
  platform: string;
  adTitle: string;
  adText: string;
  callToAction: string;
  imageUrl?: string;
  landingPageUrl?: string;
  firstSeenDate?: Date;
  lastSeenDate?: Date;
}

export interface CompetitorScan {
  id: string;
  accountId: string;
  competitorName: string;
  region: string;
  result: {
    competitorName: string;
    region: string;
    scannedAt: Date;
    ads: CompetitorAd[];
    messagingHooks: string[];
    commonOffers: string[];
    aiSummary: string;
  };
  createdAt: Date;
}

// Brand Pulse Lite Types (Phase 4)
export interface BrandMetric {
  id: string;
  accountId: string;
  // Time period
  startDate: Date;
  endDate: Date;
  // Blended metrics (proxies, not true dedup)
  blendedReach: number; // Sum of platform reaches (overestimate)
  blendedFrequency: number; // Weighted average frequency
  blendedImpressions: number; // Sum of impressions
  // Platform breakdown
  platformMetrics: Record<string, {
    reach: number;
    frequency: number;
    impressions: number;
  }>;
  // Attention proxies
  attentionMetrics: {
    videoViews: number;
    averageViewDuration?: number; // seconds
    videoCompletionRate?: number; // %
    engagementRate?: number; // (likes + comments + shares) / impressions
  };
  // Calculated at
  calculatedAt: Date;
}

export interface BrandAlert {
  id: string;
  accountId: string;
  alertType: "frequency_threshold" | "attention_threshold";
  threshold: number;
  currentValue: number;
  platform?: string;
  audienceId?: string;
  message: string;
  severity: "low" | "medium" | "high";
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

// Experiment Types
export type ExperimentStatus = "draft" | "running" | "paused" | "completed";

export interface ExperimentVariant {
  id: string;
  name: string;
  copy: CopyVariant;
  assetId?: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roas: number;
}

export interface Experiment {
  id: string;
  accountId: string;
  campaignId: string;
  campaignName: string;
  channel: MarketingChannel;
  name: string;
  description: string;
  status: ExperimentStatus;
  variants: ExperimentVariant[];
  impressionsThreshold: number;
  confidenceLevel: number;
  startDate: Date;
  endDate?: Date;
  winnerVariantId?: string;
  winnerSelectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Social Media Types
export interface SocialMediaPost {
  id: string;
  accountId: string;
  platform: 'facebook' | 'instagram' | 'tiktok';
  content: {
    text: string;
    imageUrls?: string[]; // Legacy: kept for backward compatibility
    videoUrl?: string; // Legacy: kept for backward compatibility
    linkUrl?: string;
    hashtags?: string[];
    // New: asset ID references for editing support
    imageAssetIds?: string[];
    videoAssetId?: string;
  };
  scheduledFor?: Date; // Optional for drafts
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  externalPostId?: string;
  publishedAt?: Date;
  error?: string; // Error message if status is 'failed'
  createdAt: Date;
  updatedAt: Date;
}

// Email/SMS Types
export interface EmailSMSCampaign {
  id: string;
  accountId: string;
  type: 'email' | 'sms';
  name: string;
  subject?: string;
  content: {
    text: string;
    html?: string;
    linkUrl?: string;
  };
  segment?: {
    name: string;
    criteria: Record<string, any>;
  };
  scheduledFor?: Date;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  sentCount?: number;
  deliveredCount?: number;
  openedCount?: number;
  clickedCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailSMSFlow {
  id: string;
  accountId: string;
  name: string;
  type: 'abandoned_cart' | 'post_purchase' | 'winback' | 'financing_followup' | 'delivery_tips' | 'review_request' | 'custom';
  trigger: {
    event: string;
    conditions?: Record<string, any>;
  };
  steps: Array<{
    order: number;
    delay?: number;
    type: 'email' | 'sms';
    subject?: string;
    content: {
      text: string;
      html?: string;
    };
  }>;
  status: 'active' | 'paused' | 'draft';
  stats?: {
    triggered: number;
    sent: number;
    delivered: number;
    opened?: number;
    clicked?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Store Location Types
export interface StoreLocation {
  id: string;
  accountId: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  radius?: number;
  hours?: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  phone?: string;
  email?: string;
  localPromos?: Array<{
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
  }>;
  inventoryHighlights?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Lead Types
export interface Lead {
  id: string;
  accountId: string;
  source: 'ad_click' | 'website_form' | 'phone_call' | 'walk_in' | 'referral' | 'other';
  campaignId?: string;
  locationId?: string;
  contactInfo: {
    name: string;
    phone?: string;
    email?: string;
  };
  interest?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Offline Conversion Types
export interface OfflineConversion {
  id: string;
  accountId: string;
  campaignId?: string;
  locationId?: string;
  customerId?: string;
  value: number;
  currency: string;
  conversionDate: Date;
  items?: Array<{
    sku: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  createdAt: Date;
}

// Brand Pulse Lite Types (Phase 4)
export interface BrandMetric {
  id: string;
  accountId: string;
  // Time period
  startDate: Date;
  endDate: Date;
  // Blended metrics (proxies, not true dedup)
  blendedReach: number; // Sum of platform reaches (overestimate)
  blendedFrequency: number; // Weighted average frequency
  blendedImpressions: number; // Sum of impressions
  // Platform breakdown
  platformMetrics: Record<string, {
    reach: number;
    frequency: number;
    impressions: number;
  }>;
  // Attention proxies
  attentionMetrics: {
    videoViews: number;
    averageViewDuration?: number; // seconds
    videoCompletionRate?: number; // %
    engagementRate?: number; // (likes + comments + shares) / impressions
  };
  // Calculated at
  calculatedAt: Date;
}

export interface BrandAlert {
  id: string;
  accountId: string;
  alertType: "frequency_threshold" | "attention_threshold";
  threshold: number;
  currentValue: number;
  platform?: string;
  audienceId?: string;
  message: string;
  severity: "low" | "medium" | "high";
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

// Furniture-Specific Types
export interface Product {
  id: string;
  accountId: string;
  sku: string;
  name: string;
  category: FocusCategory;
  room?: string;
  price: number;
  cost?: number; // For margin calculation
  margin?: number; // Calculated margin percentage
  leadTime?: number; // Days
  inStock?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Catalog Types (Phase 1A)
export type CatalogSourceType = "shopify" | "storis" | "furniture_wizard" | "csv" | "sftp" | "api";

export interface Catalog {
  id: string;
  accountId: string;
  name: string;
  sourceType: CatalogSourceType;
  sourceConfig: {
    integrationId?: string; // For Shopify/API sources
    sftpHost?: string;
    sftpPath?: string;
    schedule?: "hourly" | "daily" | "weekly";
    lastSyncAt?: Date;
    lastSyncStatus?: "success" | "error" | "partial";
    lastSyncError?: string;
  };
  fieldMapping: Record<string, string>; // ERP field → canonical field
  normalizationRules?: {
    finishSynonyms?: Record<string, string[]>;
    colorFamilies?: Record<string, string[]>;
    styleTaxonomy?: Record<string, string>;
  };
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogProduct {
  id: string; // PrestiCMO ID
  catalogId: string;
  accountId: string;
  // Identifiers
  sku: string;
  erpProductId?: string; // STORIS/FW native ID
  upc?: string;
  // Core attributes
  name: string;
  description?: string;
  category: FocusCategory; // "sofas", "dining", "bedroom", etc.
  room?: string; // "living_room", "dining_room", "bedroom", etc.
  // Variants (normalized)
  variants: CatalogProductVariant[];
  // Media
  primaryImageUrl?: string;
  imageUrls: string[];
  videoUrls?: string[];
  // Visual Assets (AI-generated product visuals)
  visualAssets?: {
    source?: { assetId: string; url: string; storagePath: string; uploadedAt: Date };
    silhouettes?: { assetId: string; url: string; storagePath: string; generatedAt: Date };
    enhancedSilhouettes?: { assetId: string; url: string; storagePath: string; generatedAt: Date };
    lifestyleImages?: { assetId: string; url: string; storagePath: string; generatedAt: Date };
    dimensionSilhouettes?: { assetId: string; url: string; storagePath: string; generatedAt: Date };
  };
  // Dimensions (normalized)
  dimensions?: {
    width?: number; // inches
    height?: number;
    depth?: number;
    weight?: number; // lbs
  };
  // Style/material (normalized)
  style?: string; // "modern", "traditional", "transitional", etc.
  material?: string; // "leather", "fabric", "wood", etc.
  finish?: string; // Normalized finish name
  color?: string; // Normalized color family
  // Pricing (v1: basic; Phase 2: promos/financing)
  basePrice?: number;
  currency?: string;
  // Metadata
  tags: string[];
  erpMetadata?: Record<string, any>; // Raw ERP fields for reference
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date;
}

export interface CatalogProductVariant {
  id: string;
  sku: string;
  erpVariantId?: string;
  // Variant attributes (normalized)
  fabric?: string;
  finish?: string;
  color?: string;
  size?: string; // "queen", "king", "sectional_3pc", etc.
  configuration?: string; // For sectionals, modular pieces
  // Pricing
  price?: number;
  // Availability (Phase 2)
  inStock?: boolean;
  leadTime?: number; // days
  // Media (variant-specific images)
  imageUrls?: string[];
}

export interface CatalogSyncJob {
  id: string;
  catalogId: string;
  accountId: string;
  status: "pending" | "running" | "completed" | "failed" | "pending_approval";
  sourceType: string;
  recordsProcessed?: number;
  recordsCreated?: number;
  recordsUpdated?: number;
  recordsFailed?: number;
  errors?: Array<{ row: number; field?: string; message: string }>;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  // Staged changes (Phase 4) - changes that require approval before applying
  stagedChanges?: {
    productId: string;
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  approvalId?: string; // Link to approval request if staged changes exist
}

export interface CatalogVersion {
  id: string;
  catalogId: string;
  accountId: string;
  version: number;
  snapshot: {
    productCount: number;
    variantCount: number;
    productIds: string[];
  };
  diff?: {
    productsAdded: string[];
    productsRemoved: string[];
    productsModified: string[];
  };
  createdAt: Date;
  createdBy: string;
}

// Template Types (Phase 1C)
export type TemplateLayerType = "image" | "text" | "shape" | "logo" | "product_image" | "background";
export type TemplateStatus = "draft" | "approved" | "archived";
export type TemplatePlatform = "pinterest" | "meta" | "google" | "tiktok";

export interface TemplateLayer {
  id: string;
  type: TemplateLayerType;
  name: string;
  // Position/size (relative to template canvas)
  x: number; // 0-1 (percentage)
  y: number;
  width: number;
  height: number;
  // Style
  style?: {
    backgroundColor?: string;
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    borderRadius?: number;
    opacity?: number;
  };
  // Binding (optional)
  bindingId?: string; // References TemplateBinding.id
  // Constraints
  locked?: boolean; // Brand lock
  maxLines?: number; // For text truncation
  overflow?: "truncate" | "ellipsis" | "wrap" | "scale";
  // Z-index
  zIndex: number;
  // Content (for text layers, image URLs, etc.)
  content?: string;
  imageUrl?: string;
  // AI image generation config (for per-variant image layers)
  ai?: {
    kind: "image";
    scope: "variant";
    provider?: "imagen" | "gemini";
    promptTemplate: string;
  };
}

export interface TemplateBinding {
  id: string;
  layerId: string;
  catalogField: string; // "product.name", "product.price", "variant.fabric", etc.
  transform?: string; // "UPPERCASE", "FORMAT_PRICE", "TRUNCATE_50", etc.
  fallback?: string; // Default if field missing
}

export interface PlacementVariant {
  id: string;
  platform: TemplatePlatform;
  placement: string; // "feed", "story", "shopping", "search", etc.
  aspectRatio: string; // "1:1", "16:9", "9:16", "4:5", etc.
  dimensions: {
    width: number;
    height: number;
  };
  // Safe areas (padding rules)
  safeArea?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  // Layer adjustments for this placement
  layerAdjustments?: Array<{
    layerId: string;
    scale?: number;
    position?: { x: number; y: number };
    visible?: boolean;
  }>;
}

export interface Template {
  id: string;
  accountId: string;
  name: string;
  description?: string;
  category?: string; // "product_ad", "promo_banner", "lifestyle_scene"
  tags?: string[]; // AI-generated and user tags for search/filtering
  // Layers (design structure)
  layers: TemplateLayer[];
  // Brand locks (governance)
  brandLocks: {
    logoLocked: boolean;
    logoPosition?: "top_left" | "top_right" | "bottom_left" | "bottom_right" | "center";
    colorLocked: boolean;
    brandColors?: string[]; // Hex codes
    fontLocked: boolean;
    brandFonts?: string[];
    legalLocked: boolean;
    legalText?: string; // Required disclaimer
    legalPosition?: "bottom" | "overlay";
  };
  // Placement variants (auto-resize rules)
  placementVariants: PlacementVariant[];
  // Bindings (catalog → template fields)
  bindings: TemplateBinding[];
  // Status
  status: TemplateStatus;
  approvedBy?: string;
  approvedAt?: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface TemplateRenderJob {
  id: string;
  templateId: string;
  accountId: string;
  catalogId: string;
  // Product/variant selection
  productFilters?: {
    category?: FocusCategory[];
    room?: string[];
    style?: string[];
    tags?: string[];
  };
  productIds?: string[]; // Specific products
  variantIds?: string[]; // Specific variants
  // Placement selection
  placements: Array<{
    platform: string;
    placement: string;
  }>;
  // Status
  status: "pending" | "rendering" | "completed" | "failed";
  totalVariants?: number;
  variantsRendered?: number;
  variantsFailed?: number;
  errors?: string[];
  // Output
  assetIds: string[]; // Generated assets
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  createdBy: string;
}

// Catalog Campaign Types (Epic C)
export type CatalogCampaignStatus = "draft" | "active" | "paused" | "completed";
export type CatalogCampaignVariantStatus = "draft" | "live" | "paused" | "archived";

export interface CatalogCampaign {
  id: string;
  accountId: string;
  name: string;
  description?: string;
  // Catalog selection
  catalogId: string;
  productFilters: {
    category?: FocusCategory[];
    room?: string[];
    style?: string[];
    tags?: string[];
    priceRange?: { min: number; max: number };
  };
  // Template selection
  templateId: string;
  // Promo/financing (Phase 2: pull from Promo system)
  promo?: {
    type: "percentage_off" | "dollar_off" | "financing";
    value: number;
    financingTerms?: string;
  };
  // Targeting
  locations?: string[]; // Location IDs for store-specific messaging
  // Channels
  channels: MarketingChannel[];
  // Status
  status: CatalogCampaignStatus;
  // Performance (aggregated)
  totalSpend?: number;
  totalRevenue?: number;
  roas?: number;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CatalogCampaignVariant {
  id: string;
  catalogCampaignId: string;
  accountId: string;
  // Source
  productId: string;
  variantId?: string;
  templateId: string;
  placement: {
    platform: string;
    placement: string;
  };
  // Generated asset (optional in Phase 1, will be populated in Phase 2)
  assetId?: string;
  // Published ad IDs (cross-platform mapping)
  publishedAdIds?: Record<string, string>; // { "meta": "ad_123", "pinterest": "pin_456" }
  // Performance (aggregated from PerformanceMetrics)
  impressions?: number;
  clicks?: number;
  spend?: number;
  revenue?: number;
  roas?: number;
  // Status
  status: CatalogCampaignVariantStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Promo {
  id: string;
  accountId: string;
  name: string;
  type: "percentage_off" | "dollar_off" | "free_shipping" | "financing" | "bundle" | "clearance";
  value: number; // Percentage or dollar amount
  categories?: FocusCategory[];
  locations?: string[]; // Location IDs
  startDate: Date;
  endDate: Date;
  financingTerms?: string; // Legacy: e.g., "0% APR for 12 months"
  financingTermsDetailed?: {
    apr: number; // 0, 5.99, etc.
    termMonths: number; // 12, 24, 36, etc.
    minPurchase?: number; // $500, etc.
    disclaimer?: string; // "Subject to credit approval"
  };
  deliveryTerms?: {
    leadTimeDays?: number; // 14, 21, etc.
    freeShipping?: boolean;
    storePickup?: boolean;
    deliveryMessage?: string; // "Ships in 2-3 weeks"
  };
  warrantyIncluded?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomSet {
  id: string;
  accountId: string;
  name: string; // e.g., "Modern Living Room"
  room: string; // "living_room", "dining_room", etc.
  style: string; // "modern", "traditional", etc.
  // Products in set
  products: Array<{
    productId: string;
    variantId?: string;
    position?: { x: number; y: number }; // For scene layout
  }>;
  // Generated scene
  sceneImageUrl?: string; // AI-generated room-set image
  // Metadata
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Ad Launch Lifecycle Types
export type LaunchStatus = "draft" | "ready_for_review" | "approved" | "publishing" | "live" | "optimizing" | "completed" | "failed" | "cancelled";

export interface AdLaunch {
  id: string;
  accountId: string;
  campaignId: string;
  campaignName: string;
  channels: MarketingChannel[];
  status: LaunchStatus;
  channelPlans: Array<{
    channelPlanId: string;
    channel: MarketingChannel;
    copyVariants: CopyVariant[];
    suggestedBudget: number;
    suggestedAssetIds: string[];
  }>;
  selectedAssets: Array<{
    assetId: string;
    channel: MarketingChannel;
  }>;
  budgets: Record<MarketingChannel, {
    daily?: number;
    lifetime?: number;
    currency: string;
  }>;
  targeting: Record<MarketingChannel, {
    locations?: string[];
    ageMin?: number;
    ageMax?: number;
    genders?: string[];
    interests?: string[];
    behaviors?: string[];
  }>;
  adObjects?: Array<{
    objectId: string;
    platform: string;
    platformObjectId: string;
    objectType: "campaign" | "adset" | "ad" | "ad_group" | "ad_group_ad";
    channel: MarketingChannel;
  }>;
  submittedBy?: string;
  submittedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  publishedAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdObject {
  id: string;
  accountId: string;
  // Source (what created this)
  launchId?: string; // AdLaunch ID
  catalogCampaignId?: string; // CatalogCampaign ID
  // Platform
  platform: "meta" | "google" | "pinterest" | "tiktok" | "google_ads" | "tiktok_ads"; // Support both old and new naming
  objectType: "campaign" | "adset" | "ad" | "creative" | "catalog" | "ad_group" | "ad_group_ad";
  platformObjectId: string; // Native platform ID
  // Metadata
  name?: string;
  status?: string; // Platform-native status
  channel?: MarketingChannel; // For backward compatibility
  // Performance (cached, updated via sync)
  performance?: {
    impressions?: number;
    clicks?: number;
    spend?: number;
    revenue?: number;
    lastSyncedAt?: Date;
  };
  // Lineage (for creative insights)
  templateId?: string;
  productId?: string;
  variantId?: string;
  assetId?: string;
  // Element features (for element-level insights)
  elementFeatures?: {
    headline?: string;
    cta?: string;
    background?: string;
    promoBadge?: string;
  };
  // Legacy fields for backward compatibility
  metadata?: Record<string, any>;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLogEvent {
  id: string;
  accountId: string;
  userId: string;
  userEmail?: string;
  action: string;
  resourceType: "campaign" | "launch" | "ad_object" | "approval" | "optimization" | "integration";
  resourceId: string;
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// Legacy Approval type for launch-specific approvals (backward compatible)
export interface Approval {
  id: string;
  accountId: string;
  launchId: string;
  requestedBy: string;
  requestedByEmail?: string;
  requestedAt: Date;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reviewedBy?: string;
  reviewedByEmail?: string;
  reviewedAt?: Date;
  comments?: string;
  changeRequests?: Array<{
    field: string;
    currentValue: any;
    requestedValue: any;
    reason?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Generalized ApprovalRequest for templates, catalogs, campaigns, etc.
export interface ApprovalRequest {
  id: string;
  accountId: string;
  // Approval kind: "launch" (legacy) or "resource" (new)
  approvalKind: "launch" | "resource";
  // Resource being approved
  resourceType: "template" | "catalog" | "catalogSync" | "campaign" | "launch";
  resourceId: string;
  // Legacy support: launchId for backward compatibility
  launchId?: string;
  // Change details
  changeType: "create" | "update" | "delete" | "publish" | "approve" | "rollback";
  changeSummary: string; // Human-readable summary
  changeDiff?: Record<string, { old: any; new: any }>; // Structured before/after (bounded size)
  // Action descriptor for execution (validated server-side)
  action?: {
    type: string; // e.g., "template.approve", "catalog.rollbackToVersion", "catalog.applyStagedSync"
    params?: Record<string, any>;
  };
  // Approval workflow
  status: "pending" | "approved" | "rejected" | "cancelled";
  requestedBy: string;
  requestedByEmail?: string;
  requestedAt: Date;
  reviewedBy?: string;
  reviewedByEmail?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  comments?: string;
  changeRequests?: Array<{
    field: string;
    currentValue: any;
    requestedValue: any;
    reason?: string;
  }>;
  // Metadata
  priority?: "low" | "medium" | "high";
  expiresAt?: Date; // Auto-reject if not approved by this date
  createdAt: Date;
  updatedAt: Date;
}

// Asset Collaboration Types
export interface AssetLike {
  id: string;
  assetId: string;
  accountId: string;
  userId: string;
  createdAt: Date;
}

// Brand Pulse Lite Types (Phase 4)
export interface BrandMetric {
  id: string;
  accountId: string;
  // Time period
  startDate: Date;
  endDate: Date;
  // Blended metrics (proxies, not true dedup)
  blendedReach: number; // Sum of platform reaches (overestimate)
  blendedFrequency: number; // Weighted average frequency
  blendedImpressions: number; // Sum of impressions
  // Platform breakdown
  platformMetrics: Record<string, {
    reach: number;
    frequency: number;
    impressions: number;
  }>;
  // Attention proxies
  attentionMetrics: {
    videoViews: number;
    averageViewDuration?: number; // seconds
    videoCompletionRate?: number; // %
    engagementRate?: number; // (likes + comments + shares) / impressions
  };
  // Calculated at
  calculatedAt: Date;
}

export interface BrandAlert {
  id: string;
  accountId: string;
  alertType: "frequency_threshold" | "attention_threshold";
  threshold: number;
  currentValue: number;
  platform?: string;
  audienceId?: string;
  message: string;
  severity: "low" | "medium" | "high";
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export interface AssetComment {
  id: string;
  assetId: string;
  accountId: string;
  text: string;
  createdByUserId: string;
  createdAt: Date;
  deletedAt?: Date;
  deletedByUserId?: string;
}

export interface Album {
  id: string;
  accountId: string;
  name: string;
  description?: string;
  visibility: "team" | "private";
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlbumAsset {
  id: string;
  accountId: string;
  albumId: string;
  assetId: string;
  addedByUserId: string;
  addedAt: Date;
}

// Activity Logging Types
export type ActorType = "ai" | "user";

export type LogType =
  | "campaign_generated"
  | "campaign_updated"
  | "campaign_deleted"
  | "campaign_published"
  | "campaign_publish_failed"
  | "channel_generated"
  | "channel_updated"
  | "monthly_plan_generated"
  | "monthly_plan_updated"
  | "monthly_plan_deleted"
  | "insight_generated"
  | "ugc_content_generated"
  | "integration_connected"
  | "integration_disconnected"
  | "integration_synced"
  | "asset_uploaded"
  | "settings_updated"
  | "asset_liked"
  | "asset_commented"
  | "album_created"
  | "album_asset_added"
  | "catalog_created"
  | "catalog_updated"
  | "catalog_deleted"
  | "catalog_synced"
  | "template_created"
  | "template_updated"
  | "template_deleted"
  | "template_approved"
  | "template_rendered"
  | "catalog_campaign_created"
  | "catalog_campaign_updated"
  | "catalog_campaign_deleted"
  | "catalog_campaign_published"
  | "catalog_campaign_synced"
  | "pinterest_catalog_uploaded"
  | "pinterest_catalog_synced"
  | "promo_created"
  | "promo_updated"
  | "promo_deleted"
  | "room_set_created"
  | "room_set_updated"
  | "room_set_deleted"
  | "room_set_scene_generated"
  | "video_generation_started"
  | "video_generation_completed"
  | "recommendations_viewed";

export interface ActivityLog {
  id: string;
  accountId: string;
  actorType: ActorType;
  actorUserId?: string;
  logType: LogType;
  message: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// Creative Insights Types (Phase 3)
export type CreativeInsightDimension = "template" | "category" | "room" | "style" | "promo" | "placement" | "element";

export interface CreativeInsight {
  id: string;
  accountId: string;
  // Dimension (what we're analyzing)
  dimension: CreativeInsightDimension;
  dimensionValue: string; // e.g., template ID, "sofas", "modern", "20%_off"
  // Time period
  startDate: Date;
  endDate: Date;
  // Performance metrics
  impressions: number;
  clicks: number;
  spend: number;
  revenue: number;
  conversions: number;
  roas: number;
  ctr: number;
  cpc: number;
  // Sample creative IDs (for drill-down)
  sampleAssetIds: string[];
  sampleAdIds: string[];
  // Calculated at
  calculatedAt: Date;
}

// Notifications Types
export type NotificationType = "job_completed" | "job_failed" | "nudge_weekly";

export interface Notification {
  id: string;
  accountId: string;
  recipientUserId: string;
  type: NotificationType;
  title: string;
  meta: string;
  thumbnailUrl?: string;
  status?: "success" | "error" | "info";
  kind?: "video" | "image" | "render";
  readAt?: Date | null;
  createdAt: Date;
  cta?: {
    label: string;
    href: string;
  };
  dedupeKey?: string;
  metadata?: Record<string, any>;
}

export interface CreativeElementInsight extends CreativeInsight {
  dimension: "element";
  elementType: "headline" | "cta" | "background" | "product_image" | "promo_badge";
  elementValue: string; // e.g., "Shop Now", "blue_background", "product_centered"
}

// Creative Scoring Types (Phase 3)
export interface CreativeScore {
  id: string;
  assetId: string;
  accountId: string;
  // Scores (0-100)
  attentionScore: number; // Visual attention (composition, contrast, focal points)
  emotionScore: number; // Emotional appeal (warmth, excitement, trust)
  engagementScore: number; // Likely engagement (CTR prediction)
  platformFitScore: number; // Platform-specific fit (Pinterest vs Meta vs TikTok)
  overallScore: number; // Weighted composite
  // Model version (for calibration)
  modelVersion: string;
  platformTarget?: "pinterest" | "meta" | "google" | "tiktok";
  scoredAt: Date;
  // Calibration data (Phase 3: compare to actuals)
  actualPerformance?: {
    impressions?: number;
    clicks?: number;
    ctr?: number;
    roas?: number;
    calculatedAt?: Date;
  };
  calibrationDelta?: number; // predicted vs actual difference
}

export interface ScoreCalibration {
  id: string;
  accountId: string;
  modelVersion: string;
  // Calibration period
  startDate: Date;
  endDate: Date;
  // Results
  assetsScored: number;
  assetsWithActuals: number;
  correlationCoefficient: number; // predicted vs actual correlation
  meanAbsoluteError: number;
  // Updated weights (for next model version)
  updatedWeights?: {
    attentionWeight: number;
    emotionWeight: number;
    engagementWeight: number;
    platformFitWeight: number;
  };
  calculatedAt: Date;
}

// Budget Automation Types (Phase 3)
export interface BudgetAllocation {
  id: string;
  accountId: string;
  // Source (what triggered this)
  recommendationId?: string;
  automationRuleId?: string;
  // Allocation
  channel: MarketingChannel;
  campaignId?: string;
  adSetId?: string;
  // Change
  previousBudget: number;
  newBudget: number;
  changeAmount: number;
  changePercent: number;
  // Rationale
  rationale: string;
  // Status
  status: "pending" | "applied" | "failed" | "rolled_back";
  appliedAt?: Date;
  appliedBy?: string;
  // Guardrails
  guardrails?: {
    maxBudget?: number;
    minBudget?: number;
    cooldownHours?: number;
  };
  // Rollback
  rolledBackAt?: Date;
  rolledBackBy?: string;
  rollbackReason?: string;
  // Metadata
  allocations?: Array<{
    platform: string;
    objectId: string;
    previousBudget: number;
    newBudget: number;
  }>;
  createdAt: Date;
}

export interface AutomationRule {
  id: string;
  accountId: string;
  name: string;
  description?: string;
  // Conditions
  conditions: {
    metric: "roas" | "ctr" | "cpc" | "revenue" | "spend";
    operator: ">" | "<" | ">=" | "<=" | "==";
    value: number;
    comparisonPeriod: "last_7d" | "last_14d" | "last_30d" | "all_time";
    comparisonType?: "vs_average" | "vs_threshold" | "absolute";
  }[];
  // Actions
  actions: {
    type: "increase_budget" | "decrease_budget" | "pause" | "resume";
    channel?: MarketingChannel;
    changePercent?: number;
    changeAmount?: number;
  }[];
  // Guardrails
  guardrails: {
    maxBudget?: number;
    minBudget?: number;
    cooldownHours?: number;
    maxChangePercent?: number; // Don't change by more than X%
  };
  // Status
  enabled: boolean;
  lastTriggeredAt?: Date;
  triggerCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Brand Pulse Lite Types (Phase 4)
export interface BrandMetric {
  id: string;
  accountId: string;
  // Time period
  startDate: Date;
  endDate: Date;
  // Blended metrics (proxies, not true dedup)
  blendedReach: number; // Sum of platform reaches (overestimate)
  blendedFrequency: number; // Weighted average frequency
  blendedImpressions: number; // Sum of impressions
  // Platform breakdown
  platformMetrics: Record<string, {
    reach: number;
    frequency: number;
    impressions: number;
  }>;
  // Attention proxies
  attentionMetrics: {
    videoViews: number;
    averageViewDuration?: number; // seconds
    videoCompletionRate?: number; // %
    engagementRate?: number; // (likes + comments + shares) / impressions
  };
  // Calculated at
  calculatedAt: Date;
}

export interface BrandAlert {
  id: string;
  accountId: string;
  alertType: "frequency_threshold" | "attention_threshold";
  threshold: number;
  currentValue: number;
  platform?: string;
  audienceId?: string;
  message: string;
  severity: "low" | "medium" | "high";
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

// Subscription & Billing Types
export type PlanTier = "free" | "starter" | "pro" | "enterprise";

export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trialing";

export interface PlanLimits {
  maxCampaignsPerMonth: number;
  maxAssetsTotal: number;
  maxTeamMembers: number;
  maxIntegrations: number;
  // Feature flags
  hasAdvancedAnalytics: boolean;
  hasBrandPulse: boolean;
  hasCreativeInsights: boolean;
  hasAutomationRules: boolean;
  hasShopifyIntegration: boolean;
  hasERPIntegration: boolean;
  hasPrioritySupport: boolean;
  hasAICMO: boolean;
  hasVideoGeneration: boolean;
}

export interface SubscriptionPlan {
  id: string;
  accountId: string;
  tier: PlanTier;
  status: SubscriptionStatus;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  // Ad spend billing
  adSpendPercentage: number; // e.g., 0.02 for 2%
  managedAdSpendThisMonth: number;
  platformFeeThisMonth: number;
  // Limits (derived from tier, but stored for reference)
  limits: PlanLimits;
  // Trial info
  trialEndsAt?: Date;
  // Cancellation info
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export type AdSpendPlatform = "meta" | "google_ads" | "tiktok_ads" | "pinterest";

export interface AdSpendEntry {
  id: string;
  accountId: string;
  date: Date;
  platform: AdSpendPlatform;
  spend: number;
  currency: string;
  calculatedFee: number; // spend * adSpendPercentage
  integrationId: string;
  externalCampaignId?: string;
  synced: boolean;
  createdAt: Date;
}

export interface AdSpendSummary {
  accountId: string;
  month: string; // "YYYY-MM" format
  totalSpend: number;
  totalFee: number;
  platformBreakdown: Record<AdSpendPlatform, { spend: number; fee: number }>;
  reportedToStripe: boolean;
  stripeUsageRecordId?: string;
  calculatedAt: Date;
}

export type FeatureKey =
  | "advanced_analytics"
  | "brand_pulse"
  | "creative_insights"
  | "automation_rules"
  | "shopify_integration"
  | "erp_integration"
  | "priority_support"
  | "aicmo"
  | "video_generation"
  | "unlimited_campaigns"
  | "unlimited_assets"
  | "unlimited_team_members";

export interface FeatureGateResult {
  hasAccess: boolean;
  currentUsage?: number;
  limit?: number;
  upgradeRequired: boolean;
  requiredTier?: PlanTier;
  message?: string;
}
