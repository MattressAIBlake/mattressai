"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { REPLACEMENT_LIST, TOTAL_TOOL_SPEND } from "@/config/tools";

export const ReplacementGrid = () => {
  return (
    <section id="replaces" className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary tracking-tight mb-4">
            One subscription. Eight tool categories.
          </h2>
          <p className="text-lg text-text-secondary max-w-xl mx-auto mb-4">
            Everything plays nice because it&apos;s all in one place.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
            <span className="text-text-muted text-sm">Typical tool stack:</span>
            <span className="text-accent font-semibold">
              ${TOTAL_TOOL_SPEND.min.toLocaleString()} - ${TOTAL_TOOL_SPEND.max.toLocaleString()}/mo
            </span>
          </div>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
        >
          {REPLACEMENT_LIST.map((item, index) => (
            <motion.div
              key={index}
              className="group relative flex items-center gap-4 p-4 rounded-xl border border-border bg-surface/50 hover:bg-surface hover:border-text-muted/30 transition-all duration-300"
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0 },
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* Old tools */}
              <div className="flex-1 min-w-0">
                <span className="text-text-muted text-sm line-through decoration-destructive/50">
                  {item.tools}
                </span>
              </div>

              {/* Arrow */}
              <ArrowRight
                size={16}
                className="text-text-muted/50 group-hover:text-accent transition-colors flex-shrink-0"
              />

              {/* New feature */}
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <Check size={16} className="text-accent flex-shrink-0" />
                <span className="text-text-primary text-sm font-medium">
                  {item.feature}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Savings callout */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p className="text-text-secondary">
            <span className="text-text-primary font-semibold">Save 50-80%</span>{" "}
            compared to subscribing to each tool separately
          </p>
        </motion.div>
      </div>
    </section>
  );
};
