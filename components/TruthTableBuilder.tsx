"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type NullableTruth = "T" | "F" | "";

type CustomColumn = {
  id: string
  name: string
  values: NullableTruth[]
}

function generateAssignments(variableCount: number): boolean[][] {
  if (variableCount <= 0) return []
  const total = 1 << variableCount
  const rows: boolean[][] = []
  // Generate with the first row all True, then lexicographically decrease
  for (let i = total - 1; i >= 0; i--) {
    const row: boolean[] = []
    for (let bit = variableCount - 1; bit >= 0; bit--) {
      row.push(((i >> bit) & 1) === 1)
    }
    rows.push(row)
  }
  return rows
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

export default function TruthTableBuilder({ initialVariables = [] as string[] }: { initialVariables?: string[] }) {
  const [variables, setVariables] = useState<string[]>(initialVariables)
  const [variablesText, setVariablesText] = useState<string>(initialVariables.join(", "))
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([])
  const [newColumnName, setNewColumnName] = useState<string>("")

  const rows = useMemo(() => generateAssignments(variables.length), [variables.length])

  // Whenever variables change, resize every custom column to match row count
  useEffect(() => {
    setCustomColumns(cols => cols.map(col => ({
      ...col,
      values: Array.from({ length: rows.length }, (_, i) => col.values[i] ?? "")
    })))
  }, [rows.length])

  useEffect(() => {
    // Keep variables text in sync if initial variables are provided later
    if (initialVariables.length > 0) {
      setVariablesText(initialVariables.join(", "))
      setVariables(initialVariables)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialVariables.join("|")])

  const applyVariablesText = () => {
    const parsed = uniq(
      variablesText
        .split(/[^A-Za-z0-9_]+/)
        .map(v => v.trim())
        .filter(v => v.length > 0)
    )
    setVariables(parsed)
  }

  const addCustomColumn = () => {
    const name = newColumnName.trim()
    if (!name) return
    const id = `${name}-${Date.now()}`
    setCustomColumns(prev => [...prev, { id, name, values: Array.from({ length: rows.length }, () => "") }])
    setNewColumnName("")
  }

  const removeCustomColumn = (id: string) => {
    setCustomColumns(prev => prev.filter(c => c.id !== id))
  }

  const cycleValue = (current: NullableTruth): NullableTruth => {
    if (current === "") return "T"
    if (current === "T") return "F"
    return ""
  }

  const toggleCell = (columnId: string, rowIndex: number) => {
    setCustomColumns(prev => prev.map(col => {
      if (col.id !== columnId) return col
      const next = [...col.values]
      next[rowIndex] = cycleValue(next[rowIndex])
      return { ...col, values: next }
    }))
  }

  const clearAllCustomValues = () => {
    setCustomColumns(prev => prev.map(c => ({ ...c, values: c.values.map(() => "") })))
  }

  const copyAsMarkdown = async () => {
    const header = `| ${variables.join(" | ")} ${customColumns.length ? " | " + customColumns.map(c => c.name).join(" | ") : ""} |\n| ${[...variables, ...customColumns.map(() => "-")].map(() => "---").join(" | ")} |`
    const body = rows.map((row, rIdx) => {
      const vars = row.map(v => (v ? "T" : "F")).join(" | ")
      const cols = customColumns.map(c => (c.values[rIdx] || "")).join(" | ")
      return `| ${vars}${customColumns.length ? " | " + cols : ""} |`
    }).join("\n")
    const md = `${header}\n${body}`
    try {
      await navigator.clipboard.writeText(md)
      // no-op UI toast available; keep silent
    } catch (_) {}
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Truth Table Builder</CardTitle>
        <CardDescription>
          Define variables, auto-generate rows, and fill additional columns manually to complete your table.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium">Variables (comma or space separated)</label>
            <div className="flex gap-2">
              <Input
                value={variablesText}
                onChange={(e) => setVariablesText(e.target.value)}
                placeholder="e.g., p, q, r"
              />
              <Button type="button" onClick={applyVariablesText}>Set</Button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Add custom column</label>
            <div className="flex gap-2">
              <Input
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Column name"
              />
              <Button type="button" onClick={addCustomColumn}>Add</Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={clearAllCustomValues} disabled={customColumns.length === 0}>Clear custom values</Button>
          <Button type="button" variant="outline" onClick={copyAsMarkdown}>Copy as Markdown</Button>
        </div>

        <div className="overflow-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {variables.map(v => (
                  <th key={v} className="px-3 py-2 text-left font-medium text-gray-700 border-b">{v}</th>
                ))}
                {customColumns.map(col => (
                  <th key={col.id} className="px-3 py-2 text-left font-medium text-gray-700 border-b">
                    <div className="flex items-center gap-2">
                      <span>{col.name}</span>
                      <button
                        onClick={() => removeCustomColumn(col.id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                        title="Remove column"
                      >×</button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-gray-500" colSpan={Math.max(1, variables.length + customColumns.length)}>
                    Add at least one variable to generate rows.
                  </td>
                </tr>
              ) : rows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  {row.map((val, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 border-t align-middle">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-semibold ${val ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {val ? "T" : "F"}
                      </span>
                    </td>
                  ))}
                  {customColumns.map(col => (
                    <td key={col.id} className="px-3 py-2 border-t align-middle">
                      <button
                        onClick={() => toggleCell(col.id, rIdx)}
                        className={`inline-flex items-center justify-center w-10 h-8 rounded border transition-colors ${
                          col.values[rIdx] === "T" ? "bg-green-100 border-green-300 text-green-700" :
                          col.values[rIdx] === "F" ? "bg-red-100 border-red-300 text-red-700" :
                          "bg-white border-gray-300 text-gray-500"
                        }`}
                        title="Click to cycle: blank → T → F → blank"
                      >
                        {col.values[rIdx] || ""}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-500">
          Tip: Use the custom columns to record intermediate formulas or the final expression. Click each cell to cycle its value.
        </p>
      </CardContent>
    </Card>
  )
}

