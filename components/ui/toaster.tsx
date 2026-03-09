"use client"

import { Toaster as RadToaster } from "sonner"
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react"

export function Toaster() {
  return (
    <RadToaster 
      position="top-center"
      toastOptions={{
        style: {
          background: 'white',
          border: '1px solid rgba(147, 51, 234, 0.2)',
          padding: '16px 20px',
          borderRadius: '16px',
          boxShadow: '0 10px 40px -10px rgba(147, 51, 234, 0.2), 0 4px 12px rgba(0, 0, 0, 0.08)',
        },
        className: 'font-sans',
      }}
      icons={{
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        error: <XCircle className="w-5 h-5 text-red-500" />,
        warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
      }}
    />
  )
}
