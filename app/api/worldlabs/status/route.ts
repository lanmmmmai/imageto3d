import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const operationId = searchParams.get("operationId")
    const customApiKey = searchParams.get("apiKey")
    const apiKey = customApiKey || process.env.WORLDLABS_API_KEY

    if (!operationId) {
      return NextResponse.json({ error: "Missing operationId" }, { status: 400 })
    }

    if (!apiKey) {
      return NextResponse.json({ error: "Missing World Labs API Key" }, { status: 400 })
    }

    // Check operation status
    const opRes = await fetch(`https://api.worldlabs.ai/marble/v1/operations/${operationId}`, {
      method: "GET",
      headers: {
        "WLT-Api-Key": apiKey.trim(),
      },
    })

    if (!opRes.ok) {
      const errText = await opRes.text()
      return NextResponse.json(
        { error: `Kiểm tra tiến độ World Labs thất bại (${opRes.status}): ${errText}` },
        { status: opRes.status },
      )
    }

    const opData = await opRes.json()

    // If still in progress
    if (!opData.done) {
      return NextResponse.json({
        status: "PROCESSING",
        done: false,
        metadata: opData.metadata,
      })
    }

    // If failed
    if (opData.error) {
      return NextResponse.json({
        status: "FAILED",
        done: true,
        error: opData.error?.message || "Tác vụ tạo thế giới 3D World Labs thất bại.",
      })
    }

    // Operation done successfully! Find world_id
    const worldId =
      opData.response?.world_id ||
      opData.response?.world?.world_id ||
      opData.response?.id

    if (!worldId) {
      return NextResponse.json({
        status: "SUCCEEDED",
        done: true,
        raw: opData.response,
      })
    }

    // Fetch the detailed world object
    const worldRes = await fetch(`https://api.worldlabs.ai/marble/v1/worlds/${worldId}`, {
      method: "GET",
      headers: {
        "WLT-Api-Key": apiKey.trim(),
      },
    })

    if (!worldRes.ok) {
      // Fallback to response from operation
      return NextResponse.json({
        status: "SUCCEEDED",
        done: true,
        worldId,
        raw: opData.response,
      })
    }

    const worldData = await worldRes.json()

    // Extract useful fields
    const worldMarbleUrl = worldData.world_marble_url || `https://marble.worldlabs.ai/world/${worldId}`
    const meshGlbUrl =
      worldData.assets?.mesh?.hq_mesh_url ||
      worldData.assets?.mesh?.full_res_mesh_url ||
      worldData.assets?.mesh?.collider_mesh_url

    return NextResponse.json({
      status: "SUCCEEDED",
      done: true,
      worldId,
      worldMarbleUrl,
      meshGlbUrl,
      assets: worldData.assets,
      displayName: worldData.display_name,
    })
  } catch (error) {
    console.error("Error in World Labs status route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check World Labs status" },
      { status: 500 },
    )
  }
}
