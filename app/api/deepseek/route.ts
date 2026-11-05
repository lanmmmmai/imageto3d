import { NextResponse } from "next/server"

const SYSTEM_PROMPT = `You are an expert Three.js 3D Procedural Modeler and Creative Geometry Programmer.
Your goal is to generate clean, robust, highly-detailed, and visually appealing JavaScript code using Three.js to construct a 3D model/scene based on the user's prompt.

CRITICAL INSTRUCTIONS:
1. Output ONLY executable JavaScript code inside a single \`\`\`javascript ... \`\`\` block. Do NOT include markdown text before or after the block.
2. Define a single self-contained function:
   function createModel(THREE) {
       const root = new THREE.Group();
       // ... build your model ...
       return root;
   }
3. IMPORTANT SYNTAX RULES:
   - Do NOT use 'import' or 'require' statements. THREE is already passed as the argument to createModel(THREE).
   - Do NOT use 'export default' or 'export'.
   - ALWAYS ensure all parentheses, brackets, and braces are properly closed.
   - ALWAYS finish the function with: return root; }
4. The root group MUST be centered around [0, 0, 0]. Keep the overall bounding size between 2 and 4 units so it fits the viewport.
5. Standard geometries to use:
   - THREE.BoxGeometry, THREE.CylinderGeometry, THREE.SphereGeometry, THREE.ConeGeometry
   - THREE.TorusGeometry, THREE.DodecahedronGeometry, THREE.IcosahedronGeometry, THREE.CapsuleGeometry
6. Materials:
   - Use THREE.MeshStandardMaterial or THREE.MeshPhysicalMaterial.
   - Choose rich, harmonious colors and realistic roughness (0.15 - 0.8) and metalness (0.0 - 0.9).
   - Add emissive color highlights where appropriate (e.g., lights, eyes, glow elements).
7. Detail & Composition:
   - Build composite objects with sub-parts and hierarchy!
   - Example (Vehicle): Car body, cabin with tinted windows, 4 wheels with rims/tires, headlights, taillights, spoiler.
   - Example (Character/Creature): Head, expressive eyes/pupils, torso, arms/hands, legs/feet, accessories.
   - Example (Architecture/Nature): Building base, windows, roof, door, stylized tree foliage layers, rocks.
8. Safety:
   - Do NOT load external textures, images, CDN URLs, or fetch() requests. Everything must be procedural.
`

function cleanAndValidateCode(rawContent: string): { code: string; error?: string } {
  let cleaned = rawContent.trim()

  // Extract content between code fence if present
  const blockMatch = cleaned.match(/```(?:javascript|js)?\s*([\s\S]*?)(?:```|$)/i)
  if (blockMatch && blockMatch[1]) {
    cleaned = blockMatch[1].trim()
  }

  // Remove import/require/export statements if any
  cleaned = cleaned.replace(/^\s*import\s+[\s\S]*?from\s+['"].*?['"];?\s*$/gm, "")
  cleaned = cleaned.replace(/^\s*import\s+['"].*?['"];?\s*$/gm, "")
  cleaned = cleaned.replace(/^\s*const\s+.*?=\s*require\(.*?\);?\s*$/gm, "")
  cleaned = cleaned.replace(/^\s*export\s+default\s+/gm, "")
  cleaned = cleaned.replace(/^\s*export\s+/gm, "")

  // Check if function createModel is defined
  if (!cleaned.includes("function createModel") && !cleaned.includes("const createModel")) {
    return { code: "", error: "Mã nguồn không chứa hàm createModel(THREE)." }
  }

  // Check bracket balance to prevent "Unexpected end of input"
  let openBraces = 0
  let closeBraces = 0
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === "{") openBraces++
    if (cleaned[i] === "}") closeBraces++
  }

  if (openBraces > closeBraces) {
    // Attempt auto-recovery by closing unclosed braces
    const missing = openBraces - closeBraces
    console.warn(`Auto-closing ${missing} unclosed braces in generated code`)
    if (!cleaned.includes("return root")) {
      cleaned += "\n  return root;"
    }
    cleaned += "\n" + "}".repeat(missing)
  }

  return { code: cleaned.trim() }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { prompt, apiKey: customApiKey, style = "detailed" } = body

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập mô tả cho mô hình 3D" }, { status: 400 })
    }

    const apiKey = customApiKey || process.env.DEEPSEEK_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "DEEPSEEK_API_KEY_REQUIRED",
          message: "Chưa cấu hình DeepSeek API Key. Vui lòng nhập API Key ở phần Cài đặt hoặc trong file .env.local (DEEPSEEK_API_KEY).",
        },
        { status: 400 },
      )
    }

    const userMessage = `Create a 3D procedural model in Three.js for: "${prompt}". Style: ${style}. Include rich details, vibrant aesthetic colors, and high quality geometry.`

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.6,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("DeepSeek API error:", response.status, errorText)
      return NextResponse.json(
        { error: `DeepSeek API failed (${response.status}): ${errorText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    const content: string = data.choices?.[0]?.message?.content || ""
    const finishReason = data.choices?.[0]?.finish_reason

    if (!content) {
      return NextResponse.json({ error: "DeepSeek không phản hồi nội dung. Vui lòng thử lại." }, { status: 500 })
    }

    const { code, error: validationError } = cleanAndValidateCode(content)

    if (validationError || !code) {
      return NextResponse.json(
        {
          error: validationError || "Mô hình trả về định dạng code chưa đúng cấu trúc. Vui lòng thử lại.",
          raw: content,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      code,
      prompt,
      finishReason,
    })
  } catch (error) {
    console.error("Error in DeepSeek route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Đã xảy ra lỗi khi gọi DeepSeek API" },
      { status: 500 },
    )
  }
}
