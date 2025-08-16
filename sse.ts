export function createSSEResponse(onStart: (send: (data: any) => void) => Promise<void>): Response {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        const chunk = encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        controller.enqueue(chunk)
      }

      try {
        await onStart(send)
      } catch (error) {
        console.error("SSE stream error:", error)
        send({ type: "error", message: "Stream error" })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
