"use client"

import { useState, useEffect } from "react"
import { ExternalLink, Download, ArrowLeft, Settings, Code2, Sparkles, Globe, Box, Zap } from "lucide-react"
import * as THREE from "three"
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js"
import type { FormValues } from "@/lib/form-schema"
import {
  submitRodinJob,
  checkJobStatus,
  downloadModel,
  generateWithDeepSeek,
  submitMeshyJob,
  checkMeshyStatus,
  submitWorldLabsJob,
  checkWorldLabsStatus,
} from "@/lib/api-service"
import ModelViewer from "./model-viewer"
import Form from "./form"
import StatusIndicator from "./status-indicator"
import OptionsDialog from "./options-dialog"
import DeepSeekSettingsDialog, { EngineType } from "./deepseek-settings-dialog"
import CodeDialog from "./code-dialog"
import { Button } from "@/components/ui/button"
import { useMediaQuery } from "@/hooks/use-media-query"

export default function Rodin() {
  const [engine, setEngine] = useState<EngineType>("colab")
  const [colabUrl, setColabUrl] = useState<string>("")
  const [deepseekApiKey, setDeepseekApiKey] = useState<string>("")
  const [meshyApiKey, setMeshyApiKey] = useState<string>("")
  const [worldlabsApiKey, setWorldlabsApiKey] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [worldMarbleUrl, setWorldMarbleUrl] = useState<string | null>(null)
  const [threeObject, setThreeObject] = useState<THREE.Object3D | null>(null)
  const [generatedCode, setGeneratedCode] = useState<string>("")
  const [currentPrompt, setCurrentPrompt] = useState<string>("")
  const [jobStatuses, setJobStatuses] = useState<Array<{ uuid: string; status: string }>>([])
  const [showOptions, setShowOptions] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [showPromptContainer, setShowPromptContainer] = useState(true)
  const isMobile = useMediaQuery("(max-width: 768px)")

  const [options, setOptions] = useState({
    condition_mode: "concat" as const,
    quality: "medium" as const,
    geometry_file_format: "glb" as const,
    use_hyper: false,
    tier: "Regular" as const,
    TAPose: false,
    material: "PBR" as const,
  })

  // Load saved API keys and engine choice from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDeepseekKey = localStorage.getItem("deepseek_api_key")
      if (savedDeepseekKey) setDeepseekApiKey(savedDeepseekKey)

      const savedMeshyKey = localStorage.getItem("meshy_api_key")
      if (savedMeshyKey) setMeshyApiKey(savedMeshyKey)

      const savedWorldlabsKey = localStorage.getItem("worldlabs_api_key")
      if (savedWorldlabsKey) setWorldlabsApiKey(savedWorldlabsKey)

      const savedColabUrl = localStorage.getItem("colab_backend_url")
      if (savedColabUrl) setColabUrl(savedColabUrl)

      const savedEngine = localStorage.getItem("preferred_3d_engine") as EngineType | null
      if (savedEngine && ["colab", "worldlabs", "meshy", "deepseek", "hyper3d"].includes(savedEngine)) {
        setEngine(savedEngine)
      } else {
        setEngine("colab")
      }
    }
  }, [])

  const handleSaveColabUrl = (url: string) => {
    setColabUrl(url)
    if (typeof window !== "undefined") {
      localStorage.setItem("colab_backend_url", url)
    }
  }

  const handleSaveApiKey = (key: string) => {
    setDeepseekApiKey(key)
    if (typeof window !== "undefined") {
      localStorage.setItem("deepseek_api_key", key)
    }
  }

  const handleSaveMeshyApiKey = (key: string) => {
    setMeshyApiKey(key)
    if (typeof window !== "undefined") {
      localStorage.setItem("meshy_api_key", key)
    }
  }

  const handleSaveWorldlabsApiKey = (key: string) => {
    setWorldlabsApiKey(key)
    if (typeof window !== "undefined") {
      localStorage.setItem("worldlabs_api_key", key)
    }
  }

  const handleEngineChange = (newEngine: EngineType) => {
    setEngine(newEngine)
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred_3d_engine", newEngine)
    }
  }

  // Prevent body scroll on mobile
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = "hidden"
      document.documentElement.style.overflow = "hidden"

      return () => {
        document.body.style.overflow = ""
        document.documentElement.style.overflow = ""
      }
    }
  }, [isMobile])

  // 0. GOOGLE COLAB (TRIPOSR GPU) PIPELINE - 100% MIỄN PHÍ KHÔNG CẦN KEY
  async function handleColabSubmit(values: FormValues) {
    const hasImage = values.images && values.images.length > 0
    if (!hasImage) {
      setError("Google Colab (TripoSR) cần ít nhất 1 ảnh đầu vào. Vui lòng nhấn Ctrl+V để dán ảnh hoặc chọn tệp ảnh!")
      return
    }

    if (!colabUrl || !colabUrl.trim()) {
      setError("Chưa cấu hình Google Colab URL. Vui lòng bấm vào icon Cài đặt (cạnh thanh nhập liệu) để mở Colab và dán link vào!")
      setShowSettings(true)
      return
    }

    setIsLoading(true)
    setError(null)
    setModelUrl(null)
    setThreeObject(null)
    setGeneratedCode("")
    setDownloadUrl(null)
    setWorldMarbleUrl(null)
    setCurrentPrompt(values.prompt || "colab-triposr-model")
    setLoadingMessage("Đang gửi ảnh sang Google Colab GPU (Mô hình TripoSR AI)...")

    try {
      const formData = new FormData()
      formData.append("colabUrl", colabUrl.trim())
      formData.append("image", values.images![0])

      const response = await fetch("/api/colab", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.message || `Lỗi từ Google Colab (${response.status})`)
      }

      setLoadingMessage("Đang nạp mô hình 3D vào khung xem Three.js...")
      const glbBlob = await response.blob()
      const objectUrl = URL.createObjectURL(glbBlob)
      setModelUrl(objectUrl)
      setDownloadUrl(objectUrl)
      setIsLoading(false)
    } catch (err: any) {
      console.error("Colab generation error:", err)
      setError(err?.message || "Đã xảy ra lỗi khi tạo mô hình 3D trên Google Colab.")
      setIsLoading(false)
    }
  }

  // 1. WORLD LABS (MARBLE) PIPELINE - Cho Phong cảnh / Không gian thế giới 3D
  async function handleWorldLabsSubmit(values: FormValues) {
    setIsLoading(true)
    setError(null)
    setModelUrl(null)
    setThreeObject(null)
    setGeneratedCode("")
    setDownloadUrl(null)
    setWorldMarbleUrl(null)
    setCurrentPrompt(values.prompt || "worldlabs-3d-scene")

    const hasImage = values.images && values.images.length > 0
    setLoadingMessage(
      hasImage
        ? "Đang tải ảnh toàn cảnh lên World Labs (Marble)..."
        : "Đang gửi yêu cầu tạo không gian 3D tới World Labs..."
    )

    try {
      const formData = new FormData()
      if (hasImage) {
        values.images.forEach((img) => {
          formData.append("images", img)
        })
      }
      if (values.prompt) {
        formData.append("prompt", values.prompt)
      }
      if (worldlabsApiKey) {
        formData.append("apiKey", worldlabsApiKey)
      }

      const res = await submitWorldLabsJob(formData)
      const opId = res.operationId

      // Start polling World Labs operation
      pollWorldLabs(opId)
    } catch (err: any) {
      console.error("World Labs error:", err)
      const msg = err?.message || "Đã xảy ra lỗi khi tạo thế giới 3D với World Labs"
      setError(msg)
      setIsLoading(false)

      if (msg.includes("WORLDLABS_API_KEY_REQUIRED") || msg.includes("Chưa cấu hình")) {
        setShowSettings(true)
      }
    }
  }

  async function pollWorldLabs(operationId: string) {
    try {
      const data = await checkWorldLabsStatus(operationId, worldlabsApiKey)
      console.log("World Labs poll data:", data)

      if (data.status === "SUCCEEDED" && data.done) {
        setIsLoading(false)
        setShowPromptContainer(false)

        if (data.worldMarbleUrl) {
          setWorldMarbleUrl(data.worldMarbleUrl)
        }

        if (data.meshGlbUrl) {
          const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(data.meshGlbUrl)}`
          setModelUrl(proxyUrl)
          setDownloadUrl(data.meshGlbUrl)
        } else if (data.worldMarbleUrl) {
          // If no GLB mesh yet but interactive viewer is ready
          window.open(data.worldMarbleUrl, "_blank")
        }
      } else if (data.status === "FAILED") {
        setIsLoading(false)
        setError(`Tác vụ World Labs thất bại: ${data.error || "Không thể tạo không gian 3D"}`)
      } else {
        // Still processing
        setLoadingMessage("World Labs AI đang tái tạo không gian 3D và chiều sâu...")
        setTimeout(() => pollWorldLabs(operationId), 4000)
      }
    } catch (err: any) {
      console.error("Error polling World Labs:", err)
      setError(`Lỗi kiểm tra tiến độ: ${err.message}`)
      setIsLoading(false)
    }
  }

  // 2. MESHY AI PIPELINE (Image-to-3D & Text-to-3D)
  async function handleMeshySubmit(values: FormValues) {
    setIsLoading(true)
    setError(null)
    setModelUrl(null)
    setThreeObject(null)
    setGeneratedCode("")
    setDownloadUrl(null)
    setWorldMarbleUrl(null)
    setCurrentPrompt(values.prompt || "meshy-3d-model")

    const hasImage = values.images && values.images.length > 0
    setLoadingMessage(
      hasImage
        ? "Đang tải ảnh lên và khởi tạo tác vụ Meshy Image-to-3D..."
        : "Đang gửi yêu cầu tạo mô hình tới Meshy Text-to-3D..."
    )

    try {
      const formData = new FormData()
      if (hasImage) {
        values.images.forEach((img) => {
          formData.append("images", img)
        })
      }
      if (values.prompt) {
        formData.append("prompt", values.prompt)
      }
      if (meshyApiKey) {
        formData.append("apiKey", meshyApiKey)
      }

      const res = await submitMeshyJob(formData)
      const taskId = res.taskId
      const type = res.type as "image-to-3d" | "multi-image-to-3d" | "text-to-3d"

      // Start polling Meshy
      pollMeshy(taskId, type)
    } catch (err: any) {
      console.error("Meshy error:", err)
      const msg = err?.message || "Đã xảy ra lỗi khi tạo mô hình 3D với Meshy"
      setError(msg)
      setIsLoading(false)

      if (msg.includes("MESHY_API_KEY_REQUIRED") || msg.includes("Chưa cấu hình")) {
        setShowSettings(true)
      }
    }
  }

  async function pollMeshy(taskId: string, type: "image-to-3d" | "multi-image-to-3d" | "text-to-3d") {
    try {
      const data = await checkMeshyStatus(taskId, type, meshyApiKey)

      if (data.status === "SUCCEEDED") {
        setIsLoading(false)
        const glbUrl = data.model_urls?.glb
        if (glbUrl) {
          const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(glbUrl)}`
          setModelUrl(proxyUrl)
          setDownloadUrl(glbUrl)
          setShowPromptContainer(false)
        } else {
          setError("Không tìm thấy đường dẫn file GLB từ Meshy")
        }
      } else if (data.status === "FAILED") {
        setIsLoading(false)
        setError(`Tác vụ Meshy thất bại: ${data.task_error?.message || "Lỗi xử lý hình ảnh"}`)
      } else {
        const progress = data.progress ?? 0
        setLoadingMessage(`Meshy AI đang tái tạo lưới và vân bề mặt 3D: ${progress}%...`)
        setTimeout(() => pollMeshy(taskId, type), 3000)
      }
    } catch (err: any) {
      console.error("Error polling Meshy:", err)
      setError(`Lỗi kiểm tra tiến độ: ${err.message}`)
      setIsLoading(false)
    }
  }

  // 3. DEEPSEEK 3D PIPELINE (Procedural Three.js Code)
  async function handleDeepSeekSubmit(promptText: string) {
    setIsLoading(true)
    setLoadingMessage("DeepSeek AI đang lập trình & tạo hình khối 3D Three.js...")
    setError(null)
    setModelUrl(null)
    setThreeObject(null)
    setGeneratedCode("")
    setWorldMarbleUrl(null)
    setCurrentPrompt(promptText)

    try {
      const data = await generateWithDeepSeek(promptText, deepseekApiKey)
      const code = data.code
      setGeneratedCode(code)

      let cleanedCode = code.trim()
      let modelFactory: any

      try {
        modelFactory = new Function("THREE", `${cleanedCode}\nreturn typeof createModel === 'function' ? createModel(THREE) : null;`)
      } catch (compileErr: any) {
        if (compileErr?.message?.includes("end of input") || compileErr?.message?.includes("Unexpected")) {
          cleanedCode = cleanedCode + "\n  return root;\n}\n"
          modelFactory = new Function("THREE", `${cleanedCode}\nreturn typeof createModel === 'function' ? createModel(THREE) : null;`)
        } else {
          throw compileErr
        }
      }

      const object = modelFactory(THREE)

      if (!object || !(object instanceof THREE.Object3D)) {
        throw new Error("Mô hình 3D tạo ra không hợp lệ. Vui lòng bấm tạo lại hoặc thử mô tả chi tiết hơn.")
      }

      setThreeObject(object)
      setIsLoading(false)
      setShowPromptContainer(false)
    } catch (err: any) {
      console.error("DeepSeek generation error:", err)
      let errorMsg = err?.message || "Đã xảy ra lỗi khi tạo mô hình 3D bằng DeepSeek"
      if (errorMsg.includes("end of input")) {
        errorMsg = "Mã nguồn 3D tạo ra bị ngắt giữa chừng do độ dài. Vui lòng thử lại hoặc nhập prompt súc tích hơn."
      }
      setError(errorMsg)
      setIsLoading(false)

      if (errorMsg.includes("DEEPSEEK_API_KEY_REQUIRED") || errorMsg.includes("Chưa cấu hình")) {
        setShowSettings(true)
      }
    }
  }

  // 4. HYPER3D RODIN PIPELINE
  async function handleHyper3DSubmit(values: FormValues) {
    setIsLoading(true)
    setLoadingMessage("Đang gửi yêu cầu tới Hyper3D Rodin...")
    setError(null)
    setResult(null)
    setModelUrl(null)
    setThreeObject(null)
    setDownloadUrl(null)
    setWorldMarbleUrl(null)
    setJobStatuses([])

    try {
      const formData = new FormData()

      if (values.images && values.images.length > 0) {
        values.images.forEach((image) => {
          formData.append("images", image)
        })
      }

      if (values.prompt) {
        formData.append("prompt", values.prompt)
      }

      formData.append("condition_mode", options.condition_mode)
      formData.append("geometry_file_format", options.geometry_file_format)
      formData.append("material", options.material)
      formData.append("quality", options.quality)
      formData.append("use_hyper", options.use_hyper.toString())
      formData.append("tier", options.tier)
      formData.append("TAPose", options.TAPose.toString())
      formData.append("mesh_mode", "Quad")
      formData.append("mesh_simplify", "true")
      formData.append("mesh_smooth", "true")

      const data = await submitRodinJob(formData)
      setResult(data)

      if (data.jobs && data.jobs.subscription_key && data.uuid) {
        handleStatusCheck(data.jobs.subscription_key, data.uuid)
      } else {
        setError("Missing required data for status checking")
        setIsLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định")
      setIsLoading(false)
    }
  }

  async function handleStatusCheck(subscriptionKey: string, taskUuid: string) {
    try {
      setIsPolling(true)
      const data = await checkJobStatus(subscriptionKey)

      if (!data.jobs || !Array.isArray(data.jobs) || data.jobs.length === 0) {
        throw new Error("No jobs found in status response")
      }

      setJobStatuses(data.jobs)
      const allJobsDone = data.jobs.every((job: any) => job.status === "Done")
      const anyJobFailed = data.jobs.some((job: any) => job.status === "Failed")

      if (allJobsDone) {
        setIsPolling(false)
        try {
          const downloadData = await downloadModel(taskUuid)
          if (downloadData.error && downloadData.error !== "OK") {
            throw new Error(`Download error: ${downloadData.error}`)
          }

          if (downloadData.list && downloadData.list.length > 0) {
            const glbFile = downloadData.list.find((file: { name: string }) => file.name.toLowerCase().endsWith(".glb"))

            if (glbFile) {
              const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(glbFile.url)}`
              setModelUrl(proxyUrl)
              setDownloadUrl(glbFile.url)
              setIsLoading(false)
              setShowPromptContainer(false)
            } else {
              setError("Không tìm thấy file GLB trong kết quả")
              setIsLoading(false)
            }
          } else {
            setError("Không có file tải về")
            setIsLoading(false)
          }
        } catch (downloadErr) {
          setError(`Tải mô hình thất bại: ${downloadErr instanceof Error ? downloadErr.message : "Lỗi không xác định"}`)
          setIsLoading(false)
        }
      } else if (anyJobFailed) {
        setIsPolling(false)
        setError("Tác vụ sinh 3D thất bại từ server")
        setIsLoading(false)
      } else {
        setTimeout(() => handleStatusCheck(subscriptionKey, taskUuid), 3000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kiểm tra tiến độ thất bại")
      setIsPolling(false)
      setIsLoading(false)
    }
  }

  async function handleSubmit(values: FormValues) {
    if (engine === "colab") {
      await handleColabSubmit(values)
    } else if (engine === "worldlabs") {
      await handleWorldLabsSubmit(values)
    } else if (engine === "meshy") {
      await handleMeshySubmit(values)
    } else if (engine === "deepseek") {
      if (!values.prompt || !values.prompt.trim()) {
        setError("Vui lòng nhập câu lệnh mô tả (prompt) mô hình bạn muốn tạo!")
        return
      }
      await handleDeepSeekSubmit(values.prompt)
    } else {
      await handleHyper3DSubmit(values)
    }
  }

  const handleDownload = () => {
    // If DeepSeek model: export threeObject as .glb binary
    if (engine === "deepseek" && threeObject) {
      const exporter = new GLTFExporter()
      exporter.parse(
        threeObject,
        (gltf) => {
          const blob = new Blob([gltf as ArrayBuffer], { type: "model/gltf-binary" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          const cleanName = (currentPrompt || "model-3d").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)
          a.download = `${cleanName}.glb`
          a.click()
          URL.revokeObjectURL(url)
        },
        (exportErr) => {
          console.error("Export error:", exportErr)
          setError("Lỗi khi xuất file GLB: " + (exportErr instanceof Error ? exportErr.message : String(exportErr)))
        },
        { binary: true }
      )
      return
    }

    if (downloadUrl) {
      window.open(downloadUrl, "_blank")
    }
  }

  const handleBack = () => {
    setShowPromptContainer(true)
  }

  const getSubtitle = () => {
    if (engine === "colab") return "Powered by Google Colab GPU (TripoSR - Miễn phí 100%)"
    if (engine === "worldlabs") return "Powered by World Labs (Marble - Không Gian Thế Giới 3D)"
    if (engine === "meshy") return "Powered by Meshy AI (Chuyên Image-to-3D có Texture)"
    if (engine === "deepseek") return "Powered by DeepSeek AI & Three.js"
    return "Powered by Hyper3D Rodin"
  }

  return (
    <div className="relative h-[100dvh] w-full">
      {/* Full-screen canvas */}
      <div className="absolute inset-0 z-0">
        <ModelViewer
          modelUrl={isLoading ? null : modelUrl}
          threeObject={isLoading ? null : threeObject}
        />
      </div>

      {/* Overlay UI */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Top Header */}
        <div className="absolute top-6 left-6 right-6 flex items-start justify-between pointer-events-auto">
          {/* Logo & Engine Switcher */}
          <div className="flex flex-col gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl text-white font-normal tracking-normal flex items-center gap-2">
                3D Model Generator
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-0.5 tracking-normal">
                {getSubtitle()}
              </p>
            </div>

            {/* Quick Engine Switcher Pills */}
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/10 w-fit flex-wrap">
              {/* Google Colab GPU (FREE) */}
              <button
                type="button"
                onClick={() => handleEngineChange("colab")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  engine === "colab"
                    ? "bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400"
                    : "text-emerald-400 hover:text-white"
                }`}
              >
                <Zap className="h-3 w-3 text-emerald-300" />
                <span>⚡ Colab GPU</span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.2 rounded font-mono">
                  Miễn phí
                </span>
              </button>

              {/* World Labs */}
              <button
                type="button"
                onClick={() => handleEngineChange("worldlabs")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  engine === "worldlabs"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Globe className="h-3 w-3" />
                <span>🌍 World Labs</span>
                <span className="text-[10px] bg-white/20 px-1 rounded">Phong Cảnh</span>
              </button>

              {/* Meshy AI */}
              <button
                type="button"
                onClick={() => handleEngineChange("meshy")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  engine === "meshy"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Box className="h-3 w-3" />
                <span>🌟 Meshy AI</span>
                <span className="text-[10px] bg-white/20 px-1 rounded">Nhân vật</span>
              </button>

              {/* DeepSeek */}
              <button
                type="button"
                onClick={() => handleEngineChange("deepseek")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  engine === "deepseek"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                DeepSeek 3D
              </button>

              {/* Hyper3D */}
              <button
                type="button"
                onClick={() => handleEngineChange("hyper3d")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  engine === "hyper3d"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Hyper3D
              </button>
            </div>
          </div>

          {/* Top Right Controls */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="bg-black/60 hover:bg-black/90 text-white border-white/15 rounded-full px-3 py-1.5 h-9 flex items-center gap-1.5 backdrop-blur-md text-xs font-normal"
            >
              <Settings className="h-4 w-4 text-emerald-400" />
              <span>Cài đặt Key</span>
            </Button>

            {!isMobile && (
              <a
                href={
                  engine === "worldlabs"
                    ? "https://worldlabs.ai"
                    : engine === "meshy"
                    ? "https://meshy.ai"
                    : "https://platform.deepseek.com"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-gray-400 hover:text-white text-xs gap-1 transition-colors px-2"
              >
                <span>{engine === "worldlabs" ? "WorldLabs" : engine === "meshy" ? "Meshy" : "Docs"}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Loading indicator */}
        <StatusIndicator isLoading={isLoading} jobStatuses={jobStatuses} />
        {isLoading && (
          <div className="absolute top-[56%] left-1/2 transform -translate-x-1/2 bg-black/85 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/15 text-white text-xs shadow-2xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{loadingMessage}</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-red-950/85 border border-red-500/40 text-red-200 px-5 py-2.5 rounded-xl tracking-normal text-xs sm:text-sm max-w-lg text-center backdrop-blur-md pointer-events-auto shadow-xl">
            <span>{error}</span>
            {(error.includes("KEY_REQUIRED") || error.includes("Chưa cấu hình")) && (
              <Button
                size="sm"
                variant="link"
                onClick={() => setShowSettings(true)}
                className="text-emerald-300 underline text-xs ml-2 p-0 h-auto font-medium"
              >
                Nhập key ngay
              </Button>
            )}
          </div>
        )}

        {/* Model controls when model is loaded */}
        {!isLoading && (modelUrl || threeObject || worldMarbleUrl) && !showPromptContainer && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-3 pointer-events-auto flex-wrap justify-center">
            <Button
              onClick={handleBack}
              className="bg-black/80 hover:bg-gray-900 text-white border border-white/20 rounded-full px-4 py-2 flex items-center gap-2 backdrop-blur-md"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="tracking-normal">Quay lại</span>
            </Button>

            {/* World Labs Interactive Viewer Button */}
            {worldMarbleUrl && (
              <Button
                onClick={() => window.open(worldMarbleUrl, "_blank")}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-5 py-2 flex items-center gap-2 shadow-lg animate-pulse"
              >
                <Globe className="h-4 w-4" />
                <span className="tracking-normal">Khám Phá Thế Giới 3D (World Labs)</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}

            {generatedCode && (
              <Button
                onClick={() => setShowCodeModal(true)}
                className="bg-black/80 hover:bg-gray-900 text-blue-300 border border-blue-500/30 rounded-full px-4 py-2 flex items-center gap-2 backdrop-blur-md"
              >
                <Code2 className="h-4 w-4" />
                <span className="tracking-normal">Xem Code Three.js</span>
              </Button>
            )}

            {downloadUrl && (
              <Button
                onClick={handleDownload}
                className="bg-amber-600 hover:bg-amber-500 text-white rounded-full px-5 py-2 flex items-center gap-2 shadow-lg"
              >
                <Download className="h-4 w-4" />
                <span className="tracking-normal">Tải File .GLB</span>
              </Button>
            )}
          </div>
        )}

        {/* Input field at bottom */}
        {showPromptContainer && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-4 sm:px-0 pointer-events-auto">
            <Form
              isLoading={isLoading}
              onSubmit={handleSubmit}
              onOpenOptions={() => (engine === "hyper3d" ? setShowOptions(true) : setShowSettings(true))}
            />
          </div>
        )}
      </div>

      {/* Settings Dialog (World Labs, Meshy, DeepSeek) */}
      <DeepSeekSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        colabUrl={colabUrl}
        onSaveColabUrl={handleSaveColabUrl}
        apiKey={deepseekApiKey}
        onSaveApiKey={handleSaveApiKey}
        meshyApiKey={meshyApiKey}
        onSaveMeshyApiKey={handleSaveMeshyApiKey}
        worldlabsApiKey={worldlabsApiKey}
        onSaveWorldlabsApiKey={handleSaveWorldlabsApiKey}
        engine={engine}
        onEngineChange={handleEngineChange}
      />

      {/* Code Viewer Modal */}
      <CodeDialog
        open={showCodeModal}
        onOpenChange={setShowCodeModal}
        code={generatedCode}
        prompt={currentPrompt}
      />

      {/* Hyper3D Options Dialog/Drawer */}
      <OptionsDialog
        open={showOptions}
        onOpenChange={setShowOptions}
        options={options}
        onOptionsChange={(newOpts) => setOptions(newOpts)}
      />
    </div>
  )
}
