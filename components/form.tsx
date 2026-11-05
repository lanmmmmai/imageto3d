"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import type * as z from "zod"
import { Form as UIForm } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { ImageIcon, SlidersHorizontal, ArrowUp } from "lucide-react"
import AutoResizeTextarea from "./auto-resize-textarea"
import ImageUploadArea from "./image-upload-area"
import { formSchema } from "@/lib/form-schema"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

interface FormProps {
  isLoading: boolean
  onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>
  onOpenOptions: () => void
}

export default function Form({ isLoading, onSubmit, onOpenOptions }: FormProps) {
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropAreaRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const dragCounter = useRef(0)
  const isMobile = useMediaQuery("(max-width: 768px)")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      images: [],
      condition_mode: "concat",
      quality: "medium",
      geometry_file_format: "glb",
      use_hyper: false,
      tier: "Regular",
      TAPose: false,
      material: "PBR",
    },
  })

  const addImages = useCallback(
    (files: File[]) => {
      if (files.length === 0) return
      setError(null)

      const currentImages = form.getValues("images") || []
      const totalImages = currentImages.length + files.length

      if (totalImages > 5) {
        setError("Bạn chỉ có thể tải lên tối đa 5 ảnh.")
        const allowedNewImages = Math.max(0, 5 - currentImages.length)
        files = files.slice(0, allowedNewImages)
        if (files.length === 0) return
      }

      const newPreviewUrls = files.map((file) => URL.createObjectURL(file))
      const updatedImages = [...currentImages, ...files]

      setPreviewUrls((prev) => [...prev, ...newPreviewUrls])
      form.setValue("images", updatedImages, { shouldValidate: true })
    },
    [form],
  )

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    addImages(files)
  }

  const removeImage = (index: number) => {
    const currentImages = form.getValues("images") || []
    const newImages = [...currentImages]
    newImages.splice(index, 1)

    setPreviewUrls((prev) => {
      const next = [...prev]
      if (next[index]) {
        URL.revokeObjectURL(next[index])
      }
      next.splice(index, 1)
      return next
    })

    form.setValue("images", newImages, { shouldValidate: true })
    if (newImages.length <= 5) {
      setError(null)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  /**
   * Process clipboard data to extract pasted images
   * Returns true if at least one image was found and added
   */
  const processClipboardData = useCallback(
    (clipboardData: DataTransfer | null): boolean => {
      if (!clipboardData || isLoading) return false

      const imageFiles: File[] = []

      // 1. Check direct files (e.g. copied from Windows Explorer or screenshot tool)
      if (clipboardData.files && clipboardData.files.length > 0) {
        for (let i = 0; i < clipboardData.files.length; i++) {
          const file = clipboardData.files[i]
          if (file.type.startsWith("image/")) {
            imageFiles.push(file)
          }
        }
      }

      // 2. Check clipboard items (e.g. copied image data from browser / clipboard)
      if (imageFiles.length === 0 && clipboardData.items && clipboardData.items.length > 0) {
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i]
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile()
            if (file) {
              const ext = item.type.split("/")[1]?.replace("+xml", "") || "png"
              const fileName =
                file.name && file.name !== "image.png"
                  ? file.name
                  : `pasted-image-${Date.now()}-${i + 1}.${ext}`
              imageFiles.push(new File([file], fileName, { type: file.type }))
            }
          }
        }
      }

      // 3. Check for Data URI image in plain text (e.g. data:image/png;base64,...)
      if (imageFiles.length === 0) {
        const text = clipboardData.getData("text/plain")?.trim()
        if (text && text.startsWith("data:image/")) {
          try {
            const parts = text.split(",")
            const mimeMatch = parts[0].match(/:(.*?);/)
            const mime = mimeMatch ? mimeMatch[1] : "image/png"
            const bstr = atob(parts[1])
            let n = bstr.length
            const u8arr = new Uint8Array(n)
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n)
            }
            const ext = mime.split("/")[1] || "png"
            const file = new File([u8arr], `pasted-image-${Date.now()}.${ext}`, { type: mime })
            imageFiles.push(file)
          } catch (err) {
            console.error("Failed to parse data URL from clipboard", err)
          }
        }
      }

      if (imageFiles.length > 0) {
        addImages(imageFiles)
        return true
      }

      return false
    },
    [isLoading, addImages],
  )

  // Local paste on textarea
  const handlePaste = (e: React.ClipboardEvent) => {
    const handled = processClipboardData(e.clipboardData)
    if (handled) {
      e.preventDefault()
    }
  }

  // Global paste listener: user can press Ctrl+V anywhere on the page
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Don't intercept if user is typing in another input (e.g. API key input in Settings dialog)
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "SELECT") &&
        target !== fileInputRef.current
      ) {
        return
      }

      if (e.clipboardData) {
        const handled = processClipboardData(e.clipboardData)
        if (handled) {
          e.preventDefault()
        }
      }
    }

    window.addEventListener("paste", handleGlobalPaste)
    return () => {
      window.removeEventListener("paste", handleGlobalPaste)
    }
  }, [processClipboardData])

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current += 1
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"))
      addImages(files)
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (!isMobile && !e.shiftKey) {
        e.preventDefault()
        formRef.current?.requestSubmit()
      }
    }
  }

  return (
    <UIForm {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="relative">
        <div
          ref={dropAreaRef}
          className={cn(
            "relative bg-black/60 backdrop-blur-md rounded-[24px] overflow-hidden transition-all shadow-lg border border-[rgba(255,255,255,0.12)]",
            isDragging ? "ring-2 ring-white" : isFocused ? "ring-2 ring-white" : "",
            isLoading && "animate-pulse-loading pointer-events-none opacity-70",
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onPaste={handlePaste}
        >
          {/* Image previews */}
          <ImageUploadArea previewUrls={previewUrls} onRemoveImage={removeImage} isLoading={isLoading} />

          <div className="px-2 py-1.5">
            <div className="flex items-center">
              <div className="flex space-x-0">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={triggerFileInput}
                  title="Chọn tệp ảnh hoặc nhấn Ctrl+V để dán ảnh trực tiếp"
                  className="text-gray-400 hover:text-white hover:bg-transparent rounded-full h-10 w-10 ml-0 transition-colors"
                  disabled={isLoading}
                >
                  <ImageIcon className="h-5 w-5" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onOpenOptions}
                  title="Cài đặt thông số / Chọn AI Engine"
                  className="text-gray-400 hover:text-white hover:bg-transparent rounded-full h-10 w-10 ml-0 transition-colors"
                  disabled={isLoading}
                >
                  <SlidersHorizontal className="h-5 w-5" />
                </Button>
              </div>

              <AutoResizeTextarea
                placeholder="Mô tả mô hình hoặc nhấn Ctrl+V để dán ảnh..."
                className="flex-1 bg-transparent border-0 focus:ring-0 text-white placeholder:text-gray-400 py-2 px-3 resize-none text-base tracking-normal"
                {...form.register("prompt")}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                disabled={isLoading}
              />

              <div>
                <Button
                  type="submit"
                  className="bg-white hover:bg-gray-200 text-black rounded-full h-10 w-10 p-0 flex items-center justify-center transition-transform hover:scale-105"
                  disabled={isLoading}
                  title="Tạo mô hình 3D"
                >
                  <ArrowUp className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {isDragging && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-none z-10">
              <p className="text-white font-medium tracking-normal text-lg">Thả ảnh vào đây...</p>
            </div>
          )}
        </div>

        {error && <div className="mt-2 text-red-400 text-sm tracking-normal px-2">{error}</div>}
      </form>
    </UIForm>
  )
}
