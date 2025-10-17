import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: "primary" | "success" | "warning" | "danger";
}

export function StatCard({ label, value, icon, color = "primary" }: StatCardProps) {
  const colorClasses = {
    primary: "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400",
    success: "bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400",
    warning: "bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400",
    danger: "bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400",
  };

  return (
    <div className="flex items-center space-x-3">
      {icon && (
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
