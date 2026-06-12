import React from 'react';
import { motion } from 'motion/react';

interface BreathingHudPanelProps {
  children: React.ReactNode;
  comboCount: number;
  className?: string;
  style?: React.CSSProperties;
}

export function BreathingHudPanel({ children, comboCount, className = "", style }: BreathingHudPanelProps) {
  // Base scale starts at 1.0.
  // Amplitude grows with comboCount. e.g. at x1 -> 1.008, at x10 -> 1.045
  const normalizedCombo = Math.max(1, comboCount);
  const amplitude = 1 + Math.min(0.045, (normalizedCombo - 1) * 0.005);
  
  // Speed up as comboCount grows: x1 -> 3.8s loop, x10 -> 1.4s loop
  const duration = Math.max(1.4, 3.8 - Math.min(2.4, (normalizedCombo - 1) * 0.28));

  return (
    <motion.div
      animate={{
        scale: [1.0, amplitude, 1.0]
      }}
      transition={{
        repeat: Infinity,
        duration: duration,
        ease: "easeInOut"
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}
