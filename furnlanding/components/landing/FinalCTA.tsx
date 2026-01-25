"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { VALUE_PROPS, PRICING_TIERS } from "@/config/pricing";

export const FinalCTA = () => {
  const starterPrice = PRICING_TIERS[0].priceDisplay;

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background with glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-surface/50 to-background" />
      
      {/* Blue glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/20 rounded-full blur-[120px] -z-10" />
      
      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary tracking-tight mb-6">
            One tool. No commitment.
          </h2>

          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-4 leading-relaxed">
            {VALUE_PROPS.noCommitment}
          </p>

          <p className="text-text-muted mb-10">
            Starting at <span className="text-text-primary font-semibold">{starterPrice}/mo</span>
          </p>

          <div className="flex flex-col items-center gap-4">
            <Button variant="primary" size="lg" className="px-12">
              Get Started
            </Button>

            <p className="text-text-muted text-sm">
              {VALUE_PROPS.returnPolicy}
            </p>
          </div>
        </motion.div>

        {/* Decorative floating elements */}
        <motion.div
          className="absolute top-20 left-10 w-2 h-2 bg-accent/30 rounded-full"
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-32 right-20 w-3 h-3 bg-accent/20 rounded-full"
          animate={{ y: [0, -15, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute bottom-20 left-1/4 w-2 h-2 bg-accent/25 rounded-full"
          animate={{ y: [0, -25, 0], opacity: [0.25, 0.55, 0.25] }}
          transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 2 }}
        />
      </div>
    </section>
  );
};
