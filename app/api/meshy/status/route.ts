import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("taskId")
    const type = searchParams.get("type") || "image-to-3d"
    const customApiKey = searchParams.get("apiKey")
    const apiKey = customApiKey || process.env.MESHY_API_KEY

    if (!taskId) {
      return NextResponse.json({ error: "Missing taskId" }, { status: 400 })
    }

    if (!apiKey) {
      return NextResponse.json({ error: "Missing Meshy API Key" }, { status: 400 })
    }

    let endpoint = `https://api.meshy.ai/openapi/v1/image-to-3d/${taskId}`
    if (type === "multi-image-to-3d") {
      endpoint = `https://api.meshy.ai/openapi/v1/multi-image-to-3d/${taskId}`
    } else if (type === "text-to-3d") {
      endpoint = `https://api.meshy.ai/openapi/v2/text-to-3d/${taskId}`
    }

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Status check failed (${response.status}): ${errorText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in Meshy status route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check Meshy status" },
      { status: 500 },
    )
  }
}
