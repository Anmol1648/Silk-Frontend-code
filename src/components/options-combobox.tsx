'use client'

import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { UnfoldMoreIcon, Tick02Icon, Search01Icon } from '@hugeicons/core-free-icons'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command as CommandPrimitive } from 'cmdk'
import { cn } from '@/lib/utils'

export function OptionsCombobox({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No results.',
  id,
  className,
  triggerClassName,
  contentClassName,
  searchable = true,
}: {
  value: string
  onChange: (v: string) => void
  options: readonly (string | { label: string; value: string })[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  id?: string
  className?: string
  triggerClassName?: string
  contentClassName?: string
  /** When false, hides the search row (short fixed lists). */
  searchable?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full rounded-lg border border-input bg-background px-3 py-2.5',
            'text-[14px] text-left flex items-center justify-between gap-2',
            'outline-none transition-colors cursor-pointer',
            'focus:border-foreground/25 focus:ring-2 focus:ring-foreground/4',
            open && 'border-foreground/25 ring-2 ring-foreground/4',
            value ? 'text-foreground' : 'text-foreground-subtle',
            triggerClassName,
            className,
          )}
        >
          <span className="truncate">
            {value
              ? (options.find((o: any) => (typeof o === 'object' && o !== null ? o.value : o) === value) as any)?.label || 
                 (options.find((o: any) => (typeof o === 'object' && o !== null ? o.value : o) === value) as any)?.value ||
                 options.find((o: any) => o === value) || 
                 value
              : placeholder}
          </span>
          <HugeiconsIcon
            icon={UnfoldMoreIcon}
            size={16}
            className="shrink-0 text-foreground-subtle"
            strokeWidth={2}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className={cn(
          "z-[9999] w-[var(--radix-popover-trigger-width)] p-0 gap-0 rounded-xl ring-1 ring-foreground/6 shadow-popover",
          contentClassName
        )}
      >
        <CommandPrimitive
          className="flex flex-col overflow-hidden rounded-xl bg-background"
          filter={(val, search) =>
            val.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          {searchable && (
            <div className="flex items-center gap-2.5 px-3.5 h-11 border-b border-border">
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                className="text-foreground-subtle shrink-0"
                strokeWidth={2}
              />
              <CommandPrimitive.Input
                placeholder={searchPlaceholder}
                style={{ border: 'none', boxShadow: 'none' }}
                className="w-full h-full text-[14px] text-foreground placeholder:text-foreground-subtle outline-none border-none shadow-none focus:ring-0 bg-transparent"
              />
            </div>
          )}

          <CommandPrimitive.List className="max-h-[216px] overflow-y-auto overflow-x-hidden p-1.5">
            <CommandPrimitive.Empty className="py-8 text-center text-[14px] text-foreground-subtle">
              {emptyText}
            </CommandPrimitive.Empty>
            {options.map((opt: any) => {
              const optLabel = typeof opt === 'object' && opt !== null ? opt.label : opt
              const optValue = typeof opt === 'object' && opt !== null ? opt.value : opt
              const selected = value === optValue
              return (
                <CommandPrimitive.Item
                  key={String(optValue)}
                  value={String(optValue)}
                  onSelect={() => {
                    onChange(optValue)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer',
                    'text-[14px] text-secondary-foreground outline-none select-none',
                    'data-[selected=true]:bg-primary/[0.06] data-[selected=true]:text-foreground',
                    selected && 'text-primary font-medium',
                  )}
                >
                  <span className="truncate">{optLabel}</span>
                  {selected && (
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      size={16}
                      className="shrink-0 text-primary"
                      strokeWidth={2.5}
                    />
                  )}
                </CommandPrimitive.Item>
              )
            })}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </PopoverContent>
    </Popover>
  )
}
