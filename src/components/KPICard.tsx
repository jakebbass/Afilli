import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { ReactNode } from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  format?: "number" | "currency" | "percentage";
}

export function KPICard({
  title,
  value,
  change,
  changeLabel = "vs last period",
  icon,
  trend,
  format = "number",
}: KPICardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === "string") return val;
    
    switch (format) {
      case "currency":
        return `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case "percentage":
        return `${(val * 100).toFixed(2)}%`;
      default:
        return val.toLocaleString();
    }
  };

  const getTrendColor = () => {
    if (!trend) return "text-gray-500";
    switch (trend) {
      case "up":
        return "text-success-600 dark:text-success-500";
      case "down":
        return "text-danger-600 dark:text-danger-500";
      default:
        return "text-gray-500";
    }
  };

  const TrendIcon = trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {formatValue(value)}
          </p>
          {change !== undefined && (
            <div className="mt-2 flex items-center space-x-1">
              <TrendIcon className={`h-4 w-4 ${getTrendColor()}`} />
              <span className={`text-sm font-medium ${getTrendColor()}`}>
                {change > 0 ? "+" : ""}{change.toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {changeLabel}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
