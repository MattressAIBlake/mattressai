"use client";

/**
 * Upgrade Prompt Component
 * 
 * Displays contextual upgrade prompts when users hit feature gates or limits.
 * Can be used as a modal or inline component.
 */

import { useState } from "react";
import { X, Sparkles, ArrowRight, Check, Lock } from "lucide-react";
import type { FeatureKey, PlanTier } from "@/lib/types";
import { PLAN_CONFIGS, formatLimit } from "@/lib/subscription/plans";
import { FEATURES } from "@/lib/subscription/featureFlags";
import { useAuth } from "@/contexts/AuthContext";

interface UpgradePromptProps {
  feature?: FeatureKey;
  requiredTier?: PlanTier;
  message?: string;
  onClose?: () => void;
  onUpgrade?: (tier: PlanTier) => void;
  variant?: "modal" | "inline" | "banner";
  showComparison?: boolean;
}

export const UpgradePrompt = ({
  feature,
  requiredTier = "starter",
  message,
  onClose,
  onUpgrade,
  variant = "modal",
  showComparison = true,
}: UpgradePromptProps) => {
  const { currentAccount } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const featureDef = feature ? FEATURES[feature] : null;
  const targetPlan = PLAN_CONFIGS[requiredTier];

  const handleUpgrade = async () => {
    if (!currentAccount?.id) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: currentAccount.id,
          tier: requiredTier,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        if (url) {
          window.location.href = url;
        }
      }
    } catch (error) {
      console.error("Failed to initiate upgrade:", error);
    } finally {
      setIsLoading(false);
    }

    onUpgrade?.(requiredTier);
  };

  if (variant === "banner") {
    return (
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-4 py-3 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5" />
          <span className="font-medium">
            {message || `Upgrade to ${targetPlan.name} to unlock ${featureDef?.name || "this feature"}`}
          </span>
        </div>
        <button
          type="button"
          onClick={handleUpgrade}
          disabled={isLoading}
          className="bg-white text-primary-700 px-4 py-1.5 rounded-md font-medium text-sm hover:bg-primary-50 transition-colors disabled:opacity-50"
        >
          {isLoading ? "Loading..." : "Upgrade Now"}
        </button>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="bg-surface border border-border-subtle rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-primary-100 p-3 rounded-lg">
            <Sparkles className="h-6 w-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-text-strong mb-1">
              {featureDef?.name || "Premium Feature"}
            </h3>
            <p className="text-text-muted text-sm mb-4">
              {message || featureDef?.description || `This feature requires the ${targetPlan.name} plan.`}
            </p>
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isLoading}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-primary-700 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? "Loading..." : `Upgrade to ${targetPlan.name}`}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modal variant
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl max-w-lg w-full shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-white" />
            <h2 className="text-xl font-semibold text-white">Upgrade Your Plan</h2>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close upgrade prompt"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-text-strong mb-2">
              {featureDef?.name || "Unlock Premium Features"}
            </h3>
            <p className="text-text-muted">
              {message || featureDef?.description || `Upgrade to ${targetPlan.name} to access this feature.`}
            </p>
          </div>

          {showComparison && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h4 className="font-medium text-text-strong mb-3">{targetPlan.name} Plan Includes:</h4>
              <ul className="space-y-2">
                {targetPlan.features.slice(0, 5).map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-text-muted">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-3xl font-bold text-text-strong">
                ${targetPlan.monthlyPrice / 100}
              </span>
              <span className="text-text-muted">/month</span>
            </div>
            {targetPlan.adSpendPercentage > 0 && (
              <div className="text-right text-sm text-text-muted">
                + {(targetPlan.adSpendPercentage * 100).toFixed(1)}% of managed ad spend
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-border-subtle rounded-lg font-medium text-text-muted hover:bg-gray-50 transition-colors"
              >
                Maybe Later
              </button>
            )}
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isLoading}
              className="flex-1 bg-primary-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Upgrade Now"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Feature Lock Overlay
 * 
 * Displays over locked features to indicate upgrade is needed.
 */
interface FeatureLockOverlayProps {
  feature: FeatureKey;
  children: React.ReactNode;
}

export const FeatureLockOverlay = ({ feature, children }: FeatureLockOverlayProps) => {
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const featureDef = FEATURES[feature];

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none blur-sm">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-lg">
        <div className="text-center p-6">
          <Lock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="font-semibold text-text-strong mb-2">{featureDef.name}</h3>
          <p className="text-text-muted text-sm mb-4">
            Available on {featureDef.requiredTier.charAt(0).toUpperCase() + featureDef.requiredTier.slice(1)} and above
          </p>
          <button
            type="button"
            onClick={() => setShowUpgradePrompt(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-primary-700 transition-colors"
          >
            Unlock Feature
          </button>
        </div>
      </div>
      {showUpgradePrompt && (
        <UpgradePrompt
          feature={feature}
          requiredTier={featureDef.requiredTier}
          onClose={() => setShowUpgradePrompt(false)}
        />
      )}
    </div>
  );
};

export default UpgradePrompt;
