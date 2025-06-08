import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const flaskResponse = await fetch("http://localhost:5000/api/upload-textbook", {
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