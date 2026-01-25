"use client";

import { motion } from "framer-motion";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Changelog", href: "#" },
  ],
  Resources: [
    { label: "Help Center", href: "#" },
    { label: "Documentation", href: "#" },
  ],
  Company: [
    { label: "About", href: "#about" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
};

export const Footer = () => {
  return (
    <footer className="bg-surface/30 border-t border-border">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Brand */}
          <div className="col-span-2">
            <a href="#" className="inline-block mb-4">
              <span className="text-2xl font-bold text-text-primary tracking-tight hover:text-accent transition-colors">
                furn
              </span>
            </a>
            <p className="text-text-muted text-sm leading-relaxed max-w-xs">
              Built by humans. Supported by humans. Priced by someone who&apos;s
              been burned by SaaS subscriptions too.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-text-primary font-semibold text-sm mb-4">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-text-muted text-sm hover:text-text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        {/* Divider */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-text-muted text-sm">
              © 2026 furn · No contracts. No BS.
            </p>
            <p className="text-text-muted text-sm">
              Made with ☕ in St. Louis
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
