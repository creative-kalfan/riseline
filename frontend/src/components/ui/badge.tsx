import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-2 focus:outline-[var(--focus)] focus:outline-offset-2 select-none [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-brand bg-brand text-on-brand",
        secondary: "border-border bg-surface-muted text-secondary-foreground",
        destructive: "border-danger bg-danger text-on-brand",
        outline: "border-border-strong bg-surface text-foreground",
        success: "border-success/40 bg-success-subtle text-success",
        warning: "border-warning/40 bg-warning-subtle text-warning",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

const statusConfig = {
  success: { icon: CheckCircle2, label: "Success" },
  warning: { icon: AlertTriangle, label: "Warning" },
  danger: { icon: XCircle, label: "Attention" },
  brand: { icon: Info, label: "Info" },
  muted: { icon: Info, label: "Info" },
} as const;

export type StatusKind = keyof typeof statusConfig;

/** StatusChip renders icon + text so status is never color alone. */
function StatusChip({
  status,
  children,
  className,
}: {
  status: StatusKind;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = statusConfig[status].icon;
  const variant = status === "muted" ? "secondary" : status === "danger" ? "destructive" : status;
  return (
    <span
      role="status"
      aria-label={`${statusConfig[status].label}: ${typeof children === "string" ? children : ""}`}
      className={cn(badgeVariants({ variant: variant as BadgeProps["variant"] }), className)}
    >
      <Icon aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}

export { Badge, StatusChip, badgeVariants };
