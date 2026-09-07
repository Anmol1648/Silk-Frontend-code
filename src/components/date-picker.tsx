import * as React from "react"
import { format, parseISO } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  id,
  className
}: {
  value?: string
  onChange: (date: string) => void
  placeholder?: string
  id?: string
  className?: string
}) {
  const date = value ? parseISO(value) : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className={cn(
            "w-full rounded-lg border border-input bg-background px-3 py-2.5",
            "text-[14px] text-left flex items-center justify-start gap-2.5",
            "outline-none transition-colors cursor-pointer",
            "focus:border-foreground/25 focus:ring-2 focus:ring-foreground/4",
            "data-[state=open]:border-foreground/25 data-[state=open]:ring-2 data-[state=open]:ring-foreground/4",
            !date && "text-foreground-subtle",
            className
          )}
        >
          <HugeiconsIcon icon={Calendar01Icon} size={16} className="text-foreground-subtle shrink-0" strokeWidth={2} />
          <span className="truncate">{date ? format(date, "PPP") : placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ? format(d, 'yyyy-MM-dd') : '')}
          initialFocus
          captionLayout="dropdown"
          startMonth={new Date(1990, 0)}
          endMonth={new Date()}
        />
      </PopoverContent>
    </Popover>
  )
}
