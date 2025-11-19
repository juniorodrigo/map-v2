"use client"

import * as React from "react"
import { IoCheckmark } from "react-icons/io5"
import { cn } from "@/lib/utils"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

function Checkbox({
  className,
  checked,
  onCheckedChange,
  onChange,
  ...props
}: CheckboxProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e)
    onCheckedChange?.(e.target.checked)
  }

  return (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        data-slot="checkbox"
        checked={checked}
        onChange={handleChange}
        className={cn(
          "peer size-4 shrink-0 rounded-sm border border-input shadow-xs transition-all appearance-none cursor-pointer",
          "checked:bg-primary checked:border-primary",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
      <IoCheckmark 
        className={cn(
          "absolute left-0 size-4 pointer-events-none text-primary-foreground transition-opacity p-0.5",
          checked ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  )
}

export { Checkbox }
