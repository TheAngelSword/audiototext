import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-fg hover:bg-accent-hover disabled:bg-accent/50",
  secondary:
    "bg-surface text-fg border border-border hover:bg-surface-2",
  ghost: "bg-transparent text-fg hover:bg-surface-2",
  danger: "bg-danger text-on-danger hover:opacity-90",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(function Button({ className, variant = "primary", type = "button", ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium",
        "transition-colors duration-(--motion-quick) ease-(--ease-out)",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});
