import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-gray-600/50 bg-gray-900/70 backdrop-blur-sm px-4 py-2 text-base text-white placeholder:text-gray-400 transition-all duration-300",
          "focus:border-blue-500 focus:bg-gray-900/90 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:shadow-lg focus:shadow-blue-500/10",
          "hover:border-gray-500/70 hover:bg-gray-900/80",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input } 