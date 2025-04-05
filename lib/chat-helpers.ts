import type { Message } from "ai"

export function parseStreamData(data: string): { content: string } | null {
  if (data === "[DONE]") return null

  try {
    return JSON.parse(data)
  } catch (error) {
    console.error("Error parsing stream data:", error)
    return null
  }
}

export function formatChatMessages(messages: Message[]): any[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }))
}

