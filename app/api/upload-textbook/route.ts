import { type NextRequest, NextResponse } from "next/server"
import { BACKEND_URL } from "@/lib/utils";
import { customFetch } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const flaskResponse = await customFetch(`${BACKEND_URL}/api/upload-textbook`, {
      method: "POST",
      body: formData,
    })

    const data = await flaskResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in textbook upload API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 
