"use client"

import { X } from "lucide-react"

interface ImageUploadAreaProps {
  previewUrls: string[]
  onRemoveImage: (index: number) => void
  isLoading?: boolean
}

export default function ImageUploadArea({ previewUrls, onRemoveImage, isLoading = false }: ImageUploadAreaProps) {
  if (previewUrls.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pt-3 pointer-events-auto">
      {previewUrls.map((url, index) => (
        <div key={index} className="relative h-16 w-16 group">
          <img
            src={url || "/placeholder.svg"}
            alt={`Preview ${index + 1}`}
            className="h-full w-full object-cover rounded-xl border border-white/20 shadow-md"
          />
          {!isLoading && (
            <button
              type="button"
              onClick={() => onRemoveImage(index)}
              className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 rounded-full p-0.5 text-white shadow-md transition-transform hover:scale-110"
              title="Xóa ảnh này"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
      <span className="text-xs text-gray-400 pl-1">
        ({previewUrls.length}/5 ảnh • Dán thêm bằng Ctrl+V)
      </span>
    </div>
  )
}
