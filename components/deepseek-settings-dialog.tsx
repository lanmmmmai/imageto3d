"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Key, Sparkles, Check, ExternalLink, Globe, Box, Cpu, Zap, Activity } from "lucide-react"

export type EngineType = "colab" | "worldlabs" | "meshy" | "deepseek" | "hyper3d"

interface DeepSeekSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  colabUrl: string
  onSaveColabUrl: (url: string) => void
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
  colabUrl,
  onSaveColabUrl,
  apiKey,
  onSaveApiKey,
  meshyApiKey,
  onSaveMeshyApiKey,
  worldlabsApiKey,
  onSaveWorldlabsApiKey,
  engine,
  onEngineChange,
}: DeepSeekSettingsDialogProps) {
  const [localColabUrl, setLocalColabUrl] = useState(colabUrl)
  const [localDeepseekKey, setLocalDeepseekKey] = useState(apiKey)
  const [localMeshyKey, setLocalMeshyKey] = useState(meshyApiKey)
  const [localWorldlabsKey, setLocalWorldlabsKey] = useState(worldlabsApiKey)
  const [testingColab, setTestingColab] = useState(false)
  const [colabStatus, setColabStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLocalColabUrl(colabUrl)
  }, [colabUrl])

  useEffect(() => {
    setLocalDeepseekKey(apiKey)
  }, [apiKey])

  useEffect(() => {
    setLocalMeshyKey(meshyApiKey)
  }, [meshyApiKey])

  useEffect(() => {
    setLocalWorldlabsKey(worldlabsApiKey)
  }, [worldlabsApiKey])

  const testColabConnection = async () => {
    if (!localColabUrl || !localColabUrl.trim()) {
      setColabStatus({ ok: false, message: "Vui lòng nhập đường dẫn Colab URL trước." })
      return
    }

    setTestingColab(true)
    setColabStatus(null)
    try {
      const res = await fetch(`/api/colab?colabUrl=${encodeURIComponent(localColabUrl.trim())}`)
      const data = await res.json()
      if (res.ok && data.success) {
        setColabStatus({
          ok: true,
          message: `Kết nối thành công! GPU: ${data.data?.gpu || "NVIDIA T4"} (${data.data?.engine || "TripoSR"})`,
        })
      } else {
        setColabStatus({
          ok: false,
          message: data.message || "Không thể kết nối đến Colab. Kiểm tra xem Colab còn đang chạy không.",
        })
      }
    } catch (e) {
      setColabStatus({
        ok: false,
        message: "Lỗi kết nối. Hãy đảm bảo bạn đã chạy ô BƯỚC 2 trên Colab.",
      })
    } finally {
      setTestingColab(false)
    }
  }

  const handleSave = () => {
    onSaveColabUrl(localColabUrl.trim())
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
            <DialogTitle className="text-xl font-medium">Cài đặt AI Engine (Tạo 3D)</DialogTitle>
          </div>
          <DialogDescription className="text-gray-400 text-sm">
            Chọn công nghệ tạo 3D: Dùng Google Colab miễn phí hoặc các API thương mại
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Engine Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase tracking-wider text-gray-300">Công nghệ sinh 3D</Label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Google Colab GPU (FREE) */}
              <button
                type="button"
                onClick={() => onEngineChange("colab")}
                className={`col-span-2 flex flex-col p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                  engine === "colab"
                    ? "border-emerald-400 bg-emerald-500/15 text-white shadow-md ring-2 ring-emerald-500/50"
                    : "border-emerald-500/30 bg-emerald-950/20 text-gray-300 hover:border-emerald-400/50"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-xs text-white flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-emerald-400" /> ⚡ Google Colab GPU (TripoSR)
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/40">
                      Miễn phí 100% • Không cần mua Key
                    </span>
                  </span>
                  {engine === "colab" && <Check className="h-4 w-4 text-emerald-400" />}
                </div>
                <span className="text-[11px] text-gray-300 leading-normal">
                  Chạy mô hình TripoSR trên GPU T4 của Google Colab. Tạo 3D cực nhanh (~1.5s), không mất phí.
                </span>
              </button>

              {/* World Labs */}
              <button
                type="button"
                onClick={() => onEngineChange("worldlabs")}
                className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                  engine === "worldlabs"
                    ? "border-blue-500 bg-blue-500/10 text-white shadow-sm ring-1 ring-blue-500/50"
                    : "border-white/10 bg-black/40 text-gray-400 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-semibold text-xs text-white flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-blue-400" /> 🌍 World Labs
                  </span>
                  {engine === "worldlabs" && <Check className="h-3.5 w-3.5 text-blue-400" />}
                </div>
                <span className="text-[11px] text-gray-400 leading-tight">
                  Tạo bối cảnh không gian 3D tương tác từ ảnh toàn cảnh.
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
                  Tạo nhân vật / đồ vật 3D chi tiết có texture (cần key).
                </span>
              </button>

              {/* DeepSeek 3D */}
              <button
                type="button"
                onClick={() => onEngineChange("deepseek")}
                className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                  engine === "deepseek"
                    ? "border-purple-500 bg-purple-500/10 text-white shadow-sm ring-1 ring-purple-500/50"
                    : "border-white/10 bg-black/40 text-gray-400 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-semibold text-xs text-white flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-purple-400" /> 🚀 DeepSeek 3D
                  </span>
                  {engine === "deepseek" && <Check className="h-3.5 w-3.5 text-purple-400" />}
                </div>
                <span className="text-[11px] text-gray-400 leading-tight">
                  Tạo mô hình Three.js bằng code sinh từ văn bản prompt.
                </span>
              </button>

              {/* Hyper3D Rodin */}
              <button
                type="button"
                onClick={() => onEngineChange("hyper3d")}
                className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                  engine === "hyper3d"
                    ? "border-pink-500 bg-pink-500/10 text-white shadow-sm ring-1 ring-pink-500/50"
                    : "border-white/10 bg-black/40 text-gray-400 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-semibold text-xs text-white">🌐 Hyper3D Rodin</span>
                  {engine === "hyper3d" && <Check className="h-3.5 w-3.5 text-pink-400" />}
                </div>
                <span className="text-[11px] text-gray-400 leading-tight">
                  Mô hình 3D từ text/ảnh (cần Rodin key có credit).
                </span>
              </button>
            </div>
          </div>

          {/* Google Colab Configuration Input */}
          <div className="space-y-2.5 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <Label htmlFor="colab-url" className="text-xs font-mono uppercase tracking-wider text-emerald-300 flex items-center gap-1.5 font-bold">
                <Zap className="h-4 w-4 text-emerald-400" />
                Google Colab Backend URL (Miễn Phí 100%)
              </Label>
              <a
                href="https://colab.research.google.com/github/lanmmmmai/imageto3d/blob/main/colab_3d_backend.ipynb"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors"
              >
                Mở Colab Notebook <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="flex gap-2">
              <Input
                id="colab-url"
                type="text"
                placeholder="https://xyz.trycloudflare.com hoặc https://xyz.gradio.live"
                value={localColabUrl}
                onChange={(e) => setLocalColabUrl(e.target.value)}
                className="bg-black/60 border-emerald-500/30 text-white font-mono text-sm placeholder:text-gray-500 focus-visible:ring-emerald-500 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={testColabConnection}
                disabled={testingColab}
                className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 text-xs whitespace-nowrap"
              >
                {testingColab ? <Activity className="h-3.5 w-3.5 animate-spin" /> : "Kiểm tra"}
              </Button>
            </div>

            {colabStatus && (
              <div
                className={`text-xs p-2 rounded-lg border ${
                  colabStatus.ok
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200"
                    : "bg-red-500/20 border-red-500/50 text-red-200"
                }`}
              >
                {colabStatus.message}
              </div>
            )}

            <p className="text-[11px] text-gray-300 leading-relaxed">
              💡 <strong>Cách lấy URL:</strong> Bấm nút <em>Mở Colab Notebook</em> ở trên $\rightarrow$ Nhấn <em>Run all</em> $\rightarrow$ Sao chép link <code className="text-emerald-300 bg-black/40 px-1 py-0.5 rounded">https://...trycloudflare.com</code> dán vào đây!
            </p>
          </div>

          {/* World Labs API Key Input */}
          <div className="space-y-2 bg-blue-500/5 p-3.5 rounded-xl border border-blue-500/20">
            <div className="flex items-center justify-between">
              <Label htmlFor="worldlabs-key" className="text-xs font-mono uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-blue-400" />
                World Labs API Key (Tùy chọn)
              </Label>
              <a
                href="https://worldlabs.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline flex items-center gap-1"
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
              className="bg-black/60 border-white/15 text-white font-mono text-sm placeholder:text-gray-500 focus-visible:ring-blue-500"
            />
          </div>

          {/* Meshy API Key Input */}
          <div className="space-y-2 bg-amber-500/5 p-3.5 rounded-xl border border-amber-500/20">
            <div className="flex items-center justify-between">
              <Label htmlFor="meshy-key" className="text-xs font-mono uppercase tracking-wider text-amber-200 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-amber-400" />
                Meshy API Key (Tùy chọn)
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
                <Key className="h-3.5 w-3.5 text-purple-400" />
                DeepSeek API Key (Tùy chọn)
              </Label>
              <a
                href="https://platform.deepseek.com/api_keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-400 hover:underline flex items-center gap-1"
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
              className="bg-black/60 border-white/15 text-white font-mono text-sm placeholder:text-gray-500 focus-visible:ring-purple-500"
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
