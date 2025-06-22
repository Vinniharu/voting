import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-3 py-1 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-blue-500/50 bg-blue-500/20 text-blue-300 shadow-lg shadow-blue-500/20 hover:bg-blue-500/30 hover:shadow-blue-500/30",
        secondary:
          "border-gray-600/50 bg-gray-700/50 text-gray-300 hover:bg-gray-600/50",
        destructive:
          "border-red-500/50 bg-red-500/20 text-red-300 shadow-lg shadow-red-500/20 hover:bg-red-500/30",
        success:
          "border-green-500/50 bg-green-500/20 text-green-300 shadow-lg shadow-green-500/20 hover:bg-green-500/30",
        warning:
          "border-yellow-500/50 bg-yellow-500/20 text-yellow-300 shadow-lg shadow-yellow-500/20 hover:bg-yellow-500/30",
        outline: 
          "border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300",
        neon:
          "border-blue-400 bg-blue-500/10 text-blue-300 shadow-lg shadow-blue-500/30 animate-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants } 