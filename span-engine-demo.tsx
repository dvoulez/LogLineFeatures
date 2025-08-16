"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { spanEngine, SpanType, SpanStatus, type SpanContext, type SpanDiff } from "@/lib/span-engine"

export function SpanEngineDemo() {
  const [spans, setSpans] = useState<SpanContext[]>([])
  const [timeline, setTimeline] = useState<Array<{ spanId: string; timestamp: number; event: string }>>([])
  const [selectedSpan, setSelectedSpan] = useState<string | null>(null)
  const [simulationResult, setSimulationResult] = useState<SpanDiff | null>(null)

  const refreshData = () => {
    setSpans(spanEngine.getAllSpans())
    setTimeline(spanEngine.getTimeline())
  }

  useEffect(() => {
    refreshData()
  }, [])

  const createDemoSpan = async (type: SpanType, description: string) => {
    const operation = {
      id: `op_${Date.now()}`,
      description,
      operation: async () => {
        // Simulate some work
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return { success: true, data: `Result for ${description}` }
      },
      rollback: async () => {
        await new Promise((resolve) => setTimeout(resolve, 500))
        console.log(`Rolled back: ${description}`)
      },
      simulate: async () => {
        await new Promise((resolve) => setTimeout(resolve, 500))
        return {
          changes: [
            {
              type: "update" as const,
              target: "demo_target",
              before: "original_value",
              after: "new_value",
            },
          ],
          impact: "low" as const,
          reversible: true,
        }
      },
    }

    const spanId = await spanEngine.createSpan(type, operation)
    refreshData()
    return spanId
  }

  const simulateSpan = async (spanId: string) => {
    try {
      const diff = await spanEngine.simulateSpan(spanId)
      setSimulationResult(diff)
      refreshData()
    } catch (error) {
      console.error("Simulation failed:", error)
      refreshData()
    }
  }

  const executeSpan = async (spanId: string) => {
    try {
      await spanEngine.executeSpan(spanId)
      refreshData()
    } catch (error) {
      console.error("Execution failed:", error)
      refreshData()
    }
  }

  const rollbackSpan = async (spanId: string) => {
    try {
      await spanEngine.rollbackSpan(spanId)
      refreshData()
    } catch (error) {
      console.error("Rollback failed:", error)
      refreshData()
    }
  }

  const getStatusColor = (status: SpanStatus) => {
    switch (status) {
      case SpanStatus.PENDING:
        return "bg-gray-500"
      case SpanStatus.SIMULATING:
        return "bg-blue-500"
      case SpanStatus.AWAITING_APPROVAL:
        return "bg-yellow-500"
      case SpanStatus.EXECUTING:
        return "bg-orange-500"
      case SpanStatus.COMPLETED:
        return "bg-green-500"
      case SpanStatus.FAILED:
        return "bg-red-500"
      case SpanStatus.ROLLED_BACK:
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Span Engine Controls</CardTitle>
          <CardDescription>Create and manage spans with the reversible execution model</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => createDemoSpan(SpanType.NAVIGATION, "Navigate to page")}>
              Create Navigation Span
            </Button>
            <Button onClick={() => createDemoSpan(SpanType.READ, "Read data from source")}>Create Read Span</Button>
            <Button onClick={() => createDemoSpan(SpanType.WRITE, "Write data to target")}>Create Write Span</Button>
            <Button onClick={() => createDemoSpan(SpanType.GUI_AUTOMATION, "Click button")}>Create GUI Span</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="spans" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="spans">Active Spans</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="simulation">Simulation</TabsTrigger>
        </TabsList>

        <TabsContent value="spans" className="space-y-4">
          <ScrollArea className="h-96">
            {spans.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No spans created yet</p>
            ) : (
              <div className="space-y-2">
                {spans.map((span) => (
                  <Card
                    key={span.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedSpan(span.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(span.status)}>{span.status}</Badge>
                            <Badge variant="outline">{span.type}</Badge>
                            {span.reversible && <Badge variant="secondary">Reversible</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">ID: {span.id}</p>
                        </div>
                        <div className="flex gap-2">
                          {span.status === SpanStatus.PENDING && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                simulateSpan(span.id)
                              }}
                            >
                              Simulate
                            </Button>
                          )}
                          {span.status === SpanStatus.AWAITING_APPROVAL && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                executeSpan(span.id)
                              }}
                            >
                              Execute
                            </Button>
                          )}
                          {span.status === SpanStatus.COMPLETED && span.reversible && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                rollbackSpan(span.id)
                              }}
                            >
                              Rollback
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <ScrollArea className="h-96">
            {timeline.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No timeline events yet</p>
            ) : (
              <div className="space-y-2">
                {timeline.map((event, index) => (
                  <Card key={index}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{event.event.replace(/_/g, " ").toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">Span: {event.spanId}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="simulation" className="space-y-4">
          {simulationResult ? (
            <Card>
              <CardHeader>
                <CardTitle>Simulation Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        simulationResult.impact === "high"
                          ? "destructive"
                          : simulationResult.impact === "medium"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {simulationResult.impact.toUpperCase()} IMPACT
                    </Badge>
                    {simulationResult.reversible && <Badge variant="outline">REVERSIBLE</Badge>}
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Changes:</h4>
                    {simulationResult.changes.map((change, index) => (
                      <div key={index} className="bg-muted p-3 rounded-md">
                        <p>
                          <strong>Type:</strong> {change.type}
                        </p>
                        <p>
                          <strong>Target:</strong> {change.target}
                        </p>
                        {change.before && (
                          <p>
                            <strong>Before:</strong> {change.before}
                          </p>
                        )}
                        {change.after && (
                          <p>
                            <strong>After:</strong> {change.after}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground text-center py-8">No simulation results yet</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
