import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border-0 bg-secondary px-2.5 py-2 text-base text-foreground transition-colors outline-none placeholder:text-foreground-subtle focus-visible:ring-1 focus-visible:ring-foreground/5 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 aria-invalid:ring-1 aria-invalid:ring-destructive/30 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
