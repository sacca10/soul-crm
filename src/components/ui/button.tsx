import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Primary = premium violet (gradient + subtle inner highlight)
        default: [
          "relative text-[hsl(var(--primary-foreground))] font-semibold",
          "bg-[linear-gradient(135deg,#c46bff_0%,#9b6dff_50%,#6d28d9_100%)]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_2px_rgba(0,0,0,0.6)]",
          "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_0_18px_rgba(155,109,255,0.45)]",
          "hover:brightness-110 active:brightness-95",
        ].join(" "),
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        // Outline with subtle blue border on hover
        outline: [
          "border border-border bg-transparent text-foreground",
          "hover:border-[hsl(var(--gold)/0.6)] hover:text-[hsl(var(--gold-light))]",
          "hover:bg-[hsl(var(--gold)/0.05)]",
        ].join(" "),
        secondary:
          "bg-secondary text-secondary-foreground border border-border/60 hover:bg-secondary/80",
        ghost:
          "hover:bg-[hsl(var(--gold)/0.08)] hover:text-[hsl(var(--gold-light))]",
        link: "text-[hsl(var(--gold-light))] underline-offset-4 hover:underline",
        // Blue "tonal" variant: filled blue with darker bg
        gold: [
          "border border-[hsl(var(--gold)/0.4)] bg-[hsl(var(--gold)/0.1)]",
          "text-[hsl(var(--gold-light))] font-semibold",
          "hover:bg-[hsl(var(--gold)/0.18)] hover:border-[hsl(var(--gold)/0.7)]",
        ].join(" "),
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
