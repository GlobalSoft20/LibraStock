import { ReactNode } from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  gradient?: "primary" | "accent" | "warm";
}

export default function StatCard({ title, value, icon, trend, trendUp, gradient }: StatCardProps) {
  const gradientClass = gradient === "accent" ? "gradient-accent" : gradient === "warm" ? "gradient-warm" : "gradient-primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow border border-border"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-heading font-bold text-card-foreground mt-1">{value}</p>
          {trend && (
            <p className={`text-xs font-medium mt-2 ${trendUp ? "text-success" : "text-destructive"}`}>
              {trend}
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl ${gradientClass} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
