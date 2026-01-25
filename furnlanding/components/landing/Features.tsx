"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  BarChart3,
  Video,
  FolderOpen,
  Palette,
  Share2,
  Layers,
  Eye,
} from "lucide-react";
import { DIFFERENTIATORS } from "@/config/tools";

const features = [
  {
    icon: Sparkles,
    title: "Furniture-Trained AI",
    subtitle: "AI that actually understands furniture",
    description: DIFFERENTIATORS[0].description,
  },
  {
    icon: Layers,
    title: "One Platform",
    subtitle: "Replace 6-8 tool subscriptions",
    description: DIFFERENTIATORS[1].description,
  },
  {
    icon: BarChart3,
    title: "Smart Analysis",
    subtitle: "Know what works before you post",
    description:
      "AI scores your images: style detection, quality rating, engagement prediction. Skip the guesswork.",
  },
  {
    icon: Video,
    title: "Video Ads",
    subtitle: "One image → one video ad",
    description:
      "Animations, transitions, AI voiceover, music. The stuff that used to require an agency or a weekend in CapCut.",
  },
  {
    icon: Eye,
    title: "Room Visualization",
    subtitle: "AR & 3D built-in",
    description: DIFFERENTIATORS[3].description,
  },
  {
    icon: Share2,
    title: "Marketplace Ready",
    subtitle: "Export everywhere",
    description: DIFFERENTIATORS[4].description,
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-24 bg-surface/30">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary tracking-tight mb-4">
            What you&apos;re getting
          </h2>
          <p className="text-lg text-text-secondary max-w-xl mx-auto">
            No fluff. No roadmap promises. This exists today.
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                className="group relative p-6 rounded-xl border border-border bg-background hover:border-accent/30 hover:bg-surface/50 transition-all duration-300"
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <Icon size={24} className="text-accent" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-text-primary tracking-tight mb-1">
                  {feature.title}
                </h3>
                <p className="text-accent text-sm font-medium mb-3">
                  {feature.subtitle}
                </p>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-xl bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl" />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
