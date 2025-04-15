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
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<{number: number; content: string; question: string; answer: string}[]>([])
  const [userAnswer, setUserAnswer] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{isCorrect: boolean; explanation: string; hint?: string} | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [hint, setHint] = useState("")
  const [isAskingQuestion, setIsAskingQuestion] = useState(false)

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expression.trim()) return

    setIsLoading(true)
    setAnalysis("")
    setCurrentStep(0)
    setSteps([])
    setUserAnswer("")
    setVerificationResult(null)
    setError(null)

    try {
      const response = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expression }),
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      setAnalysis(data.content)
      
      // First try to use the structured steps from the response
      if (data.steps && data.steps.length > 0) {
        setSteps(data.steps)
      } else {
        // Fallback to parsing the content if structured steps aren't available
        const stepRegex = /Step\s+(\d+):\s+(.+?)(?=\n\s*Step\s+\d+:|$)/g
        const matches = [...data.content.matchAll(stepRegex)]
        
        if (matches.length === 0) {
          setError("Could not parse steps from the response. Please try again.")
          return
        }

        const parsedSteps = matches.map(match => ({
          number: parseInt(match[1]),
          content: match[2].trim(),
          question: "", // Empty question for parsed steps
          answer: "" // Empty answer for parsed steps
        }))
        
        setSteps(parsedSteps)
      }
    } catch (error) {
      console.error("Error analyzing expression:", error)
      setError(error instanceof Error ? error.message : "An error occurred while analyzing the expression")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userAnswer.trim() || !steps[currentStep]) return

    setIsVerifying(true)
    try {
      const response = await fetch("http://localhost:5000/api/verify-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answer: userAnswer,
          correct_answer: steps[currentStep].answer,
          step: steps[currentStep].content,
          is_question: isAskingQuestion
        }),
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      console.log("Verification response:", data)
      setVerificationResult({
        isCorrect: data.is_correct === true,
        explanation: data.explanation,
        hint: data.hint
      })
      setShowHint(false)
      setIsAskingQuestion(false)
    } catch (error) {
      console.error("Error verifying answer:", error)
      setError(error instanceof Error ? error.message : "An error occurred while verifying your answer")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      setUserAnswer("")
      setVerificationResult(null)
      setShowHint(false)
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setUserAnswer("")
      setVerificationResult(null)
      setShowHint(false)
    }
  }

  const handleRequestHint = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/verify-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          step: steps[currentStep].content,
          correct_answer: steps[currentStep].answer,
          request_hint: true
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setHint(data.hint);
      setShowHint(true);
    } catch (error) {
      console.error("Error getting hint:", error);
      setHint("Error getting hint. Please try again.");
      setShowHint(true);
    }
  };

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
            placeholder="Enter an expression"
            className="min-h-[100px]"
            disabled={isLoading}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Analyzing..." : "Start Analysis"}
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {steps.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex justify-end gap-2">
              <button
                onClick={handlePreviousStep}
                disabled={currentStep === 0}
                className="text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
              </button>
              <button
                onClick={handleNextStep}
                disabled={currentStep === steps.length - 1}
                className="text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="mb-4">
                <h4 className="font-medium mb-2">Step {steps[currentStep].number} of {steps.length}</h4>
                <div className="whitespace-pre-wrap">{steps[currentStep].content}</div>
              </div>

              {steps[currentStep].question && !isAskingQuestion && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Question:</h4>
                  <div className="whitespace-pre-wrap">{steps[currentStep].question}</div>
                </div>
              )}

              <form onSubmit={handleVerifyAnswer} className="space-y-4">
                <Textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder={isAskingQuestion ? "Ask your question about this step..." : "Enter your answer..."}
                  className="min-h-[100px]"
                  disabled={isVerifying}
                />
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={isVerifying}>
                    {isVerifying ? "Processing..." : isAskingQuestion ? "Ask Question" : "Submit Answer"}
                  </Button>
                  {!isAskingQuestion && !verificationResult?.isCorrect && !showHint && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleRequestHint}
                      className="flex-1"
                    >
                      Need a hint?
                    </Button>
                  )}
                  {!isAskingQuestion && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAskingQuestion(true)}
                      className="flex-1"
                    >
                      Ask a Question
                    </Button>
                  )}
                </div>
              </form>

              {verificationResult && (
                <div className="mt-4 p-4 border border-gray-300 rounded-lg">
                  <h4 className="font-medium mb-2">
                    {isAskingQuestion ? "Answer to your question:" : verificationResult.isCorrect ? "Correct!" : "Not quite right"}
                  </h4>
                  <div className="whitespace-pre-wrap">{verificationResult.explanation}</div>
                </div>
              )}

              {showHint && (
                <div className="mt-4 p-4 border border-gray-300 rounded-lg">
                  <h4 className="font-medium mb-2">Hint:</h4>
                  <div className="whitespace-pre-wrap">{hint || "Think about the key concepts in this step."}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

