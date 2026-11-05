export async function submitRodinJob(formData: FormData) {
  const response = await fetch("/api/rodin", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.error || `API request failed: ${response.status}`)
  }

  return await response.json()
}

export async function checkJobStatus(subscriptionKey: string) {
  const response = await fetch(`/api/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subscription_key: subscriptionKey,
    }),
  })

  if (!response.ok) {
    throw new Error(`Status check failed: ${response.status}`)
  }

  return await response.json()
}

export async function downloadModel(taskUuid: string) {
  const response = await fetch(`/api/download`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      task_uuid: taskUuid,
    }),
  })

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`)
  }

  return await response.json()
}

export async function generateWithDeepSeek(prompt: string, apiKey?: string) {
  const response = await fetch("/api/deepseek", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      apiKey: apiKey || undefined,
    }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || data?.error || `DeepSeek API failed: ${response.status}`)
  }

  return data
}

export async function submitMeshyJob(formData: FormData) {
  const response = await fetch("/api/meshy", {
    method: "POST",
    body: formData,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || data?.error || `Meshy request failed: ${response.status}`)
  }

  return data
}

export async function checkMeshyStatus(taskId: string, type: "image-to-3d" | "multi-image-to-3d" | "text-to-3d", apiKey?: string) {
  const params = new URLSearchParams({ taskId, type })
  if (apiKey) params.append("apiKey", apiKey)

  const response = await fetch(`/api/meshy/status?${params.toString()}`)
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Meshy status check failed: ${response.status}`)
  }

  return data
}

export async function submitWorldLabsJob(formData: FormData) {
  const response = await fetch("/api/worldlabs", {
    method: "POST",
    body: formData,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || data?.error || `World Labs request failed: ${response.status}`)
  }

  return data
}

export async function checkWorldLabsStatus(operationId: string, apiKey?: string) {
  const params = new URLSearchParams({ operationId })
  if (apiKey) params.append("apiKey", apiKey)

  const response = await fetch(`/api/worldlabs/status?${params.toString()}`)
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `World Labs status check failed: ${response.status}`)
  }

  return data
}



