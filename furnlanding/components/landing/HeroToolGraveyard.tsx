"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import Image from "next/image";
import { ToolCard } from "./ToolCard";
import { Button } from "@/components/ui/Button";
import { HERO_TOOLS } from "@/config/tools";
import { TOOL_STACK_COST } from "@/config/pricing";

// Generate random positions for tool cards in a circular-ish layout
// Returns both initial positions and fallen pile positions
const generatePositions = () => {
  const positions: { 
    x: number; 
    y: number; 
    rotation: number;
    exitX: number;
    exitY: number;
    exitRotation: number;
  }[] = [];
  const initialRadius = 280;
  const centerOffset = 0;
  
  // Ground level for the pile (bottom of the animation area)
  const groundY = 180;

  HERO_TOOLS.forEach((_, i) => {
    const angle = (i / HERO_TOOLS.length) * 2 * Math.PI - Math.PI / 2;
    const variance = 0.3;
    const r = initialRadius * (0.7 + Math.random() * variance);
    
    // Initial position - circular layout
    const x = Math.cos(angle) * r + centerOffset + (Math.random() - 0.5) * 60;
    const y = Math.sin(angle) * r * 0.6 + (Math.random() - 0.5) * 40;
    
    // Fallen position - cards fall straight down from their current X position
    // Keep the same X position (with tiny variance for natural look)
    const exitX = x + (Math.random() - 0.5) * 10;
    // Fall to ground level with some Y variation for depth
    const exitY = groundY + (Math.random() - 0.5) * 40;
    // Random rotation for fallen cards look
    const exitRotation = (Math.random() - 0.5) * 25;

    positions.push({
      x,
      y,
      rotation: (Math.random() - 0.5) * 15,
      exitX,
      exitY,
      exitRotation,
    });
  });

  return positions;
};

export const HeroToolGraveyard = () => {
  const [isExiting, setIsExiting] = useState(false);
  const [showImageLogo, setShowImageLogo] = useState(false);
  const [showTextLogo, setShowTextLogo] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [positions] = useState(generatePositions);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      mouseX.set((e.clientX - centerX) * 0.02);
      mouseY.set((e.clientY - centerY) * 0.02);
    },
    [mouseX, mouseY]
  );

  useEffect(() => {
    // Start exit animation after 2.5 seconds
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2500);

    // Show image logo after tools exit
    const imageLogoTimer = setTimeout(() => {
      setShowImageLogo(true);
    }, 4000);

    // Show text logo (image fades/scales down, text fades up)
    const textLogoTimer = setTimeout(() => {
      setShowTextLogo(true);
    }, 5200);

    // Show content after text logo appears
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 5800);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(imageLogoTimer);
      clearTimeout(textLogoTimer);
      clearTimeout(contentTimer);
    };
  }, []);

  const handleScrollToFeatures = () => {
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16"
      onMouseMove={handleMouseMove}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-surface/20" />

      {/* Animated tool cards */}
      <motion.div
        className="relative w-full max-w-4xl h-[400px] md:h-[500px]"
        style={{ x: springX, y: springY }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Tool cards - z-0 so they stay behind logo/content */}
          <div className="absolute inset-0 flex items-center justify-center z-0">
            {HERO_TOOLS.map((tool, index) => (
              <ToolCard
                key={tool.name}
                name={tool.name}
                price={tool.price}
                index={index}
                isExiting={isExiting}
                initialX={positions[index].x}
                initialY={positions[index].y}
                initialRotation={positions[index].rotation}
                exitX={positions[index].exitX}
                exitY={positions[index].exitY}
                exitRotation={positions[index].exitRotation}
              />
            ))}
          </div>

          {/* Image Logo - fades in first, then scales down - z-10 to stay above ghost cards */}
          <motion.div
            className="absolute flex flex-col items-center z-10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={
              showImageLogo
                ? showTextLogo
                  ? { opacity: 0, scale: 0.3, y: -60 }
                  : { opacity: 1, scale: 1, y: 0 }
                : { opacity: 0, scale: 0.9, y: 0 }
            }
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Image
              src="/furn-logo.png"
              alt="furn logo"
              width={400}
              height={200}
              className="w-[280px] md:w-[400px] h-auto"
              priority
            />
          </motion.div>

          {/* furn Text Logo - fades up through the image - z-10 to stay above ghost cards */}
          <motion.div
            className="absolute flex flex-col items-center z-10"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={
              showTextLogo
                ? { opacity: 1, scale: 1, y: 0 }
                : { opacity: 0, scale: 0.8, y: 20 }
            }
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              className="relative"
              animate={showTextLogo ? { y: [0, -8, 0] } : {}}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <span className="text-7xl md:text-9xl font-bold text-text-primary tracking-tighter">
                furn
              </span>
              {/* Glow effect */}
              <div className="absolute inset-0 text-7xl md:text-9xl font-bold text-accent/30 blur-2xl tracking-tighter -z-10">
                furn
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Hero Content */}
      <motion.div
        className="relative z-10 text-center max-w-4xl mx-auto px-4 -mt-8 md:-mt-16"
        initial={{ opacity: 0, y: 30 }}
        animate={showContent ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-text-primary tracking-tight mb-6">
          <span className="md:whitespace-nowrap">Your {TOOL_STACK_COST.display} tool stack.</span>
          <br />
          <span className="text-accent">One replacement.</span>
        </h1>

        <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto mb-6 leading-relaxed">
          furn replaces Canva, Adobe, ChatGPT, Jasper, Hootsuite, Klaviyo, Salsify, 
          Roomvo, and more — all built specifically for furniture marketing.
        </p>

        {/* Tool categories */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-2xl mx-auto">
          {[
            "Content Creation",
            "AI Generation", 
            "Social Media",
            "Email Marketing",
            "PIM",
            "Room Visualization",
            "Analytics",
          ].map((category) => (
            <span
              key={category}
              className="px-3 py-1 text-xs font-medium text-text-muted bg-surface border border-border rounded-full"
            >
              {category}
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex flex-col items-center">
            <Button variant="primary" size="lg">
              Get Started
            </Button>
            <span className="text-text-muted text-sm mt-2">
              Month-to-month. Cancel anytime.
            </span>
          </div>

          <Button
            variant="ghost"
            size="lg"
            onClick={handleScrollToFeatures}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleScrollToFeatures();
              }
            }}
            tabIndex={0}
            aria-label="See what furn replaces"
          >
            See what it replaces ↓
          </Button>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={showContent ? { opacity: 1, y: [0, 8, 0] } : { opacity: 0 }}
        transition={{
          opacity: { delay: 0.5, duration: 0.5 },
          y: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
        }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-text-muted/30 flex items-start justify-center p-1.5">
          <motion.div
            className="w-1.5 h-2.5 bg-text-muted/50 rounded-full"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
};
