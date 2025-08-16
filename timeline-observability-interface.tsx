"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { apiClient, type Run } from "@/lib/api-client"

interface TimelineEvent {
  id: string
  type: string
  message: string
  timestamp: string
  severity: "info" | "warning" | "error" | "critical"
  source: string
  spanId?: string
  runId?: string
  metadata: Record<string, any>
}

export function TimelineObservabilityInterface() {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [runs, setRuns] = useState<Run[]>([])
  const [selectedRun, setSelectedRun] = useState<Run | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Filter states
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [timeRangeFilter, setTimeRangeFilter] = useState<string>("1h")

  const checkConnection = async () => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_RUNTIME_URL || "http://localhost:4123/health")
      setIsConnected(response.ok)
    } catch {
      setIsConnected(false)
    }
  }

  const refreshData = async () => {
    if (!isConnected) return

    try {
      const filters = {
        type: typeFilter !== "all" ? typeFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        limit: 200,
      }

      const timelineData = await apiClient.getTimeline(filters)
      setEvents(timelineData.events || [])
      setRuns(timelineData.runs || [])
    } catch (error) {
      console.error("Failed to fetch timeline data:", error)
    }
  }

  useEffect(() => {
    checkConnection()
    const interval = setInterval(checkConnection, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 5000)
    return () => clearInterval(interval)
  }, [isConnected, typeFilter, statusFilter, timeRangeFilter])

  const selectRun = async (runId: string) => {
    try {
      const run = await apiClient.getRun(runId)
      setSelectedRun(run)
    } catch (error) {
      console.error("Failed to fetch run details:", error)
    }
  }

  const downloadBundle = async (runId: string) => {
    try {
      const blob = await apiClient.getRunBundle(runId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `run-${runId}-bundle.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Bundle download failed:", error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "info":
        return "bg-blue-500"
      case "warning":
        return "bg-yellow-500"
      case "error":
        return "bg-orange-500"
      case "critical":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "running":
        return "secondary"
      case "failed":
        return "destructive"
      case "waiting_approval":
        return "outline"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Timeline & Observability
            <Badge variant={isConnected ? "default" : "secondary"}>{isConnected ? "Connected" : "Disconnected"}</Badge>
          </CardTitle>
          <CardDescription>Real-time system timeline and observability data</CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Runtime not connected. Make sure the LogLineBrowser runtime is running on port 4123.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="exec">Exec</SelectItem>
                  <SelectItem value="ui">UI</SelectItem>
                  <SelectItem value="approval">Approval</SelectItem>
                  <SelectItem value="observe">Observe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="waiting_approval">Waiting Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Time Range</Label>
              <Select value={timeRangeFilter} onValueChange={setTimeRangeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15m">Last 15 minutes</SelectItem>
                  <SelectItem value="1h">Last hour</SelectItem>
                  <SelectItem value="6h">Last 6 hours</SelectItem>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={refreshData} className="w-full" disabled={!isConnected}>
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Timeline Events</TabsTrigger>
          <TabsTrigger value="runs">Runs</TabsTrigger>
          <TabsTrigger value="spans">Span Tree</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timeline Events</CardTitle>
              <CardDescription>Chronological view of system events and activities</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {events.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {isConnected ? "No events found for the selected filters" : "Connect to runtime to view events"}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {events.map((event) => (
                      <Card key={event.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <Badge className={getSeverityColor(event.severity)}>{event.severity}</Badge>
                                <Badge variant="outline">{event.type}</Badge>
                                <Badge variant="secondary">{event.source}</Badge>
                              </div>
                              <p className="font-medium">{event.message}</p>
                              <div className="text-sm text-muted-foreground">
                                <p>Time: {new Date(event.timestamp).toLocaleString()}</p>
                                {event.spanId && <p>Span: {event.spanId}</p>}
                                {event.runId && <p>Run: {event.runId}</p>}
                              </div>
                            </div>
                          </div>
                          {Object.keys(event.metadata).length > 0 && (
                            <div className="mt-2 p-2 bg-muted rounded text-xs">
                              <strong>Metadata:</strong> {JSON.stringify(event.metadata, null, 2)}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="runs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution Runs</CardTitle>
              <CardDescription>List of execution runs and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {runs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {isConnected ? "No runs found" : "Connect to runtime to view runs"}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {runs.map((run) => (
                      <Card key={run.id} className="cursor-pointer hover:bg-muted/50" onClick={() => selectRun(run.id)}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={getStatusColor(run.status)}>{run.status}</Badge>
                                <Badge variant="outline">{run.mode}</Badge>
                                <span className="font-medium">Run {run.id.slice(0, 8)}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Created: {new Date(run.created).toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Spans: {run.spans.length} | Contract: {run.contract_id || "None"}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {run.status === "completed" && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    downloadBundle(run.id)
                                  }}
                                >
                                  Bundle
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Span Tree</CardTitle>
              <CardDescription>
                {selectedRun ? `Spans for run ${selectedRun.id.slice(0, 8)}` : "Select a run to view its spans"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {!selectedRun ? (
                  <p className="text-muted-foreground text-center py-8">
                    Select a run from the Runs tab to view its spans
                  </p>
                ) : selectedRun.spans.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No spans found for this run</p>
                ) : (
                  <div className="space-y-2">
                    {selectedRun.spans.map((span) => (
                      <Card key={span.id}>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={getStatusColor(span.status)}>{span.status}</Badge>
                              <Badge variant="outline">{span.type}</Badge>
                              <Badge variant="secondary">{span.tool}</Badge>
                              <span className="font-medium">Span {span.id.slice(0, 8)}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>Created: {new Date(span.meta.timestamps.created).toLocaleString()}</p>
                              <p>
                                Origin: {span.meta.origin} | PII: {span.meta.pii ? "Yes" : "No"} | Cost: €
                                {span.meta.cost}
                              </p>
                              {span.meta.parent_id && <p>Parent: {span.meta.parent_id.slice(0, 8)}</p>}
                            </div>
                            {span.args && Object.keys(span.args).length > 0 && (
                              <div className="mt-2 p-2 bg-muted rounded text-xs">
                                <strong>Args:</strong> {JSON.stringify(span.args, null, 2)}
                              </div>
                            )}
                            {span.out && (
                              <div className="mt-2 p-2 bg-muted rounded text-xs">
                                <strong>Output:</strong> {JSON.stringify(span.out, null, 2)}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
