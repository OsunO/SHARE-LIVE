"use client"

import { Toaster as RadToaster } from "sonner"

export function Toaster() {
  return (
    <RadToaster 
      position="top-center"
      toastOptions={{
        style: {
          background: 'white',
          border: '1px solid #e5e7eb',
          padding: '16px',
          borderRadius: '8px',
        },
      }}
    />
  )
}
