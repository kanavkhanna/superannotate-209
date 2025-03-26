"use client"

import { Toaster } from "sonner"

export function SonnerProvider() {
  return <Toaster position="top-right" theme="light" closeButton richColors expand={false} />
}

