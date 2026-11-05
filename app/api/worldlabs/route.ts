import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const apiKey = (formData.get("apiKey") as string) || process.env.WORLDLABS_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "WORLDLABS_API_KEY_REQUIRED",
          message:
            "Chưa cấu hình World Labs API Key. Vui lòng nhập API Key ở phần Cài đặt Key hoặc trong file .env.local (WORLDLABS_API_KEY).",
        },
        { status: 400 },
      )
    }

    const imageFile = formData.get("image") as File | null
    const multiImages = formData.getAll("images") as File[]
    const file = (multiImages && multiImages.length > 0 ? multiImages[0] : imageFile) as File | null
    const prompt = (formData.get("prompt") as string) || ""

    // 1. Image-to-World flow via Media Asset upload
    if (file && file.size > 0) {
      const fileName = file.name || "scenery.jpg"
      const ext = fileName.split(".").pop()?.toLowerCase() || "jpg"
      const mimeType = file.type || "image/jpeg"

      // Step 1: Prepare upload
      const prepRes = await fetch("https://api.worldlabs.ai/marble/v1/media-assets:prepare_upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "WLT-Api-Key": apiKey.trim(),
        },
        body: JSON.stringify({
          file_name: fileName,
          extension: ext,
          kind: "image",
        }),
      })

      if (!prepRes.ok) {
        const errText = await prepRes.text()
        console.error("World Labs prepare upload failed:", prepRes.status, errText)
        return NextResponse.json(
          { error: `World Labs prepare upload error (${prepRes.status}): ${errText}` },
          { status: prepRes.status },
        )
      }

      const prepData = await prepRes.json()
      const mediaAssetId = prepData.media_asset?.media_asset_id
      const uploadUrl = prepData.upload_info?.upload_url
      const reqHeaders = prepData.upload_info?.required_headers || {}

      if (!uploadUrl || !mediaAssetId) {
        return NextResponse.json({ error: "Không nhận được link upload từ World Labs" }, { status: 500 })
      }

      // Step 2: Upload binary buffer to signed URL
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      const uploadHeaders: Record<string, string> = {
        ...reqHeaders,
      }
      if (!uploadHeaders["Content-Type"]) {
        uploadHeaders["Content-Type"] = mimeType
      }

      console.log("World Labs uploading to GCS with headers:", uploadHeaders)

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: uploadHeaders,
        body: fileBuffer,
      })

      if (!uploadRes.ok) {
        const uploadErrText = await uploadRes.text()
        console.error("World Labs binary upload failed:", uploadRes.status, uploadErrText)
        return NextResponse.json(
          { error: `Tải ảnh lên lưu trữ World Labs thất bại (${uploadRes.status}): ${uploadErrText}` },
          { status: uploadRes.status },
        )
      }

      // Step 3: Trigger World Generation
      const genRes = await fetch("https://api.worldlabs.ai/marble/v1/worlds:generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "WLT-Api-Key": apiKey.trim(),
        },
        body: JSON.stringify({
          display_name: prompt ? prompt.slice(0, 60) : "Ancient Village Scene",
          model: "marble-1.1",
          world_prompt: {
            type: "image",
            image_prompt: {
              source: "media_asset",
              media_asset_id: mediaAssetId,
            },
          },
        }),
      })

      if (!genRes.ok) {
        const genErr = await genRes.text()
        console.error("World Labs worlds:generate failed:", genRes.status, genErr)
        return NextResponse.json(
          { error: `World Labs generate error (${genRes.status}): ${genErr}` },
          { status: genRes.status },
        )
      }

      const genData = await genRes.json()
      return NextResponse.json({
        success: true,
        operationId: genData.operation_id,
      })
    }

    // 2. Text-to-World flow (khi chỉ có prompt)
    if (!prompt.trim()) {
      return NextResponse.json({ error: "Vui lòng tải ảnh phối cảnh lên hoặc nhập prompt." }, { status: 400 })
    }

    const genRes = await fetch("https://api.worldlabs.ai/marble/v1/worlds:generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "WLT-Api-Key": apiKey.trim(),
      },
      body: JSON.stringify({
        display_name: prompt.slice(0, 60),
        model: "marble-1.1",
        world_prompt: {
          type: "text",
          text_prompt: prompt.trim(),
        },
      }),
    })

    if (!genRes.ok) {
      const genErr = await genRes.text()
      return NextResponse.json(
        { error: `World Labs generate error (${genRes.status}): ${genErr}` },
        { status: genRes.status },
      )
    }

    const genData = await genRes.json()
    return NextResponse.json({
      success: true,
      operationId: genData.operation_id,
    })
  } catch (error) {
    console.error("Error in World Labs route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Đã xảy ra lỗi khi kết nối tới World Labs API" },
      { status: 500 },
    )
  }
}
