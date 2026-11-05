"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy, Check, Code2 } from "lucide-react"

interface CodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  code: string
  prompt?: string
}

export default function CodeDialog({ open, onOpenChange, code, prompt }: CodeDialogProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy code", err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0b0d13] border border-white/10 text-white max-w-3xl max-h-[85vh] flex flex-col p-6 shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-blue-400" />
            <DialogTitle className="text-lg font-medium text-white">Three.js Procedural Code</DialogTitle>
          </div>
          <Button
            size="sm"
            onClick={handleCopy}
            className="bg-white/10 hover:bg-white/20 text-white text-xs border border-white/10 flex items-center gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Đã sao chép" : "Sao chép Code"}
          </Button>
        </DialogHeader>

        {prompt && (
          <p className="text-xs text-gray-400 pt-2 font-mono">
            Prompt: <span className="text-gray-200">{prompt}</span>
          </p>
        )}

        <div className="flex-1 overflow-auto rounded-lg bg-black/70 p-4 border border-white/5 font-mono text-xs text-blue-200/90 leading-relaxed mt-2 selection:bg-blue-600/40">
          <pre>{code}</pre>
        </div>
      </DialogContent>
    </Dialog>
  )
}
