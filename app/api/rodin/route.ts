import { NextResponse } from "next/server"

const API_KEY = process.env.RODIN_API_KEY || "vibecoding"

export async function POST(request: Request) {
  try {
    // Get the form data from the request
    const formData = await request.formData()

    // Forward the request to the Hyper3D API
    const response = await fetch("https://hyperhuman.deemos.com/api/v2/rodin", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      body: formData,
    })

    const data = await response.json()

    if (!response.ok || data.error) {
      return NextResponse.json(
        { error: data.error || `API request failed: ${response.status}`, details: data },
        { status: response.ok ? 400 : response.status },
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in Rodin API route:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
