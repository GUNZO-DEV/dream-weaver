import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sublabel?: string;
}

export const StatCard = ({ icon: Icon, label, value, sublabel }: StatCardProps) => {
  return (
    <div className="bg-secondary/50 p-4 rounded-2xl">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
          <Icon size={14} className="text-primary" strokeWidth={2} />
        </div>
        <span className="text-[13px] text-muted-foreground">{label}</span>
      </div>
      <div className="text-[22px] font-semibold text-foreground tracking-tight">{value}</div>
      {sublabel && (
        <div className="text-[12px] text-success mt-0.5">{sublabel}</div>
      )}
    </div>
  );
};
