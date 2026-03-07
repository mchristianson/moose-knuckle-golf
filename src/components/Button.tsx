import React from "react";

type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "ghost";
type ButtonSize = "small" | "default" | "large" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  asChild?: boolean;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark active:bg-primary-dark",
  secondary: "bg-secondary text-white hover:bg-secondary-dark active:bg-secondary-dark",
  success: "bg-success text-white hover:bg-green-700 active:bg-green-700",
  danger: "bg-danger text-white hover:bg-red-700 active:bg-red-700",
  ghost: "border border-neutral-400 text-neutral-900 hover:bg-neutral-50 active:bg-neutral-100",
};

const sizeStyles: Record<ButtonSize, string> = {
  small: "px-3 py-2 text-sm",
  default: "px-4 py-3 text-base",
  large: "px-6 py-4 text-base",
  icon: "p-2 min-w-10 min-h-10",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "default",
      isLoading = false,
      disabled,
      className = "",
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyle = variantStyles[variant];
    const sizeStyle = sizeStyles[size];

    const combinedClassName = `${baseStyles} ${variantStyle} ${sizeStyle} ${className}`.trim();

    // If asChild is true, clone the child element and apply button classes
    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<any>;
      const childClassName = child.props?.className || "";
      const newClassName = `${combinedClassName} ${childClassName}`.trim();

      return React.cloneElement(child, {
        className: newClassName,
      } as any);
    }

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="inline-block mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
