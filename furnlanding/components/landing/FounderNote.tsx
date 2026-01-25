"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

export const FounderNote = () => {
  return (
    <section id="about" className="py-24 bg-background">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          className="relative rounded-2xl border border-border bg-surface/50 p-8 md:p-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          {/* Quote icon */}
          <div className="absolute -top-4 left-8 md:left-12">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
              <Quote size={16} className="text-accent" />
            </div>
          </div>

          {/* Quote */}
          <blockquote className="text-xl md:text-2xl lg:text-3xl text-text-primary font-medium leading-relaxed mb-8">
            &quot;I built furn because most tools Furniture CMO&apos;s use are not
            built for the industry and don&apos;t utilize AI. You should try
            it.&quot;
          </blockquote>

          {/* Author */}
          <div className="flex items-center gap-4">
            {/* Avatar placeholder */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/20 to-accent/40 flex items-center justify-center">
              <span className="text-accent font-semibold text-lg">B</span>
            </div>

            <div>
              <p className="text-text-primary font-semibold">— Blake, Founder</p>
              <p className="text-text-muted text-sm">
                (Yes, I still answer support emails personally)
              </p>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl -z-10" />
        </motion.div>
      </div>
    </section>
  );
};
