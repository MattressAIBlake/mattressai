"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, BarChart3, Play, Sparkles, TrendingUp, Eye, Zap, Infinity } from "lucide-react";

type Tab = "edit" | "analyze" | "video";

const tabs: { id: Tab; label: string; icon: typeof ImageIcon }[] = [
  { id: "edit", label: "Edit", icon: ImageIcon },
  { id: "analyze", label: "Analyze", icon: BarChart3 },
  { id: "video", label: "Video", icon: Play },
];

export const ProductShowcase = () => {
  const [activeTab, setActiveTab] = useState<Tab>("edit");

  const handleTabClick = (tabId: Tab) => {
    setActiveTab(tabId);
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, tabId: Tab) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setActiveTab(tabId);
    }
  };

  return (
    <section className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary tracking-tight mb-4">
            The actual product
          </h2>
          <p className="text-lg text-text-secondary max-w-xl mx-auto">
            Not a mockup. Not &quot;coming soon.&quot; This is it.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="inline-flex p-1 rounded-xl bg-surface border border-border">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
                  className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "text-text-primary"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                  tabIndex={0}
                  aria-label={`Show ${tab.label} demo`}
                  aria-selected={isActive}
                  role="tab"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-accent/10 border border-accent/20 rounded-lg"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  <Icon size={16} className="relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          className="relative max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === "edit" && (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-8"
                >
                  <EditDemo />
                </motion.div>
              )}
              {activeTab === "analyze" && (
                <motion.div
                  key="analyze"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-8"
                >
                  <AnalyzeDemo />
                </motion.div>
              )}
              {activeTab === "video" && (
                <motion.div
                  key="video"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-8"
                >
                  <VideoDemo />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Note */}
          <p className="text-center text-text-muted text-sm mt-6">
            What you see is what you get. No bait-and-switch.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

// Transform stages for the edit demo
const TRANSFORM_STAGES = [
  {
    id: "removal",
    label: "Background Removal",
    shortLabel: "Removed",
    description: "Instantly remove any background",
    image: "/background.jpg",
  },
  {
    id: "shadow",
    label: "Drop Shadow",
    shortLabel: "Shadow",
    description: "Add realistic drop shadows",
    image: "/Dropshadow.png",
  },
  {
    id: "silhouette",
    label: "Enhanced Silhouette",
    shortLabel: "Studio",
    description: "Cement floor, plaster walls",
    image: "/enhancedsilo.png",
  },
  {
    id: "lifestyle",
    label: "Full Lifestyle",
    shortLabel: "Lifestyle",
    description: "Complete room generation",
    image: "/lifestyleff.png",
  },
];

// Edit Demo Component with 4-stage transformation slider
const EditDemo = () => {
  const [sliderPosition, setSliderPosition] = useState(75);

  // Calculate which stage we're viewing based on slider position
  const getActiveStage = (position: number): number => {
    if (position <= 25) return 0;
    if (position <= 50) return 1;
    if (position <= 75) return 2;
    return 3;
  };

  const activeStage = getActiveStage(sliderPosition);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  const handleStageClick = (index: number) => {
    // Set slider to middle of each stage
    const positions = [12.5, 37.5, 62.5, 87.5];
    setSliderPosition(positions[index]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            AI Image Transformation
          </h3>
          <p className="text-xs text-text-muted mt-1">
            Drag to see all 4 transformations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-accent bg-accent/10 px-2 py-1 rounded-full">
            <Zap size={12} />
            Fast
          </span>
          <span className="flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
            <Infinity size={12} />
            Unlimited on Pro
          </span>
        </div>
      </div>

      {/* Multi-stage Transformation Slider */}
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-zinc-200 select-none">
        {/* Checkered background pattern for transparency */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='10' height='10' fill='%23e5e5e5'/%3E%3Crect x='10' y='10' width='10' height='10' fill='%23e5e5e5'/%3E%3Crect x='10' width='10' height='10' fill='%23ffffff'/%3E%3Crect y='10' width='10' height='10' fill='%23ffffff'/%3E%3C/svg%3E")`,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Stage images - stacked with clip paths */}
        {TRANSFORM_STAGES.map((stage, index) => {
          const stageStart = index * 25;
          const clipRight = Math.max(0, Math.min(100, 100 - (sliderPosition - stageStart) * 4));
          
          return (
            <div
              key={stage.id}
              className="absolute inset-0"
              style={{
                clipPath: index === 0 ? 'none' : `inset(0 ${clipRight}% 0 0)`,
                zIndex: index,
              }}
            >
              <Image
                src={stage.image}
                alt={stage.label}
                fill
                className="object-contain"
                priority={index === 0}
              />
            </div>
          );
        })}

        {/* Stage indicator lines */}
        <div className="absolute top-0 bottom-0 left-[25%] w-px bg-white/30 z-20" />
        <div className="absolute top-0 bottom-0 left-[50%] w-px bg-white/30 z-20" />
        <div className="absolute top-0 bottom-0 left-[75%] w-px bg-white/30 z-20" />

        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-30"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-accent">
            <span className="text-accent text-sm font-bold">↔</span>
          </div>
        </div>

        {/* Slider Input */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={handleSliderChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-40"
          aria-label="Transform between image styles"
        />

        {/* Current Stage Label */}
        <div className="absolute top-4 left-4 z-30">
          <motion.div
            key={activeStage}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg"
          >
            <p className="text-white text-sm font-medium">
              {TRANSFORM_STAGES[activeStage].label}
            </p>
            <p className="text-white/70 text-xs">
              {TRANSFORM_STAGES[activeStage].description}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Stage Buttons */}
      <div className="flex justify-between gap-2">
        {TRANSFORM_STAGES.map((stage, index) => (
          <button
            key={stage.id}
            onClick={() => handleStageClick(index)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeStage === index
                ? "bg-accent text-white"
                : "bg-background border border-border text-text-secondary hover:text-text-primary hover:border-text-muted"
            }`}
          >
            {stage.shortLabel}
          </button>
        ))}
      </div>

      {/* Speed & Unlimited callout */}
      <div className="flex items-center justify-center gap-6 py-3 px-4 rounded-lg bg-accent/5 border border-accent/20">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-accent" />
          <span className="text-sm text-text-secondary">
            <span className="text-text-primary font-medium">~3 seconds</span> per transformation
          </span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2">
          <Infinity size={16} className="text-green-500" />
          <span className="text-sm text-text-secondary">
            <span className="text-text-primary font-medium">Unlimited</span> on Growth & Pro
          </span>
        </div>
      </div>
    </div>
  );
};

// Analyze Demo Component
const AnalyzeDemo = () => {
  const scores = [
    { label: "Composition", score: 92, color: "bg-green-500" },
    { label: "Lighting", score: 78, color: "bg-yellow-500" },
    { label: "Style Match", score: 95, color: "bg-green-500" },
    { label: "Engagement Potential", score: 84, color: "bg-green-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">
          AI Analysis
        </h3>
        <span className="text-xs text-text-muted bg-background px-2 py-1 rounded">
          Real-time scoring
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Image Preview */}
        <div className="relative aspect-square rounded-xl bg-background overflow-hidden border border-border">
          <Image
            src="/analyzedemo.png"
            alt="Product being analyzed"
            fill
            className="object-cover"
          />
        </div>

        {/* Scores */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-background border border-accent/20">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <TrendingUp size={24} className="text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">87</p>
              <p className="text-xs text-text-muted">Overall Score</p>
            </div>
          </div>

          {scores.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">{item.label}</span>
                <span className="text-text-primary font-medium">
                  {item.score}%
                </span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full transition-all duration-500`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          ))}

          {/* Insights */}
          <div className="p-3 rounded-lg bg-background border border-border">
            <div className="flex items-start gap-2">
              <Eye size={14} className="text-accent mt-0.5 flex-shrink-0" />
              <p className="text-xs text-text-secondary leading-relaxed">
                <span className="text-text-primary font-medium">Tip:</span>{" "}
                Consider adjusting lighting on the left side for better shadow
                consistency.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Video Demo Component - Beautiful Photo → Engaging Lifestyle Video
const VideoDemo = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            Photo → Video
          </h3>
          <p className="text-xs text-text-muted mt-1">
            Turn beautiful product photos into engaging lifestyle videos
          </p>
        </div>
        <span className="flex items-center gap-1 text-xs text-accent bg-accent/10 px-2 py-1 rounded-full">
          <Sparkles size={12} />
          AI-powered
        </span>
      </div>

      {/* Before/After Transformation */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Before: Beautiful Product Photo */}
        <div className="relative">
          <div className="absolute -top-2 left-3 z-10">
            <span className="text-[10px] font-medium text-text-muted bg-surface px-2 py-0.5 rounded border border-border">
              YOUR PHOTO
            </span>
          </div>
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border bg-background">
            <Image
              src="/before.png"
              alt="Beautiful product photo"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Arrow for mobile */}
        <div className="flex md:hidden items-center justify-center -my-2">
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
            <span className="text-accent text-lg">↓</span>
          </div>
        </div>

        {/* After: Engaging Lifestyle Video */}
        <div className="relative">
          <div className="absolute -top-2 left-3 z-10">
            <span className="text-[10px] font-medium text-white bg-accent px-2 py-0.5 rounded">
              GENERATED VIDEO
            </span>
          </div>
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-accent/30 bg-zinc-900">
            <video
              src="/aftervid.mov"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              aria-label="AI-generated lifestyle video with family enjoying the sofa"
            />
          </div>
        </div>
      </div>

      {/* Simple value prop */}
      <div className="flex items-center justify-center gap-6 py-3 px-4 rounded-lg bg-accent/5 border border-accent/20">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Zap size={14} className="text-accent" />
          <span><span className="text-text-primary font-medium">8-second</span> video ads</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Sparkles size={14} className="text-accent" />
          <span><span className="text-text-primary font-medium">Music + voiceover</span> included</span>
        </div>
      </div>
    </div>
  );
};
