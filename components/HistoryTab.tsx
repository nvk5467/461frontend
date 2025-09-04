"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { customFetch } from "@/lib/utils"

interface HistoryItem {
  sessionId: string
  timestamp: string
  interactionType: string
  question?: string
  stepNumber?: number
  isCorrect?: boolean
  userAnswer?: string
  explanation?: string
  hint?: string
  problemType?: string
  retrievedChunks?: string[]
}

interface HistoryTabProps {
  studentId: string
}

export default function HistoryTab({ studentId }: HistoryTabProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"timestamp" | "interactionType" | "isCorrect">("timestamp")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterType, setFilterType] = useState<string>("all")

  useEffect(() => {
    if (studentId) {
      fetchHistory()
    }
  }, [studentId])

  useEffect(() => {
    filterAndSortHistory()
  }, [history, searchTerm, sortBy, sortOrder, filterType])

  const fetchHistory = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      const response = await customFetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/student/history?student_id=${studentId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      const data = await response.json()
      
      if (data.success) {
        console.log("History data received:", data.history) // Debug log
        setHistory(data.history || [])
      } else {
        setError(data.error || "Failed to fetch history")
      }
    } catch (error) {
      console.error("Error fetching history:", error)
      setError("Failed to fetch history")
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortHistory = () => {
    let filtered = [...history]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => 
        (item.question && typeof item.question === 'string' && item.question.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.interactionType && typeof item.interactionType === 'string' && item.interactionType.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.sessionId && typeof item.sessionId === 'string' && item.sessionId.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by interaction type
    if (filterType !== "all") {
      filtered = filtered.filter(item => item.interactionType && item.interactionType === filterType)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case "timestamp":
          try {
            aValue = a.timestamp ? new Date(a.timestamp).getTime() : 0
            bValue = b.timestamp ? new Date(b.timestamp).getTime() : 0
          } catch (error) {
            aValue = 0
            bValue = 0
          }
          break
        case "interactionType":
          aValue = a.interactionType || ""
          bValue = b.interactionType || ""
          break
        case "isCorrect":
          aValue = a.isCorrect === true ? 1 : a.isCorrect === false ? 0 : -1
          bValue = b.isCorrect === true ? 1 : b.isCorrect === false ? 0 : -1
          break
        default:
          try {
            aValue = a.timestamp ? new Date(a.timestamp).getTime() : 0
            bValue = b.timestamp ? new Date(b.timestamp).getTime() : 0
          } catch (error) {
            aValue = 0
            bValue = 0
          }
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredHistory(filtered)
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "Unknown time"
    try {
      return new Date(timestamp).toLocaleString()
    } catch (error) {
      console.error("Error formatting timestamp:", timestamp, error)
      return "Invalid time"
    }
  }

  const getInteractionIcon = (type: any) => {
    if (!type || typeof type !== 'string') return "📊"
    
    switch (type) {
      case "question_submitted":
        return "❓"
      case "step_answered":
        return "✅"
      case "hint_requested":
        return "💡"
      case "overall_answer_submitted":
        return "📝"
      default:
        return "📊"
    }
  }

  const getCorrectnessIcon = (correct: boolean | undefined) => {
    if (correct === true) return "✅"
    if (correct === false) return "❌"
    return "➖"
  }

  const debugItem = (item: any) => {
    console.log("History item structure:", {
      sessionId: item.sessionId,
      sessionIdType: typeof item.sessionId,
      timestamp: item.timestamp,
      timestampType: typeof item.timestamp,
      interactionType: item.interactionType,
      interactionTypeType: typeof item.interactionType,
      question: item.question,
      questionType: typeof item.question,
      correctness: item.isCorrect,
      correctnessType: typeof item.isCorrect,
      fullItem: item
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading history...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading History</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchHistory}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Learning History</CardTitle>
          <CardDescription>
            View and analyze your past interactions with the tutor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search questions, interactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Types</option>
              <option value="question_submitted">Questions Submitted</option>
              <option value="step_answered">Step Answers</option>
              <option value="hint_requested">Hint Requests</option>
              <option value="overall_answer_submitted">Overall Answers</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="timestamp">Sort by Time</option>
              <option value="interactionType">Sort by Type</option>
              <option value="isCorrect">Sort by Correctness</option>
            </select>

            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </Button>

            <Button onClick={fetchHistory} variant="outline">
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{filteredHistory.length}</div>
                <div className="text-sm text-gray-600">Total Interactions</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {filteredHistory.filter(h => h.isCorrect === true).length}
                </div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {filteredHistory.filter(h => h.hint !== undefined).length}
                </div>
                <div className="text-sm text-gray-600">Hints Used</div>
              </CardContent>
            </Card>
                         <Card>
               <CardContent className="p-4">
                 <div className="text-2xl font-bold">
                   {new Set(filteredHistory.filter(h => h.sessionId && typeof h.sessionId === 'string').map(h => h.sessionId)).size}
                 </div>
                 <div className="text-sm text-gray-600">Study Sessions</div>
               </CardContent>
             </Card>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <Card>
        <CardHeader>
          <CardTitle>Interaction Details</CardTitle>
          <CardDescription>
            Showing {filteredHistory.length} of {history.length} interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No interactions found matching your criteria
            </div>
          ) : (
            <div className="space-y-4">
                             {filteredHistory.map((item, index) => {
                 debugItem(item) // Debug each item
                 return (
                   <Card key={`${item.sessionId || 'unknown'}-${item.timestamp || 'unknown'}-${index}`} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                                                 <div className="flex items-center gap-2">
                           <span className="text-xl">{getInteractionIcon(item.interactionType)}</span>
                           <span className="font-medium capitalize">
                             {item.interactionType && typeof item.interactionType === 'string' 
                               ? item.interactionType.replace(/_/g, ' ') 
                               : 'Unknown'}
                           </span>
                           <span className="text-sm text-gray-500">
                             {formatTimestamp(item.timestamp)}
                           </span>
                         </div>
                        
                        {item.question && (
                          <div className="text-sm">
                            <span className="font-medium">Question:</span> {item.question}
                          </div>
                        )}
                        
                        {item.stepNumber !== undefined && (
                          <div className="text-sm">
                            <span className="font-medium">Step:</span> {item.stepNumber}
                          </div>
                        )}
                        
                        {item.isCorrect !== undefined && (
                          <div className="text-sm">
                            <span className="font-medium">Correct:</span> {getCorrectnessIcon(item.isCorrect)}
                          </div>
                        )}
                        
                        {item.userAnswer && (
                          <div className="text-sm">
                            <span className="font-medium">Answer:</span> {item.userAnswer}
                          </div>
                        )}
                        
                        {item.hint && (
                          <div className="text-sm">
                            <span className="font-medium">Hint:</span> {item.hint}
                          </div>
                        )}
                        
                                                 <div className="text-xs text-gray-400">
                           Session: {item.sessionId && typeof item.sessionId === 'string' 
                             ? item.sessionId.slice(-8) 
                             : 'Unknown'}
                                                  </div>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
                   )
                 })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
