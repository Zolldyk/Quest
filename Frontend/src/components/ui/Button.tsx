'use client';

// ============ Imports ============
import { forwardRef } from 'react';
// Using a simplified approach without external dependencies

// Simple className concatenation utility
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Simple variant handler
function cva(base: string, config: any) {
  return ({ variant, size, className }: any) => {
    const variantClass = variant && config.variants?.variant?.[variant] || config.variants?.variant?.default || '';
    const sizeClass = size && config.variants?.size?.[size] || config.variants?.size?.default || '';
    return cn(base, variantClass, sizeClass, className);
  };
}
import LoadingSpinner from './LoadingSpinner';

// ============ Button Variants ============
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary-600 text-white hover:bg-primary-700",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary-100 text-secondary-900 hover:bg-secondary-200",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary-600 underline-offset-4 hover:underline",
        success: "bg-green-600 text-white hover:bg-green-700",
        warning: "bg-yellow-600 text-white hover:bg-yellow-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// ============ Types ============
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success' | 'warning';
  size?: 'default' | 'sm' | 'lg' | 'xl' | 'icon';
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

/**
 * @title Button
 * @notice Reusable button component with multiple variants and states
 * @dev Built with class-variance-authority for consistent styling
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

// ============ Button Group Component ============
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function ButtonGroup({ 
  children, 
  className = "",
  orientation = 'horizontal'
}: ButtonGroupProps) {
  return (
    <div 
      className={cn(
        "inline-flex",
        orientation === 'horizontal' ? "flex-row" : "flex-col",
        "[&>button]:rounded-none [&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-r-md",
        orientation === 'vertical' && "[&>button:first-child]:rounded-t-md [&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-b-md [&>button:last-child]:rounded-r-md",
        "[&>button:not(:first-child)]:border-l-0",
        orientation === 'vertical' && "[&>button:not(:first-child)]:border-l [&>button:not(:first-child)]:border-t-0",
        className
      )}
    >
      {children}
    </div>
  );
}

// ============ Icon Button Component ============
interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, size = "icon", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={size}
        className={className}
        {...props}
      >
        {icon}
      </Button>
    )
  }
)
IconButton.displayName = "IconButton"

// ============ Toggle Button Component ============
interface ToggleButtonProps extends Omit<ButtonProps, 'variant'> {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
}

export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(
  ({ pressed = false, onPressedChange, className, onClick, ...props }, ref) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onPressedChange?.(!pressed);
      onClick?.(event);
    };

    return (
      <Button
        ref={ref}
        variant={pressed ? "default" : "outline"}
        className={cn(
          pressed && "bg-primary-600 text-white",
          className
        )}
        onClick={handleClick}
        aria-pressed={pressed}
        {...props}
      />
    )
  }
)
ToggleButton.displayName = "ToggleButton"

// ============ Floating Action Button ============
interface FloatingActionButtonProps extends ButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export function FloatingActionButton({ 
  position = 'bottom-right',
  className,
  size = "lg",
  ...props 
}: FloatingActionButtonProps) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6', 
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  return (
    <Button
      size={size}
      className={cn(
        "fixed z-50 rounded-full shadow-lg hover:shadow-xl transition-shadow",
        positionClasses[position],
        className
      )}
      {...props}
    />
  );
}

// ============ Button With Badge ============
interface ButtonWithBadgeProps extends ButtonProps {
  badgeContent?: string | number;
  badgeColor?: 'red' | 'blue' | 'green' | 'yellow' | 'purple';
}

export function ButtonWithBadge({ 
  badgeContent,
  badgeColor = 'red',
  children,
  className,
  ...props 
}: ButtonWithBadgeProps) {
  const badgeColorClasses = {
    red: 'bg-red-500 text-white',
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    yellow: 'bg-yellow-500 text-black',
    purple: 'bg-purple-500 text-white',
  };

  return (
    <div className="relative inline-flex">
      <Button className={className} {...props}>
        {children}
      </Button>
      {badgeContent && (
        <span className={cn(
          "absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold",
          badgeColorClasses[badgeColor]
        )}>
          {badgeContent}
        </span>
      )}
    </div>
  );
}