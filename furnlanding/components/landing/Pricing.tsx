"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PRICING_TIERS, VALUE_PROPS, TOOL_STACK_COST } from "@/config/pricing";

export const Pricing = () => {
  return (
    <section id="pricing" className="py-24 bg-surface/30">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary tracking-tight mb-4">
            Pricing
          </h2>
          <p className="text-lg text-text-secondary max-w-xl mx-auto mb-4">
            {VALUE_PROPS.noContracts}
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
            <span className="text-text-muted text-sm">vs. {TOOL_STACK_COST.display} tool stack</span>
            <span className="text-green-500 font-semibold">Save {TOOL_STACK_COST.savings}</span>
          </div>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4"
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
          {PRICING_TIERS.map((plan, index) => (
            <motion.div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border ${
                plan.highlighted
                  ? "border-accent/50 bg-surface shadow-xl shadow-accent/10"
                  : "border-border bg-background"
              } p-6`}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-block px-3 py-1 text-xs font-semibold text-white bg-accent rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-text-primary mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-text-muted">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-text-primary">
                    {plan.priceDisplay}
                  </span>
                  <span className="text-text-muted">{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2">
                    <Check
                      size={16}
                      className={`flex-shrink-0 mt-0.5 ${
                        plan.highlighted ? "text-accent" : "text-text-muted"
                      }`}
                    />
                    <span className="text-text-secondary text-sm">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="space-y-2">
                <Button
                  variant={plan.highlighted ? "primary" : "outline"}
                  size="md"
                  className="w-full"
                >
                  {plan.ctaText}
                </Button>
                <p className="text-center text-xs text-text-muted">
                  Month-to-month
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* No contract note */}
        <motion.div
          className="max-w-2xl mx-auto mt-16 p-6 rounded-xl border border-border bg-background/50"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p className="text-text-secondary text-center leading-relaxed">
            <span className="text-text-primary font-semibold">
              No annual contracts.
            </span>{" "}
            Every plan is month-to-month. Cancel anytime with one click. We
            don&apos;t do &quot;retention calls&quot; or make you email someone.
            If you leave, you leave. We hope you come back, but we won&apos;t
            guilt you.
          </p>
        </motion.div>

        {/* Additional seats note */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-text-muted text-sm">
            Need more seats? Add team members for <span className="text-text-secondary">$29-49/mo per seat</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};
