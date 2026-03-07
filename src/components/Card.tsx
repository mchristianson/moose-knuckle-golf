import React from "react";

export type CardVariant = "default" | "elevated" | "bordered" | "transparent";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-white border border-neutral-100 rounded-lg shadow-sm",
  elevated: "bg-white border border-neutral-100 rounded-lg shadow-md",
  bordered: "bg-white border-2 border-neutral-100 rounded-lg",
  transparent: "bg-neutral-50 rounded-lg",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", className = "", children, ...props }, ref) => {
    const variantStyle = variantStyles[variant];
    const combinedClassName = `p-md ${variantStyle} ${className}`.trim();

    return (
      <div ref={ref} className={combinedClassName} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
