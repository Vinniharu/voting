import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:shadow-xl hover:-translate-y-0.5 border border-blue-500/50 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700",
        destructive:
          "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:shadow-xl hover:-translate-y-0.5 border border-red-500/50",
        outline:
          "border-2 border-blue-500/50 bg-gray-900/50 text-blue-400 backdrop-blur-sm hover:bg-blue-500/10 hover:text-blue-300 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20",
        secondary:
          "bg-gradient-to-r from-gray-700 to-gray-600 text-white shadow-lg shadow-gray-500/25 hover:shadow-gray-500/40 hover:shadow-xl hover:-translate-y-0.5 border border-gray-500/50",
        ghost: 
          "text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 hover:shadow-lg hover:shadow-blue-500/20 rounded-lg",
        link: 
          "text-blue-400 underline-offset-4 hover:underline hover:text-blue-300 transition-colors",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-11 w-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 