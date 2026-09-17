import { cn } from "@/lib/utils/styles";

export function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-foreground text-background",
    secondary: "bg-muted text-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    outline: "text-foreground",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-none border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
