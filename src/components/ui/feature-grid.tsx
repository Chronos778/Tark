import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, LucideIcon } from "lucide-react";

// Interface for a single feature item
export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}

// Interface for the component props
export interface FeatureGridProps {
  features: Feature[];
  className?: string;
}

const FeatureCard: React.FC<{ feature: Feature }> = ({ feature }) => (
  <a
    href={feature.href}
    className={cn(
      "group relative overflow-hidden",
      "flex flex-col items-start gap-4", // Vertical layout
      "p-6 rounded-3xl border border-white/10",
      "bg-white/5 hover:bg-white/10 transition-all duration-300",
      "hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
    )}
  >
    {/* Hover Gradient */}
    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

    {/* Icon */}
    <div className="flex-shrink-0 relative z-10">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white group-hover:border-purple-500 transition-all duration-300">
        <feature.icon className="w-7 h-7" />
      </div>
    </div>
    
    {/* Text Content */}
    <div className="flex flex-col flex-1 relative z-10">
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-100 transition-colors">
          {feature.title}
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors line-clamp-3">
          {feature.description}
        </p>
    </div>
    
    {/* Arrow (Absolute positioning for cleaner look) */}
    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 -translate-x-2">
        <ArrowRight className="h-5 w-5 text-purple-400" />
    </div>
  </a>
);

const FeatureGrid = React.forwardRef<
  HTMLDivElement,
  FeatureGridProps
>(({ features, className }, ref) => {
  if (!features || features.length === 0) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", // 4 columns on large screens
        className
      )}
    >
      {features.map((feature, index) => (
        <FeatureCard key={index} feature={feature} />
      ))}
    </div>
  );
});
FeatureGrid.displayName = "FeatureGrid";

export { FeatureGrid };
