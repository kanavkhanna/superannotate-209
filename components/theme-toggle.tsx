"use client"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  return (
    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 transition-all hover:bg-muted">
      <span className="sr-only">Theme toggle (disabled)</span>
    </Button>
  )
}

