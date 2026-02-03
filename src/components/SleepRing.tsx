import { motion } from "framer-motion";

interface SleepRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export const SleepRing = ({ 
  percentage, 
  size = 200, 
  strokeWidth = 10,
  label,
  sublabel 
}: SleepRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background ring */}
      <svg className="absolute transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          opacity={0.3}
        />
      </svg>
      
      {/* Animated progress ring */}
      <motion.svg 
        className="absolute transform -rotate-90" 
        width={size} 
        height={size}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <defs>
          <linearGradient id="sleepGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(211 100% 50%)" />
            <stop offset="100%" stopColor="hsl(280 75% 60%)" />
          </linearGradient>
        </defs>
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#sleepGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
        />
      </motion.svg>

      {/* Center content */}
      <div className="flex flex-col items-center justify-center z-10">
        {label && (
          <motion.span 
            className="text-[48px] font-light text-foreground tracking-tight"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            {label}
          </motion.span>
        )}
        {sublabel && (
          <motion.span 
            className="text-[13px] text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.8 }}
          >
            {sublabel}
          </motion.span>
        )}
      </div>
    </div>
  );
};
