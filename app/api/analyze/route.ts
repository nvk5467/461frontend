import { type NextRequest, NextResponse } from "next/server"
import { BACKEND_URL } from "@/lib/utils";
import { customFetch } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { expression } = await req.json()

    // Forward the request to the Flask backend
    const response = await customFetch(`${BACKEND_URL}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expression }),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in analyze API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

