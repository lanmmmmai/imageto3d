import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const apiKey = (formData.get("apiKey") as string) || process.env.MESHY_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "MESHY_API_KEY_REQUIRED",
          message: "Chưa cấu hình Meshy API Key. Vui lòng nhập API Key ở phần Cài đặt Key hoặc trong file .env.local (MESHY_API_KEY).",
        },
        { status: 400 },
      )
    }

    // Collect all uploaded images
    const singleImage = formData.get("image") as File | null
    const multiImages = formData.getAll("images") as File[]
    const allImages: File[] = []

    if (multiImages && multiImages.length > 0) {
      multiImages.forEach((f) => {
        if (f && f.size > 0) allImages.push(f)
      })
    } else if (singleImage && singleImage.size > 0) {
      allImages.push(singleImage)
    }

    const prompt = (formData.get("prompt") as string) || ""

    // 1. MULTI-IMAGE TO 3D FLOW (> 1 image)
    if (allImages.length > 1) {
      const imageUrls: string[] = []
      // Meshy supports up to 4 images
      const imagesToProcess = allImages.slice(0, 4)

      for (const file of imagesToProcess) {
        const buffer = Buffer.from(await file.arrayBuffer())
        const mimeType = file.type || "image/png"
        imageUrls.push(`data:${mimeType};base64,${buffer.toString("base64")}`)
      }

      const response = await fetch("https://api.meshy.ai/openapi/v1/multi-image-to-3d", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_urls: imageUrls,
          enable_pbr: true,
          should_texture: true,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Meshy Multi-Image-to-3D error:", response.status, errorText)
        return NextResponse.json(
          { error: `Meshy API error (${response.status}): ${errorText}` },
          { status: response.status },
        )
      }

      const data = await response.json()
      return NextResponse.json({
        success: true,
        type: "multi-image-to-3d",
        taskId: data.result,
      })
    }

    // 2. SINGLE IMAGE TO 3D FLOW (= 1 image)
    if (allImages.length === 1) {
      const file = allImages[0]
      const buffer = Buffer.from(await file.arrayBuffer())
      const mimeType = file.type || "image/png"
      const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`

      const response = await fetch("https://api.meshy.ai/openapi/v1/image-to-3d", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: dataUri,
          enable_pbr: true,
          should_texture: true,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Meshy Image-to-3D error:", response.status, errorText)
        return NextResponse.json(
          { error: `Meshy API error (${response.status}): ${errorText}` },
          { status: response.status },
        )
      }

      const data = await response.json()
      return NextResponse.json({
        success: true,
        type: "image-to-3d",
        taskId: data.result,
      })
    }

    // 3. TEXT-TO-3D FLOW (No images uploaded)
    if (!prompt.trim()) {
      return NextResponse.json({ error: "Vui lòng tải ảnh lên hoặc nhập mô tả văn bản." }, { status: 400 })
    }

    const response = await fetch("https://api.meshy.ai/openapi/v2/text-to-3d", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "preview",
        prompt: prompt.trim(),
        ai_model: "meshy-4",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Meshy Text-to-3D error:", response.status, errorText)
      return NextResponse.json(
        { error: `Meshy API error (${response.status}): ${errorText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      type: "text-to-3d",
      taskId: data.result,
    })
  } catch (error) {
    console.error("Error in Meshy route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Đã xảy ra lỗi khi kết nối tới Meshy API" },
      { status: 500 },
    )
  }
}
