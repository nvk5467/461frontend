"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useChat } from "ai/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Lightbulb } from "lucide-react"
import { BACKEND_URL } from "@/lib/utils";


type Chunk = string | { content: string };

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">CMPSC 360 Tutor</h1>

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
  const [labels, setLabels] = useState<string[]>([])
  const [selectedLabel, setSelectedLabel] = useState("")
  const [uploadType, setUploadType] = useState<"example" | "textbook">("example")

  // Fetch available labels on component mount
  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/labels`)
        const data = await response.json()
        setLabels(data.labels)
        if (data.labels.length > 0) {
          setSelectedLabel(data.labels[0])
        }
      } catch (error) {
        console.error("Error fetching labels:", error)
        setMessage("Error loading available labels")
      }
    }
    fetchLabels()
  }, [])

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !selectedLabel) return

    setIsUploading(true)
    setMessage("")

    const formData = new FormData()
    formData.append("file", file)
    formData.append("label", selectedLabel)

    try {
      const endpoint = uploadType === "textbook"
        ? `${BACKEND_URL}/api/upload-textbook`
        : `${BACKEND_URL}/api/upload`

      const response = await fetch(endpoint, {
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
        <CardDescription>
          {uploadType === "textbook"
            ? "Upload individual textbook chapters to improve tutoring responses. Each chapter should be uploaded separately with its corresponding topic label."
            : "Upload example breakdowns to improve tutoring responses"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFileUpload} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Upload Type</label>
            <select
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value as "example" | "textbook")}
              className="w-full p-2 border rounded-md"
              disabled={isUploading}
            >
              <option value="example">Example Breakdown</option>
              <option value="textbook">Textbook Chapter</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Topic</label>
            <select
              value={selectedLabel}
              onChange={(e) => setSelectedLabel(e.target.value)}
              className="w-full p-2 border rounded-md"
              disabled={isUploading}
            >
              {labels.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
            {uploadType === "textbook" && (
              <p className="text-sm text-muted-foreground mt-1">
                Select the topic that matches this chapter's content. This ensures the chapter is stored in the correct index for accurate retrieval.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {uploadType === "textbook" ? "Upload Textbook Chapter" : "Upload File"}
            </label>
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={isUploading}
              accept={uploadType === "textbook" ? ".pdf" : ".txt,.pdf,.md"}
            />
            {uploadType === "textbook" && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Upload one chapter at a time</p>
                <p>• Each chapter should be a separate PDF file</p>
                <p>• Make sure to select the correct topic label for the chapter</p>
                <p>• The system will automatically split the chapter into manageable chunks</p>
              </div>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isUploading || !file || !selectedLabel}>
            {isUploading ? "Uploading..." : `Upload ${uploadType === "textbook" ? "Chapter" : "File"}`}
          </Button>
        </form>
        {message && (
          <div className={`mt-4 p-2 rounded-lg text-center ${
            message.includes("successfully") ? "bg-green-50 text-green-900" : "bg-muted"
          }`}>
            {message}
          </div>
        )}
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
  const [problemType, setProblemType] = useState<string | null>(null)
  const [retrievedChunks, setRetrievedChunks] = useState<Chunk[]>([])
  const [isAttemptingOverallAnswer, setIsAttemptingOverallAnswer] = useState(false)
  const [correctFinalAnswer, setCorrectFinalAnswer] = useState<string | null>(null)

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
    setProblemType(null)
    setRetrievedChunks([])
    setIsAttemptingOverallAnswer(false)
    setCorrectFinalAnswer(null)

    try {
      const response = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: expression }),
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      setAnalysis(data.content)
      setProblemType(data.problem_type || null)
      setRetrievedChunks(data.retrieved_chunks || [])

      let parsedSteps: {number: number; content: string; question: string; answer: string}[] = [];
      // First try to use the structured steps from the response
      if (data.steps && data.steps.length > 0) {
        parsedSteps = data.steps; // Use structured steps if available
      } else {
        // Fallback to parsing the content if structured steps aren't available
        const stepRegex = /Step\s+(\d+):\s+([\s\S]+?)(?=\n\s*Step\s+\d+:|$)/g; // Replaced .+? with [\s\S]+? to match newlines without 's' flag
        const matches = [...data.content.matchAll(stepRegex)]
        if (matches.length === 0) {
          setError("Could not parse steps from the response. Please try again.")
          setIsLoading(false); // Ensure loading is false on error
          return;
        }
        parsedSteps = matches.map(match => ({
          number: parseInt(match[1]),
          content: match[2].trim(),
          question: "", // Empty question for parsed steps
          answer: "" // Empty answer for parsed steps
        }))
      }

      setSteps(parsedSteps);
      setCorrectFinalAnswer(data.final_answer || null);

      // If steps are available, prompt for overall answer first
      if (parsedSteps.length > 0) {
        setIsAttemptingOverallAnswer(true);
        setCurrentStep(0); // Still set to 0, but steps won't be shown yet
      } else {
        setIsAttemptingOverallAnswer(false);
        setCurrentStep(0); // Start at the first step if no steps returned (shouldn't happen with current backend logic)
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
    if (!userAnswer.trim()) return

    setIsVerifying(true)
    setVerificationResult(null);
    setError(null);

    try {
      let responseData;
      if (isAttemptingOverallAnswer) {
        // User is submitting the overall answer
        const response = await fetch(`${BACKEND_URL}/api/submit-overall-answer`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            expression: expression, // Send original expression
            user_answer: userAnswer,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        responseData = await response.json();

        if (responseData.is_correct) {
          setVerificationResult({
            isCorrect: true,
            explanation: responseData.explanation || "Your answer is correct!",
            hint: ' '
          });
          setIsAttemptingOverallAnswer(false); // Reset for next analysis
          setSteps([]); // Clear steps since they're not needed for correct answers
          setCurrentStep(0);
        } else {
          setVerificationResult({
            isCorrect: false,
            explanation: responseData.explanation || "Your answer is incorrect.",
            hint: ' ' // Backend doesn't provide hint for overall answer currently
          });
          // If incorrect, set steps and switch to step-by-step view
          if (responseData.steps) {
              setSteps(responseData.steps);
              setCurrentStep(0);
          }
          setIsAttemptingOverallAnswer(false);
        }

      } else if (steps[currentStep]) {
        // User is answering a question about a specific step or asking a question
        const response = await fetch(`${BACKEND_URL}/api/verify-answer`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answer: userAnswer,
            correct_answer: steps[currentStep].answer,
            step: steps[currentStep].content,
            is_question: isAskingQuestion,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        responseData = await response.json();

        console.log("Verification response:", responseData);
        setVerificationResult({
          isCorrect: responseData.is_correct === true,
          explanation: responseData.explanation,
          hint: responseData.hint
        });
        setShowHint(false);
        // isAskingQuestion state is handled by button clicks
      }
      setUserAnswer(""); // Clear input after submission

    } catch (error) {
      console.error("Error verifying answer:", error);
      setError(error instanceof Error ? error.message : "An error occurred while verifying your answer");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      setUserAnswer("")
      setVerificationResult(null)
      setShowHint(false)
      setIsAskingQuestion(false); // Reset 'ask question' mode when moving steps
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setUserAnswer("")
      setVerificationResult(null)
      setShowHint(false)
      setIsAskingQuestion(false); // Reset 'ask question' mode when moving steps
    }
  }

  const handleRequestHint = async () => {
    if (!steps[currentStep]) return; // Ensure a step is selected
    try {
      const response = await fetch(`${BACKEND_URL}/api/verify-answer`, {
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

        {problemType && (
          <div className="p-2 bg-blue-50 rounded-lg text-blue-900">
            <strong>Detected Topic:</strong> {problemType}
          </div>
        )}

        {retrievedChunks && retrievedChunks.length > 0 && (
          <div className="p-4 mt-4 bg-green-50 rounded-lg text-green-900">
            <h4 className="font-medium mb-2">Retrieved Textbook Chunks:</h4>
            <ul className="list-disc ml-6 space-y-2 text-sm">
              {retrievedChunks.map((chunk, i) => (
                <li key={i}>{typeof chunk === 'string' ? chunk : chunk.content}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {isAttemptingOverallAnswer && steps.length > 0 && ( // Show overall answer input form
            <div className="mt-6 space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Attempt the full problem:</h4>
                       {/* Optionally display the original expression again */}
                       <div className="whitespace-pre-wrap">{expression}</div>
                    </div>
                     <form onSubmit={handleVerifyAnswer} className="space-y-4">
                         <Textarea
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="Enter your final answer here..."
                            className="min-h-[100px]"
                            disabled={isVerifying}
                         />
                        <Button type="submit" className="w-full" disabled={isVerifying}>
                           {isVerifying ? "Processing..." : "Submit Final Answer"}
                        </Button>
                     </form>
                     {verificationResult && ( // Display verification result for overall answer
                        <div className="mt-4 p-4 border border-gray-300 rounded-lg">
                            <h4 className="font-medium mb-2">
                                {verificationResult.isCorrect ? "Correct!" : "Incorrect"}
                            </h4>
                            <div className="whitespace-pre-wrap">{verificationResult.explanation}</div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {!isAttemptingOverallAnswer && steps.length > 0 && ( // Show step-by-step view if not attempting overall answer and steps are available
          <div className="mt-6 space-y-4">
            {!isAttemptingOverallAnswer && (
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
            )}

            <div className="p-4 bg-muted rounded-lg">
              {steps[currentStep] && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Step {steps[currentStep].number} of {steps.length}</h4>
                  <div className="whitespace-pre-wrap">{steps[currentStep].content}</div>
                </div>
              )}

              {steps[currentStep]?.question && !isAskingQuestion && ( // Show step question if exists and not asking a question about a step
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
                    {isVerifying ? "Processing..." : isAskingQuestion ? "Ask Question" : "Submit Step Answer"}
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
                </div>
              </form>

              {verificationResult && (
                <div className="mt-4 p-4 border border-gray-300 rounded-lg">
                  <h4 className="font-medium mb-2">
                    {verificationResult.isCorrect ? "Correct!" : "Not quite right"}
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

