"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Key, Sparkles, Check, ExternalLink, Globe, Box, Cpu } from "lucide-react"

export type EngineType = "worldlabs" | "meshy" | "deepseek" | "hyper3d"

interface DeepSeekSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  apiKey: string
  onSaveApiKey: (key: string) => void
  meshyApiKey: string
  onSaveMeshyApiKey: (key: string) => void
  worldlabsApiKey: string
  onSaveWorldlabsApiKey: (key: string) => void
  engine: EngineType
  onEngineChange: (engine: EngineType) => void
}

export default function DeepSeekSettingsDialog({
  open,
  onOpenChange,
  apiKey,
  onSaveApiKey,
  meshyApiKey,
  onSaveMeshyApiKey,
  worldlabsApiKey,
  onSaveWorldlabsApiKey,
  engine,
  onEngineChange,
}: DeepSeekSettingsDialogProps) {
  const [localDeepseekKey, setLocalDeepseekKey] = useState(apiKey)
  const [localMeshyKey, setLocalMeshyKey] = useState(meshyApiKey)
  const [localWorldlabsKey, setLocalWorldlabsKey] = useState(worldlabsApiKey)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLocalDeepseekKey(apiKey)
  }, [apiKey])

  useEffect(() => {
    setLocalMeshyKey(meshyApiKey)
  }, [meshyApiKey])

  useEffect(() => {
    setLocalWorldlabsKey(worldlabsApiKey)
  }, [worldlabsApiKey])

  const handleSave = () => {
    onSaveApiKey(localDeepseekKey.trim())
    onSaveMeshyApiKey(localMeshyKey.trim())
    onSaveWorldlabsApiKey(localWorldlabsKey.trim())
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onOpenChange(false)
    }, 800)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f1117] border border-white/10 text-white max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            <DialogTitle className="text-xl font-medium">Cài đặt AI Engine (3D Generator)</DialogTitle>
          </div>
          <DialogDescription className="text-gray-400 text-sm">
            Chọn công nghệ tạo 3D phù hợp với loại hình ảnh của bạn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Engine Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase tracking-wider text-gray-300">Công nghệ sinh 3D</Label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* World Labs */}
              <button
                type="button"
                onClick={() => onEngineChange("worldlabs")}
                className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                  engine === "worldlabs"
                    ? "border-emerald-500 bg-emerald-500/10 text-white shadow-sm ring-1 ring-emerald-500/50"
                    : "border-white/10 bg-black/40 text-gray-400 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-semibold text-xs text-white flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-emerald-400" /> 🌍 World Labs
                  </span>
                  {engine === "worldlabs" && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                </div>
                <span className="text-[11px] text-gray-400 leading-tight">
                  Tạo bối cảnh thế giới 3D, phối cảnh toàn cảnh rộng lớn (Marble).
                </span>
              </button>

              {/* Meshy AI */}
              <button
                type="button"
                onClick={() => onEngineChange("meshy")}
                className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                  engine === "meshy"
                    ? "border-amber-500 bg-amber-500/10 text-white shadow-sm ring-1 ring-amber-500/50"
                    : "border-white/10 bg-black/40 text-gray-400 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-semibold text-xs text-white flex items-center gap-1.5">
                    <Box className="h-3.5 w-3.5 text-amber-400" /> 🌟 Meshy AI
                  </span>
                  {engine === "meshy" && <Check className="h-3.5 w-3.5 text-amber-400" />}
                </div>
                <span className="text-[11px] text-gray-400 leading-tight">
                  Biến ảnh 2D thành nhân vật / đồ vật 3D thực tế, đủ texture.
                </span>
              </button>

              {/* DeepSeek 3D */}
              <button
                type="button"
                onClick={() => onEngineChange("deepseek")}
                className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                  engine === "deepseek"
                    ? "border-blue-500 bg-blue-500/10 text-white shadow-sm ring-1 ring-blue-500/50"
                    : "border-white/10 bg-black/40 text-gray-400 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-semibold text-xs text-white flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-blue-400" /> 🚀 DeepSeek 3D
                  </span>
                  {engine === "deepseek" && <Check className="h-3.5 w-3.5 text-blue-400" />}
                </div>
                <span className="text-[11px] text-gray-400 leading-tight">
                  Tạo mô hình hình khối Three.js bằng code từ văn bản prompt.
                </span>
              </button>

              {/* Hyper3D Rodin */}
              <button
                type="button"
                onClick={() => onEngineChange("hyper3d")}
                className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                  engine === "hyper3d"
                    ? "border-purple-500 bg-purple-500/10 text-white shadow-sm ring-1 ring-purple-500/50"
                    : "border-white/10 bg-black/40 text-gray-400 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-semibold text-xs text-white">🌐 Hyper3D Rodin</span>
                  {engine === "hyper3d" && <Check className="h-3.5 w-3.5 text-purple-400" />}
                </div>
                <span className="text-[11px] text-gray-400 leading-tight">
                  Cloud Mesh từ text/ảnh (cần key Rodin có credit).
                </span>
              </button>
            </div>
          </div>

          {/* World Labs API Key Input */}
          <div className="space-y-2 bg-emerald-500/5 p-3.5 rounded-xl border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <Label htmlFor="worldlabs-key" className="text-xs font-mono uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-emerald-400" />
                World Labs API Key (Tạo Thế Giới / Phong Cảnh Toàn Cảnh)
              </Label>
              <a
                href="https://worldlabs.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
              >
                WorldLabs.ai <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <Input
              id="worldlabs-key"
              type="password"
              placeholder="WLT-... hoặc API Key của bạn"
              value={localWorldlabsKey}
              onChange={(e) => setLocalWorldlabsKey(e.target.value)}
              className="bg-black/60 border-white/15 text-white font-mono text-sm placeholder:text-gray-500 focus-visible:ring-emerald-500"
            />
            <p className="text-[11px] text-gray-400">
              Chuyên biệt để biến ảnh phong cảnh / bối cảnh game rộng lớn thành không gian 3D tương tác.
            </p>
          </div>

          {/* Meshy API Key Input */}
          <div className="space-y-2 bg-amber-500/5 p-3.5 rounded-xl border border-amber-500/20">
            <div className="flex items-center justify-between">
              <Label htmlFor="meshy-key" className="text-xs font-mono uppercase tracking-wider text-amber-200 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-amber-400" />
                Meshy API Key (Nhân vật & Đồ vật đơn lẻ)
              </Label>
              <a
                href="https://www.meshy.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-amber-400 hover:underline flex items-center gap-1"
              >
                Meshy.ai <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <Input
              id="meshy-key"
              type="password"
              placeholder="msy_..."
              value={localMeshyKey}
              onChange={(e) => setLocalMeshyKey(e.target.value)}
              className="bg-black/60 border-white/15 text-white font-mono text-sm placeholder:text-gray-500 focus-visible:ring-amber-500"
            />
          </div>

          {/* DeepSeek API Key Input */}
          <div className="space-y-2 bg-white/5 p-3.5 rounded-xl border border-white/5">
            <div className="flex items-center justify-between">
              <Label htmlFor="deepseek-key" className="text-xs font-mono uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-blue-400" />
                DeepSeek API Key (Tùy chọn)
              </Label>
              <a
                href="https://platform.deepseek.com/api_keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline flex items-center gap-1"
              >
                Lấy key <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <Input
              id="deepseek-key"
              type="password"
              placeholder="sk-..."
              value={localDeepseekKey}
              onChange={(e) => setLocalDeepseekKey(e.target.value)}
              className="bg-black/60 border-white/15 text-white font-mono text-sm placeholder:text-gray-500 focus-visible:ring-blue-500"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-white hover:bg-white/5"
          >
            Đóng
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-5"
          >
            {saved ? (
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4" /> Đã lưu
              </span>
            ) : (
              "Lưu cấu hình"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
