import { type NextRequest, NextResponse } from "next/server"
import { BACKEND_URL } from "@/lib/utils";
import { customFetch } from "@/lib/utils";
export async function POST(req: NextRequest) {
  try {
    const { messages, stream = false } = await req.json()

    // Forward the request to the Flask backend
    const response = await customFetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages, stream }),
    })

    // If streaming is requested, we need to forward the stream
    if (stream) {
      // Create a TransformStream to process the incoming stream
      const { readable, writable } = new TransformStream()

      // Process the Flask stream and write to our stream
      const flaskStream = response.body
      if (!flaskStream) {
        return NextResponse.json({ error: "No stream received from backend" }, { status: 500 })
      }

      const reader = flaskStream.getReader()
      const writer = writable.getWriter()

      // Process the stream
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              await writer.close()
              break
            }

            // Forward the chunk
            await writer.write(value)
          }
        } catch (error) {
          console.error("Error processing stream:", error)
          await writer.abort(error as Error)
        }
      }

      // Start processing without awaiting
      processStream()

      // Return the readable part of our stream
      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    } else {
      // For non-streaming responses, just return the JSON
      const data = await response.json()
      return NextResponse.json(data)
    }
  } catch (error) {
    console.error("Error in chat API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

