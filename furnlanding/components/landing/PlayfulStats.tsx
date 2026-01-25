"use client";

import { motion } from "framer-motion";
import { TOOL_STACK_COST } from "@/config/pricing";

const stats = [
  { value: "$0", label: "VC raised" },
  { value: "1", label: "founder who answers emails" },
  { value: TOOL_STACK_COST.savings, label: "savings vs. tool stack" },
];

export const PlayfulStats = () => {
  return (
    <section className="py-16 border-y border-border/50 bg-surface/30">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-6 md:gap-8"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="flex items-center justify-center px-6 py-4 rounded-lg border border-border bg-background/50 min-w-[200px] md:min-w-[240px]">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-2xl md:text-3xl font-semibold text-text-primary">
                    {stat.value}
                  </span>
                  <span className="text-text-muted text-sm md:text-base">
                    {stat.label}
                  </span>
                </div>
              </div>

              {/* Separator (hide on last item) */}
              {index < stats.length - 1 && (
                <div className="hidden md:block w-px h-8 bg-border" />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
