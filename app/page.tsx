"use client"

import type React from "react"

import { useState } from "react"
import { useChat } from "ai/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Lightbulb } from "lucide-react"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">CMPSC 461 Tutor</h1>

        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="analyze">Analyze Expression</TabsTrigger>
            <TabsTrigger value="upload">Upload Docs</TabsTrigger>
          </TabsList>


          <TabsContent value="chat" className="mt-4">
            <ChatInterface />
          </TabsContent>

          <TabsContent value="analyze" className="mt-4">
            <AnalyzeInterface />
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <UploadInterface />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

function UploadInterface() {
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)
    setMessage("")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      setMessage(data.message || data.error || "Upload successful!")
    } catch (error) {
      console.error("Error uploading file:", error)
      setMessage("An error occurred while uploading. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
        <CardDescription>Upload example breakdowns to improve tutoring responses</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFileUpload} className="space-y-4">
          <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={isUploading} />
          <Button type="submit" className="w-full" disabled={isUploading || !file}>
            {isUploading ? "Uploading..." : "Upload File"}
          </Button>
        </form>
        {message && <div className="mt-4 p-2 bg-muted rounded-lg text-center">{message}</div>}
      </CardContent>
    </Card>
  )
}
function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    body: {
      stream: true,
    },
  })

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Chat with CMPSC 461 Tutor</CardTitle>
        <CardDescription>Ask questions about lambda calculus or get help with concepts</CardDescription>
      </CardHeader>
      <CardContent className="h-[60vh] overflow-y-auto space-y-4 p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div className="space-y-2">
              <Lightbulb className="h-12 w-12 mx-auto text-gray-400" />
              <p className="text-lg text-gray-500">Start a conversation with your Lambda Calculus tutor</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))
        )}
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="flex w-full space-x-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask a question about lambda calculus..."
            className="flex-grow"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}

function AnalyzeInterface() {
  const [expression, setExpression] = useState("")
  const [analysis, setAnalysis] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expression.trim()) return

    setIsLoading(true)
    setAnalysis("")

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expression }),
      })

      const data = await response.json()
      setAnalysis(data.content)
    } catch (error) {
      console.error("Error analyzing expression:", error)
      setAnalysis("An error occurred while analyzing the expression. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Analyze Expression</CardTitle>
        <CardDescription>Enter an expression to get a step-by-step breakdown</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <Textarea
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="Enter an  expression"
            className="min-h-[100px]"
            disabled={isLoading}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Analyzing..." : "Analyze Expression"}
          </Button>
        </form>

        {analysis && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="text-lg font-medium mb-2">Analysis:</h3>
            <div className="whitespace-pre-wrap">{analysis}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

