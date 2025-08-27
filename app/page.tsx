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
import { customFetch } from "@/lib/utils";
import TruthTableBuilder from "@/components/TruthTableBuilder";




type Chunk = string | { content: string };

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">CMPSC 360 Tutor</h1>

        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="flex w-full justify-between">
            {/* <TabsTrigger value="chat">Chat</TabsTrigger> */}
            <TabsTrigger value="analyze" className="flex-1">Analyze Expression</TabsTrigger>
            <TabsTrigger value="inference" className="flex-1">Inference</TabsTrigger>
            <TabsTrigger value="proof" className="flex-1">Proof</TabsTrigger>
            <TabsTrigger value="upload" className="flex-1">Upload Docs</TabsTrigger>
            
          </TabsList>


          {/* <TabsContent value="chat" className="mt-4">
            <ChatInterface />
          </TabsContent> */}

          <TabsContent value="analyze" className="mt-4">
            <AnalyzeInterface />
          </TabsContent>

          <TabsContent value="inference" className="mt-4">
            <InferenceInterface />
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <UploadInterface />
          </TabsContent>

          <TabsContent value="proof" className="mt-4">
            <ProofInterface />
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
        console.log(`${BACKEND_URL}/api/labels`)
        const response = await customFetch(`${BACKEND_URL}/api/labels`)
        console.log("Raw response:", response);
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

      const response = await customFetch(endpoint, {
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
  const [initialAttemptMessage, setInitialAttemptMessage] = useState<string | null>(null)
  const [originalExpression, setOriginalExpression] = useState<string>("")
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState(0)
  const [showTruthTableBuilder, setShowTruthTableBuilder] = useState(false)
  const [truthTableVars, setTruthTableVars] = useState<string[]>([])

  const detectTruthTableIntent = (text: string): boolean => {
    const lc = text.toLowerCase()
    return (
      lc.includes("truth table") ||
      lc.includes("truth-table") ||
      lc.includes("construct the truth table") ||
      lc.includes("construct a truth table") ||
      lc.includes("build a truth table") ||
      lc.includes("create a truth table") ||
      lc.includes("form a truth table")
    )
  }

  const extractTruthVars = (text: string): string[] => {
    // Prefer variables inside parentheses if present
    const insideParens: string[] = []
    const parenMatches = text.match(/\(([^)]*)\)/g) || []
    for (const seg of parenMatches) {
      const inner = seg.slice(1, -1)
      insideParens.push(inner)
    }
    const source = insideParens.length > 0 ? insideParens.join(" ") : text
    const candidates = source.match(/[A-Za-z]/g) || []
    const uniqueLetters = Array.from(new Set(candidates.map(c => c.trim()).filter(c => /[A-Za-z]/.test(c))))
    // Keep typical propositional variable letters and limit to 6
    const preferredOrder = "pqrstuvwxyzabcdefghijklmno".split("")
    const sorted = preferredOrder.filter(ch => uniqueLetters.includes(ch) || uniqueLetters.includes(ch.toUpperCase()))
    const picked = sorted.length > 0 ? sorted : uniqueLetters
    return Array.from(new Set(picked.slice(0, 6))).map(v => v)
  }

  useEffect(() => {
    const shouldShow = detectTruthTableIntent(expression)
    setShowTruthTableBuilder(shouldShow)
    setTruthTableVars(shouldShow ? extractTruthVars(expression) : [])
  }, [expression])

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
    setOriginalExpression(expression) // Store the original expression that was analyzed
    setCorrectAnswers(0) // Reset score counters
    setWrongAnswers(0)

    try {
      const response = await customFetch(`${BACKEND_URL}/api/analyze`, {
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
    setVerificationResult(null)
    setError(null)
    setInitialAttemptMessage(null) // Reset message on new attempt

    try {
      let responseData;
      if (isAttemptingOverallAnswer) {
        // User is submitting the overall answer
        const response = await customFetch(`${BACKEND_URL}/api/submit-overall-answer`, {
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
          setCorrectAnswers(prev => prev + 1); // Increment correct answers
          setVerificationResult({
            isCorrect: true,
            explanation: responseData.explanation || "Your answer is correct!",
            hint: ' '
          });
          setInitialAttemptMessage("Correct! Good job.");
          setIsAttemptingOverallAnswer(false); // Reset for next analysis
          setSteps([]); // Clear steps since they're not needed for correct answers
          setCurrentStep(0);
        } else {
          setWrongAnswers(prev => prev + 1); // Increment wrong answers
          setVerificationResult({
            isCorrect: false,
            explanation: responseData.explanation || "Your answer is incorrect.",
            hint: ' ' // Backend doesn't provide hint for overall answer currently
          });
          setInitialAttemptMessage("Incorrect. Check out the step-by-step guide.");
          // If incorrect, set steps and switch to step-by-step view
          if (responseData.steps) {
              setSteps(responseData.steps);
              setCurrentStep(0);
              setInitialAttemptMessage(null); // Clear the message when step-by-step guide is shown
          }
          setIsAttemptingOverallAnswer(false);
        }

      } else if (steps[currentStep]) {
        // User is answering a question about a specific step or asking a question
        const response = await customFetch(`${BACKEND_URL}/api/verify-answer`, {
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
        
        // Update score counters based on verification result
        if (responseData.is_correct === true) {
          setCorrectAnswers(prev => prev + 1);
        } else {
          setWrongAnswers(prev => prev + 1);
        }
        
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
    console.log(`${BACKEND_URL}/api/verify-answer`)
    try {
      const response = await customFetch(`${BACKEND_URL}/api/verify-answer`, {
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
        <CardTitle>Analyze Question</CardTitle>
        <CardDescription>Enter a question to get a step-by-step breakdown</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <Textarea
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="Enter an expression"
            className="min-h-[100px]"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAnalyze(e);
              }
            }}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Analyzing..." : "Start Analysis"}
          </Button>
        </form>

        {showTruthTableBuilder && (
          <div className="mt-4">
            <TruthTableBuilder initialVariables={truthTableVars} />
          </div>
        )}

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
                       <div className="whitespace-pre-wrap">{originalExpression}</div>
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
            {(correctAnswers > 0 || wrongAnswers > 0) && (
              <div className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-green-600">
                  <span className="text-lg">✓</span>
                  <span className="font-medium">Correct: {correctAnswers}</span>
                </div>
                <div className="flex items-center gap-2 text-red-600">
                  <span className="text-lg">✗</span>
                  <span className="font-medium">Wrong: {wrongAnswers}</span>
                </div>
              </div>
            )}
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

        {initialAttemptMessage && (isAttemptingOverallAnswer || steps.length === 0) && (
          <div className="mt-4 p-4 bg-blue-50 text-blue-900 rounded-lg">
            {initialAttemptMessage}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function InferenceInterface() {
  const [premises, setPremises] = useState("")
  const [goal, setGoal] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [resultText, setResultText] = useState("")
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [steps, setSteps] = useState<string[]>([""])
  const [hints, setHints] = useState<{step: string, hint: string, expected: string}[]>([])
  const [currentHintIndex, setCurrentHintIndex] = useState(0)
  const [isSubmittingStep, setIsSubmittingStep] = useState(false)
  const [completedSections, setCompletedSections] = useState<{hintIndex: number, hint: string, steps: string[], isCorrect: boolean, feedback?: string}[]>([])
  const [currentSteps, setCurrentSteps] = useState<string[]>([""])
  const [currentRules, setCurrentRules] = useState<string[]>([""])
  const [verificationResult, setVerificationResult] = useState<{isCorrect: boolean, feedback: string, suggestion: string} | null>(null)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState(0)

  // Available inference rules
  const inferenceRules = [
    "Select a rule...",
    "Additive",
    "Simplification",
    "Conjunction",
    "Modus Ponens",
    "Modus Tollens",
    "Hypothetical Syllogism",
    "Disjunctive Syllogism",
    "Resolution",
    "Double Negation",
    "Hypothesis"
  ]

  const handleRetryStep = (sectionIndex: number) => {
    const sectionToRetry = completedSections[sectionIndex];
    // Remove the incorrect section from completed sections
    const updatedCompletedSections = completedSections.filter((_, index) => index !== sectionIndex);
    setCompletedSections(updatedCompletedSections);
    
    // Set current step to the retried step
    setCurrentHintIndex(sectionToRetry.hintIndex);
    setCurrentSteps(sectionToRetry.steps);
    setCurrentRules(new Array(sectionToRetry.steps.length).fill(""));
    setVerificationResult(null);
  }

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!premises.trim() || !goal.trim()) return;

    setIsLoading(true);
    setResultText("")
    setHasSubmitted(true);
    setVerificationResult(null);
    setCorrectAnswers(0); // Reset score counters
    setWrongAnswers(0);

    try {
      const response = await customFetch(`${BACKEND_URL}/api/analyze-inference`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ premises, goal }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setResultText(data.actual_proof || "No result text available.")
      
      // Use dynamic hints from API
      setHints(data.hints || [
        { step: "Step 1", hint: "Start by identifying the premises and what you need to prove.", expected: "List the premises and clearly state what you need to prove." },
        { step: "Step 2", hint: "Look for patterns that match known inference rules like Modus Ponens.", expected: "Identify which inference rules apply." },
        { step: "Step 3", hint: "Apply the inference rule to derive your conclusion.", expected: "Show each inference step with the rule used." }
      ]);
      setCurrentHintIndex(0);
      setCurrentSteps([""]);
      setCurrentRules([""]);
      setCompletedSections([]);
    } catch (error) {
      console.error("Error analyzing expression:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addStep = () => {
    setCurrentSteps([...currentSteps, ""]);
    setCurrentRules([...currentRules, ""]);
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...currentSteps];
    newSteps[index] = value;
    setCurrentSteps(newSteps);
  };

  const updateRule = (index: number, value: string) => {
    const newRules = [...currentRules];
    newRules[index] = value;
    setCurrentRules(newRules);
  };

  const removeStep = (index: number) => {
    if (currentSteps.length > 1) {
      const newSteps = currentSteps.filter((_, i) => i !== index);
      const newRules = currentRules.filter((_, i) => i !== index);
      setCurrentSteps(newSteps);
      setCurrentRules(newRules);
    }
  };

  const handleSubmitSteps = async () => {
    setIsSubmittingStep(true);
    setVerificationResult(null);
    
    try {
      // Combine steps and rules
      const combinedSteps = currentSteps.map((step, index) => {
        const rule = currentRules[index];
        if (step.trim() && rule && rule !== "Select a rule...") {
          return `${step} [Rule: ${rule}]`;
        }
        return step;
      });

      const response = await customFetch(`${BACKEND_URL}/api/verify-inference-steps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_steps: combinedSteps,
          hint_index: currentHintIndex,
          hint_expected: hints[currentHintIndex].expected,
          hint_text: hints[currentHintIndex].hint,
          premises: premises,
          goal: goal
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      // Update score counters based on verification result
      if (data.is_correct) {
        setCorrectAnswers(prev => prev + 1);
      } else {
        setWrongAnswers(prev => prev + 1);
      }
      
      // Add to completed sections
      const completedSection = {
        hintIndex: currentHintIndex,
        hint: hints[currentHintIndex].hint,
        steps: [...currentSteps],
        isCorrect: data.is_correct,
        feedback: data.feedback
      };
      setCompletedSections([...completedSections, completedSection]);
      
      // Move to next hint if correct and not the last one
      if (data.is_correct && currentHintIndex < hints.length - 1) {
        setCurrentHintIndex(currentHintIndex + 1);
        setCurrentSteps([""]);
        setVerificationResult(null); // Clear only when moving to next step
      } else {
        // For incorrect answers, don't show verification result since it's now in completed sections
        setVerificationResult(null);
      }
    } catch (error) {
      console.error("Error submitting steps:", error);
    } finally {
      setIsSubmittingStep(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Inference</CardTitle>
        <CardDescription>Enter premises and goal for inference</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <details className="mt-4">
            <summary className="cursor-pointer font-medium">📝 Rules for Entering Premises and Goal</summary>
            <div className="mt-2 space-y-2 max-h-64 overflow-y-auto border border-gray-300 rounded-md">
              <p>✅ 1. One formula per line</p>
              <p>Each premise should go on its own line. Example:</p>
              <pre className="bg-gray-100 p-2 rounded">p → q
q → r
¬r</pre>
              <p>✅ 2. Use correct symbols</p>
              <p>→ for implication (you can type → or -&gt;)</p>
              <p>∨ for OR (disjunction)</p>
              <p>∧ for AND (conjunction)</p>
              <p>¬ for NOT (negation)</p>
              <p>Example:</p>
              <pre className="bg-gray-100 p-2 rounded">p ∨ q
p ∧ r
¬r</pre>
              <p>✅ 3. No commas between formulas</p>
              <p>Do not separate formulas with commas ,. Use new lines.</p>
              <p>❌ Wrong:</p>
              <pre className="bg-gray-100 p-2 rounded">p → q, q → r, ¬r</pre>
              <p>✅ Correct:</p>
              <pre className="bg-gray-100 p-2 rounded">p → q
q → r
¬r</pre>
              <p>✅ 4. Goal input</p>
              <p>Type your goal formula as you want to prove it. Example:</p>
              <pre className="bg-gray-100 p-2 rounded">r</pre>
              <p>✅ 5. Variables and constants</p>
              <p>Propositions like p, q, r, s, etc. → can be any letter.</p>
              <p>You can also use words: rain, wet, etc.</p>
              <p>✅ 6. No ending dots . needed</p>
              <p>The system will automatically format your input for Gkc → no need to add . at the end of each formula.</p>
            </div>
          </details>
          <form onSubmit={handleAnalyze} className="space-y-4">
            <Textarea
              value={premises}
              onChange={(e) => setPremises(e.target.value)}
              placeholder="Enter inference premises"
              className="min-h-[100px]"
              disabled={isLoading}
            />
            <Textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Enter inference goal"
              className="min-h-[100px]"
              disabled={isLoading}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Analyzing..." : "Start Analysis"}
            </Button>
          </form>
          {/* Debug result - commented out for step-by-step interface
          {resultText && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg text-green-900">
              <h4 className="font-medium mb-2">Inference Result:</h4>
              <div className="whitespace-pre-wrap">{resultText}</div>
            </div>
          )}
          */}

          {hasSubmitted && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-900">Your Problem:</h4>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-blue-800">Premises:</span>
                    <div className="whitespace-pre-wrap text-blue-700 ml-2">{premises}</div>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Goal:</span>
                    <div className="whitespace-pre-wrap text-blue-700 ml-2">{goal}</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                {(correctAnswers > 0 || wrongAnswers > 0) && (
                  <div className="flex gap-4 p-3 bg-white rounded-lg mb-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <span className="text-lg">✓</span>
                      <span className="font-medium">Correct: {correctAnswers}</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-600">
                      <span className="text-lg">✗</span>
                      <span className="font-medium">Wrong: {wrongAnswers}</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Work through the steps:</h4>
                  <div className="text-sm text-gray-600">
                    Step {currentHintIndex + 1} of {hints.length}
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Completed Sections */}
                  {completedSections.map((section, sectionIndex) => (
                    <div key={`completed-${section.hintIndex}`} className={`border-2 rounded-lg p-4 ${
                      section.isCorrect 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-orange-200 bg-orange-50'
                    }`}>
                      <div className="grid grid-cols-12 gap-4">
                        {/* Completed Steps Column */}
                        <div className="col-span-8">
                          <h5 className={`text-sm font-medium mb-3 ${
                            section.isCorrect 
                              ? 'text-green-800' 
                              : 'text-orange-800'
                          }`}>
                            {section.isCorrect ? '✅' : '⚠️'} {section.isCorrect ? 'Completed' : 'Attempted'} - Step {section.hintIndex + 1}
                          </h5>
                          <div className="space-y-3">
                            {section.steps.map((step, stepIndex) => (
                              <div key={stepIndex} className="flex items-start gap-2">
                                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mt-1 ${
                                  section.isCorrect 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {stepIndex + 1}
                                </span>
                                <div className="flex-1 bg-white p-3 rounded border text-sm">
                                  {step}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Retry Button for Incorrect Sections */}
                          {!section.isCorrect && (
                            <div className="mt-4 pt-4 border-t border-orange-200">
                              <Button 
                                onClick={() => handleRetryStep(sectionIndex)}
                                variant="outline"
                                className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                              >
                                🔄 Retry This Step
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Completed Hint Column */}
                        <div className="col-span-4">
                          <div className={`border-l-4 p-3 rounded-r-lg ${
                            section.isCorrect 
                              ? 'bg-green-100 border-green-400' 
                              : 'bg-orange-100 border-orange-400'
                          }`}>
                            <div className={`text-sm font-medium mb-1 ${
                              section.isCorrect 
                                ? 'text-green-800' 
                                : 'text-orange-800'
                            }`}>
                              💡 Hint {section.hintIndex + 1}
                            </div>
                            <div className={`text-sm mb-2 ${
                              section.isCorrect 
                                ? 'text-green-700' 
                                : 'text-orange-700'
                            }`}>
                              {section.hint}
                            </div>
                            {section.feedback && (
                              <div className={`text-xs p-2 rounded ${
                                section.isCorrect 
                                  ? 'bg-green-50 text-green-600' 
                                  : 'bg-orange-50 text-orange-600'
                              }`}>
                                <strong>Feedback:</strong> {section.feedback}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Current Working Section */}
                  {currentHintIndex < hints.length && (
                    <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                      <div className="grid grid-cols-12 gap-4">
                        {/* Current Steps Column */}
                        <div className="col-span-8">
                          <h5 className="text-sm font-medium text-blue-800 mb-3">
                            🔄 Working on Step {currentHintIndex + 1}
                          </h5>
                          <div className="space-y-3">
                            {currentSteps.map((step, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium mt-1">
                                  {index + 1}
                                </span>
                                <div className="flex-1 space-y-3">
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                                      Your Work:
                                    </label>
                                    <Textarea
                                      value={step}
                                      onChange={(e) => updateStep(index, e.target.value)}
                                      placeholder={`Enter step ${index + 1} of your reasoning...`}
                                      className="min-h-[80px] resize-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                                      Inference Rule Used:
                                    </label>
                                    <select
                                      value={currentRules[index] || ""}
                                      onChange={(e) => updateRule(index, e.target.value)}
                                      className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
                                    >
                                      {inferenceRules.map((rule, ruleIndex) => (
                                        <option key={ruleIndex} value={rule} disabled={ruleIndex === 0}>
                                          {rule}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  {index === currentSteps.length - 1 && (
                                    <div className="flex justify-end">
                                      <button
                                        onClick={addStep}
                                        className="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-600 rounded-xl flex items-center justify-center text-lg font-bold transition-colors"
                                        title="Add new step"
                                      >
                                        +
                                      </button>
                                    </div>
                                  )}
                                </div>
                                {currentSteps.length > 1 && (
                                  <button
                                    onClick={() => removeStep(index)}
                                    className="flex-shrink-0 w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full flex items-center justify-center mt-1"
                                    title="Remove step"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {/* Submit Button for Current Hint */}
                          <div className="mt-4 pt-4 border-t border-blue-200">
                            <Button 
                              onClick={handleSubmitSteps} 
                              disabled={isSubmittingStep || currentSteps.some(step => !step.trim()) || currentRules.some((rule, index) => currentSteps[index].trim() && (!rule || rule === "Select a rule..."))}
                              className="w-full"
                            >
                              {isSubmittingStep ? "Checking..." : "Submit Steps"}
                            </Button>
                          </div>

                          {/* Verification Results */}
                          {verificationResult && (
                            <div className={`mt-4 p-4 rounded-lg border-2 ${
                              verificationResult.isCorrect 
                                ? 'border-green-300 bg-green-50' 
                                : 'border-orange-300 bg-orange-50'
                            }`}>
                              <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                                  verificationResult.isCorrect 
                                    ? 'bg-green-100 text-green-600' 
                                    : 'bg-orange-100 text-orange-600'
                                }`}>
                                  {verificationResult.isCorrect ? '✓' : '!'}
                                </div>
                                <div className="flex-1">
                                  <h5 className={`font-medium mb-2 ${
                                    verificationResult.isCorrect 
                                      ? 'text-green-800' 
                                      : 'text-orange-800'
                                  }`}>
                                    {verificationResult.isCorrect ? 'Well done!' : 'Keep working on it!'}
                                  </h5>
                                  <div className={`text-sm mb-3 ${
                                    verificationResult.isCorrect 
                                      ? 'text-green-700' 
                                      : 'text-orange-700'
                                  }`}>
                                    {verificationResult.feedback}
                                  </div>
                                  {verificationResult.suggestion && (
                                    <div className={`text-sm p-3 rounded-md ${
                                      verificationResult.isCorrect 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-orange-100 text-orange-800'
                                    }`}>
                                      <strong>Suggestion:</strong> {verificationResult.suggestion}
                                    </div>
                                  )}
                                  {verificationResult.isCorrect && currentHintIndex < hints.length - 1 && (
                                    <div className="text-sm text-green-600 mt-2 font-medium">
                                      🎉 Moving to the next step!
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Current Hint Column */}
                        <div className="col-span-4">
                          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-sm relative">
                            {/* Arrow pointing to the left */}
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2">
                              <div className="w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-yellow-400"></div>
                            </div>
                            <div className="text-sm text-yellow-800 font-medium mb-2">
                              💡 Current Hint ({currentHintIndex + 1}/{hints.length})
                            </div>
                            <div className="text-sm text-yellow-700">
                              {hints[currentHintIndex].hint}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Completion Message */}
                  {currentHintIndex >= hints.length && completedSections.length > 0 && completedSections.every(section => section.isCorrect) && (
                    <div className="border-2 border-green-300 rounded-lg p-6 bg-gradient-to-r from-green-50 to-green-100">
                      <div className="text-center">
                        <div className="text-4xl mb-3">🎉</div>
                        <h5 className="text-xl font-bold text-green-800 mb-2">
                          Congratulations!
                        </h5>
                        <p className="text-green-700 mb-4">
                          You've successfully worked through all the steps of this inference proof!
                        </p>
                        <div className="bg-white p-4 rounded-lg border border-green-200">
                          <h6 className="font-medium text-green-800 mb-2">Complete Proof:</h6>
                          <div className="text-sm text-green-700 whitespace-pre-wrap text-left">
                            {resultText}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ProofInterface() {
  const [question, setQuestion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [resultText, setResultText] = useState("")
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [steps, setSteps] = useState<string[]>([""])
  const [hints, setHints] = useState<{step: string, hint: string, expected: string}[]>([])
  const [currentHintIndex, setCurrentHintIndex] = useState(0)
  const [isSubmittingStep, setIsSubmittingStep] = useState(false)
  const [completedSections, setCompletedSections] = useState<{hintIndex: number, hint: string, steps: string[], isCorrect: boolean, feedback?: string}[]>([])
  const [currentSteps, setCurrentSteps] = useState<string[]>([""])
  const [verificationResult, setVerificationResult] = useState<{isCorrect: boolean, feedback: string, suggestion: string} | null>(null)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState(0)

  const handleRetryStep = (sectionIndex: number) => {
    const sectionToRetry = completedSections[sectionIndex];
    // Remove the incorrect section from completed sections
    const updatedCompletedSections = completedSections.filter((_, index) => index !== sectionIndex);
    setCompletedSections(updatedCompletedSections);
    
    // Set current step to the retried step
    setCurrentHintIndex(sectionToRetry.hintIndex);
    setCurrentSteps(sectionToRetry.steps);
    setVerificationResult(null);
  }

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setResultText("")
    setHasSubmitted(true);
    setVerificationResult(null);
    setCorrectAnswers(0); // Reset score counters
    setWrongAnswers(0);

    try {
      const response = await customFetch(`${BACKEND_URL}/api/analyze-proof`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setResultText(data.actual_proof || "No result text available.")
      
      // Use dynamic hints from API
      setHints(data.hints || [
        { step: "Step 1", hint: "Start by identifying what you need to prove and what you're given.", expected: "State the theorem or statement to prove and list any given conditions." },
        { step: "Step 2", hint: "Choose an appropriate proof technique based on the structure of the statement.", expected: "Identify the proof method and explain why it's suitable." },
        { step: "Step 3", hint: "Work through the logical steps of your chosen proof method.", expected: "Show the main reasoning steps of the proof." }
      ]);
      setCurrentHintIndex(0);
      setCurrentSteps([""]);
      setCompletedSections([]);
    } catch (error) {
      console.error("Error analyzing proof:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addStep = () => {
    setCurrentSteps([...currentSteps, ""]);
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...currentSteps];
    newSteps[index] = value;
    setCurrentSteps(newSteps);
  };

  const removeStep = (index: number) => {
    if (currentSteps.length > 1) {
      const newSteps = currentSteps.filter((_, i) => i !== index);
      setCurrentSteps(newSteps);
    }
  };

  const handleSubmitSteps = async () => {
    setIsSubmittingStep(true);
    setVerificationResult(null);
    
    try {
      const response = await customFetch(`${BACKEND_URL}/api/verify-proof-steps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_steps: currentSteps,
          hint_index: currentHintIndex,
          hint_expected: hints[currentHintIndex].expected,
          hint_text: hints[currentHintIndex].hint,
          question: question
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      // Update score counters based on verification result
      if (data.is_correct) {
        setCorrectAnswers(prev => prev + 1);
      } else {
        setWrongAnswers(prev => prev + 1);
      }
      
      // Add to completed sections and clear verification result to avoid duplicate feedback
      const completedSection = {
        hintIndex: currentHintIndex,
        hint: hints[currentHintIndex].hint,
        steps: [...currentSteps],
        isCorrect: data.is_correct,
        feedback: data.feedback
      };
      setCompletedSections([...completedSections, completedSection]);
      
      // Move to next hint if correct and not the last one
      if (data.is_correct && currentHintIndex < hints.length - 1) {
        setCurrentHintIndex(currentHintIndex + 1);
        setCurrentSteps([""]);
      }
      
      // Clear verification result to avoid duplicate feedback with completed section
      setVerificationResult(null);
    } catch (error) {
      console.error("Error submitting steps:", error);
    } finally {
      setIsSubmittingStep(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Proof</CardTitle>
        <CardDescription>Enter a statement to prove and work through it step-by-step</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <form onSubmit={handleAnalyze} className="space-y-4">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter the statement you want to prove"
              className="min-h-[100px]"
              disabled={isLoading}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Analyzing..." : "Start Proof"}
            </Button>
          </form>

          {hasSubmitted && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-900">Your Proof Problem:</h4>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-blue-800">Statement to Prove:</span>
                    <div className="whitespace-pre-wrap text-blue-700 ml-2">{question}</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                {(correctAnswers > 0 || wrongAnswers > 0) && (
                  <div className="flex gap-4 p-3 bg-white rounded-lg mb-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <span className="text-lg">✓</span>
                      <span className="font-medium">Correct: {correctAnswers}</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-600">
                      <span className="text-lg">✗</span>
                      <span className="font-medium">Wrong: {wrongAnswers}</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Work through the proof steps:</h4>
                  <div className="text-sm text-gray-600">
                    Step {currentHintIndex + 1} of {hints.length}
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Completed Sections */}
                  {completedSections.map((section, sectionIndex) => (
                    <div key={`completed-${section.hintIndex}`} className={`border-2 rounded-lg p-4 ${
                      section.isCorrect 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-orange-200 bg-orange-50'
                    }`}>
                      <div className="grid grid-cols-12 gap-4">
                        {/* Completed Steps Column */}
                        <div className="col-span-8">
                          <h5 className={`text-sm font-medium mb-3 ${
                            section.isCorrect 
                              ? 'text-green-800' 
                              : 'text-orange-800'
                          }`}>
                            {section.isCorrect ? '✅' : '⚠️'} {section.isCorrect ? 'Completed' : 'Attempted'} - Step {section.hintIndex + 1}
                          </h5>
                          <div className="space-y-3">
                            {section.steps.map((step, stepIndex) => (
                              <div key={stepIndex} className="flex items-start gap-2">
                                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mt-1 ${
                                  section.isCorrect 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {stepIndex + 1}
                                </span>
                                <div className="flex-1 bg-white p-3 rounded border text-sm">
                                  {step}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Retry Button for Incorrect Sections */}
                          {!section.isCorrect && (
                            <div className="mt-4 pt-4 border-t border-orange-200">
                              <Button 
                                onClick={() => handleRetryStep(sectionIndex)}
                                variant="outline"
                                className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                              >
                                🔄 Retry This Step
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Completed Hint Column */}
                        <div className="col-span-4">
                          <div className={`border-l-4 p-3 rounded-r-lg ${
                            section.isCorrect 
                              ? 'bg-green-100 border-green-400' 
                              : 'bg-orange-100 border-orange-400'
                          }`}>
                            <div className={`text-sm font-medium mb-1 ${
                              section.isCorrect 
                                ? 'text-green-800' 
                                : 'text-orange-800'
                            }`}>
                              💡 Hint {section.hintIndex + 1}
                            </div>
                            <div className={`text-sm mb-2 ${
                              section.isCorrect 
                                ? 'text-green-700' 
                                : 'text-orange-700'
                            }`}>
                              {section.hint}
                            </div>
                            {section.feedback && (
                              <div className={`text-xs p-2 rounded ${
                                section.isCorrect 
                                  ? 'bg-green-50 text-green-600' 
                                  : 'bg-orange-50 text-orange-600'
                              }`}>
                                <strong>Feedback:</strong> {section.feedback}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Current Working Section */}
                  {currentHintIndex < hints.length && (
                    <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                      <div className="grid grid-cols-12 gap-4">
                        {/* Current Steps Column */}
                        <div className="col-span-8">
                          <h5 className="text-sm font-medium text-blue-800 mb-3">
                            🔄 Working on Step {currentHintIndex + 1}
                          </h5>
                          <div className="space-y-3">
                            {currentSteps.map((step, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium mt-1">
                                  {index + 1}
                                </span>
                                <div className="flex-1 space-y-3">
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                                      Your Proof Work:
                                    </label>
                                    <Textarea
                                      value={step}
                                      onChange={(e) => updateStep(index, e.target.value)}
                                      placeholder={`Enter step ${index + 1} of your proof...`}
                                      className="min-h-[80px] resize-none"
                                    />
                                  </div>
                                  {index === currentSteps.length - 1 && (
                                    <div className="flex justify-end">
                                      <button
                                        onClick={addStep}
                                        className="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-600 rounded-xl flex items-center justify-center text-lg font-bold transition-colors"
                                        title="Add new step"
                                      >
                                        +
                                      </button>
                                    </div>
                                  )}
                                </div>
                                {currentSteps.length > 1 && (
                                  <button
                                    onClick={() => removeStep(index)}
                                    className="flex-shrink-0 w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full flex items-center justify-center mt-1"
                                    title="Remove step"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {/* Submit Button for Current Hint */}
                          <div className="mt-4 pt-4 border-t border-blue-200">
                            <Button 
                              onClick={handleSubmitSteps} 
                              disabled={isSubmittingStep || currentSteps.some(step => !step.trim())}
                              className="w-full"
                            >
                              {isSubmittingStep ? "Checking..." : "Submit Steps"}
                            </Button>
                          </div>

                          {/* Verification Results */}
                          {verificationResult && (
                            <div className={`mt-4 p-4 rounded-lg border-2 ${
                              verificationResult.isCorrect 
                                ? 'border-green-300 bg-green-50' 
                                : 'border-orange-300 bg-orange-50'
                            }`}>
                              <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                                  verificationResult.isCorrect 
                                    ? 'bg-green-100 text-green-600' 
                                    : 'bg-orange-100 text-orange-600'
                                }`}>
                                  {verificationResult.isCorrect ? '✓' : '!'}
                                </div>
                                <div className="flex-1">
                                  <h5 className={`font-medium mb-2 ${
                                    verificationResult.isCorrect 
                                      ? 'text-green-800' 
                                      : 'text-orange-800'
                                  }`}>
                                    {verificationResult.isCorrect ? 'Well done!' : 'Keep working on it!'}
                                  </h5>
                                  <div className={`text-sm mb-3 ${
                                    verificationResult.isCorrect 
                                      ? 'text-green-700' 
                                      : 'text-orange-700'
                                  }`}>
                                    {verificationResult.feedback}
                                  </div>
                                  {verificationResult.suggestion && (
                                    <div className={`text-sm p-3 rounded-md ${
                                      verificationResult.isCorrect 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-orange-100 text-orange-800'
                                    }`}>
                                      <strong>Suggestion:</strong> {verificationResult.suggestion}
                                    </div>
                                  )}
                                  {verificationResult.isCorrect && currentHintIndex < hints.length - 1 && (
                                    <div className="text-sm text-green-600 mt-2 font-medium">
                                      🎉 Moving to the next step!
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Current Hint Column */}
                        <div className="col-span-4">
                          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-sm relative">
                            {/* Arrow pointing to the left */}
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2">
                              <div className="w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-yellow-400"></div>
                            </div>
                            <div className="text-sm text-yellow-800 font-medium mb-2">
                              💡 Current Hint ({currentHintIndex + 1}/{hints.length})
                            </div>
                            <div className="text-sm text-yellow-700">
                              {hints[currentHintIndex].hint}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Completion Message */}
                  {currentHintIndex >= hints.length && completedSections.length > 0 && completedSections.every(section => section.isCorrect) && (
                    <div className="border-2 border-green-300 rounded-lg p-6 bg-gradient-to-r from-green-50 to-green-100">
                      <div className="text-center">
                        <div className="text-4xl mb-3">🎉</div>
                        <h5 className="text-xl font-bold text-green-800 mb-2">
                          Congratulations!
                        </h5>
                        <p className="text-green-700 mb-4">
                          You've successfully worked through all the steps of this proof!
                        </p>
                        <div className="bg-white p-4 rounded-lg border border-green-200">
                          <h6 className="font-medium text-green-800 mb-2">Complete Proof:</h6>
                          <div className="text-sm text-green-700 whitespace-pre-wrap text-left">
                            {resultText}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

