import * as React from "react"
import { cn } from "../../lib/utils"
import { THEME_TRANSITIONS } from "../../utils/themeUtils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-gray-200 dark:border-gray-700",
        "bg-white dark:bg-gray-800 px-3 py-2 text-sm",
        "ring-offset-background",
        "placeholder:text-gray-500 dark:placeholder:text-gray-400",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        THEME_TRANSITIONS.default,
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea } 