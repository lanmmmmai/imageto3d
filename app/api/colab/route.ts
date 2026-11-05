import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const colabUrl = searchParams.get("colabUrl")

  if (!colabUrl) {
    return NextResponse.json({ error: "COLAB_URL_REQUIRED", message: "Thiếu Colab URL." }, { status: 400 })
  }

  const cleanUrl = colabUrl.trim().replace(/\/+$/, "")
  try {
    const res = await fetch(`${cleanUrl}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(6000),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: "COLAB_UNREACHABLE", message: `Colab phản hồi mã lỗi ${res.status}.` },
        { status: 502 },
      )
    }

    const data = await res.json()
    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json(
      {
        error: "COLAB_TIMEOUT_OR_FAILED",
        message:
          "Không thể kết nối đến Google Colab. Vui lòng đảm bảo bạn đã nhấn 'Run all' trên Colab và copy đúng link trycloudflare.com hoặc gradio.live.",
      },
      { status: 502 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const colabUrl = (formData.get("colabUrl") as string)?.trim().replace(/\/+$/, "")

    if (!colabUrl) {
      return NextResponse.json(
        {
          error: "COLAB_URL_REQUIRED",
          message:
            "Chưa cấu hình đường dẫn Google Colab Backend. Vui lòng mở Google Colab và dán link vào phần Cài đặt Engine.",
        },
        { status: 400 },
      )
    }

    const image = formData.get("image") as File | null
    if (!image || image.size === 0) {
      return NextResponse.json(
        {
          error: "IMAGE_REQUIRED",
          message: "Vui lòng dán (Ctrl+V) hoặc chọn một bức ảnh để tạo 3D.",
        },
        { status: 400 },
      )
    }

    // Forward image to Colab FastAPI server
    const colabFormData = new FormData()
    colabFormData.append("image", image, image.name || "input.png")
    colabFormData.append("do_remove_bg", "true")
    colabFormData.append("foreground_ratio", "0.85")

    const colabResponse = await fetch(`${colabUrl}/generate`, {
      method: "POST",
      body: colabFormData,
      signal: AbortSignal.timeout(120000), // 2 minutes timeout
    })

    if (!colabResponse.ok) {
      const errText = await colabResponse.text()
      return NextResponse.json(
        {
          error: "COLAB_GENERATE_ERROR",
          message: `Lỗi xử lý từ Google Colab (${colabResponse.status}): ${errText.slice(0, 300)}`,
        },
        { status: 502 },
      )
    }

    // Return the GLB binary buffer
    const glbBuffer = await colabResponse.arrayBuffer()
    return new Response(glbBuffer, {
      status: 200,
      headers: {
        "Content-Type": "model/gltf-binary",
        "Content-Disposition": 'attachment; filename="triposr_model.glb"',
        "Content-Length": glbBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("Colab API error:", error)
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi khi kết nối tới máy chủ Google Colab.",
      },
      { status: 500 },
    )
  }
}
