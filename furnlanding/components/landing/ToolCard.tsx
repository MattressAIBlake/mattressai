"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";

interface ToolCardProps {
  name: string;
  price: string;
  index: number;
  isExiting: boolean;
  initialX: number;
  initialY: number;
  initialRotation: number;
  exitX: number;
  exitY: number;
}

export const ToolCard = ({
  name,
  price,
  index,
  isExiting,
  initialX,
  initialY,
  initialRotation,
  exitX,
  exitY,
}: ToolCardProps) => {
  return (
    <motion.div
      className="absolute rounded-lg px-4 py-3 cursor-default select-none"
      initial={{
        opacity: 0,
        scale: 0.6,
        x: initialX,
        y: initialY,
        rotate: initialRotation,
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
        borderWidth: "1px",
        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      }}
      animate={
        isExiting
          ? {
              opacity: 0.1,
              scale: 0.85,
              filter: "grayscale(1)",
              x: exitX,
              y: exitY,
              rotate: 0,
              backgroundColor: "transparent",
              borderColor: "rgba(39, 39, 42, 0.3)",
              boxShadow: "none",
            }
          : {
              opacity: 1,
              scale: 1,
              x: initialX,
              y: initialY,
              rotate: initialRotation,
              filter: "grayscale(0)",
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
              borderWidth: "1px",
              boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
            }
      }
      transition={{
        type: "spring",
        stiffness: 80,
        damping: 18,
        delay: isExiting ? index * 0.08 : index * 0.08,
        duration: isExiting ? 0.8 : 0.6,
      }}
      whileHover={
        !isExiting
          ? {
              scale: 1.05,
              rotate: 0,
              transition: { duration: 0.2 },
            }
          : undefined
      }
      style={{ pointerEvents: isExiting ? "none" : "auto" }}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-text-primary font-medium text-sm whitespace-nowrap">
            {name}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-text-muted text-xs line-through decoration-destructive">
              {price}
            </span>
            <X size={12} className="text-destructive" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
