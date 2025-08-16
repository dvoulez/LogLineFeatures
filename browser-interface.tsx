"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { apiClient, type Run, type Contract } from "@/lib/api-client"

export function BrowserInterface() {
  const [isConnected, setIsConnected] = useState(false)
  const [currentRun, setCurrentRun] = useState<Run | null>(null)
  const [contractDialog, setContractDialog] = useState<{ open: boolean; contract?: Contract }>({ open: false })
  const [executionProgress, setExecutionProgress] = useState(0)

  // Form states
  const [navigationUrl, setNavigationUrl] = useState("https://example.com")
  const [selectorType, setSelectorType] = useState<"css" | "xpath" | "text" | "id" | "class">("css")
  const [selectorValue, setSelectorValue] = useState("")
  const [typeText, setTypeText] = useState("")

  const checkConnection = async () => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_RUNTIME_URL || "http://localhost:4123/health")
      setIsConnected(response.ok)
    } catch {
      setIsConnected(false)
    }
  }

  useEffect(() => {
    checkConnection()
    const interval = setInterval(checkConnection, 5000)
    return () => clearInterval(interval)
  }, [])

  const executeWithContract = async (plan: Array<{ tool: string; args: Record<string, any> }>) => {
    try {
      // Preview contract
      const { contract } = await apiClient.previewContract(plan, "medium", 0.05, 30)
      setContractDialog({ open: true, contract })
    } catch (error) {
      console.error("Contract preview failed:", error)
    }
  }

  const approveAndExecute = async () => {
    if (!contractDialog.contract) return

    try {
      // Approve contract
      await apiClient.approveContract(contractDialog.contract.id, true)

      // Create and execute run
      const plan = [{ tool: "web.navigate", args: { url: navigationUrl } }]
      const run = await apiClient.createRun(plan, "execute")
      setCurrentRun(run)

      // Poll for completion
      pollRunStatus(run.id)

      setContractDialog({ open: false })
    } catch (error) {
      console.error("Execution failed:", error)
    }
  }

  const pollRunStatus = async (runId: string) => {
    const poll = async () => {
      try {
        const run = await apiClient.getRun(runId)
        setCurrentRun(run)

        if (run.status === "running") {
          setExecutionProgress((prev) => Math.min(prev + 10, 90))
          setTimeout(poll, 1000)
        } else if (run.status === "completed") {
          setExecutionProgress(100)
        }
      } catch (error) {
        console.error("Polling failed:", error)
      }
    }
    poll()
  }

  const navigateToUrl = async () => {
    if (!navigationUrl) return
    const plan = [{ tool: "web.navigate", args: { url: navigationUrl } }]
    await executeWithContract(plan)
  }

  const readElement = async () => {
    if (!selectorValue) return
    const plan = [{ tool: "web.read", args: { selector: { type: selectorType, value: selectorValue } } }]
    await executeWithContract(plan)
  }

  const readPageContent = async () => {
    const plan = [{ tool: "web.read", args: { type: "full_page" } }]
    await executeWithContract(plan)
  }

  const clickElement = async () => {
    if (!selectorValue) return
    const plan = [{ tool: "web.click", args: { selector: { type: selectorType, value: selectorValue } } }]
    await executeWithContract(plan)
  }

  const typeIntoElement = async () => {
    if (!selectorValue || !typeText) return
    const plan = [
      { tool: "web.type", args: { selector: { type: selectorType, value: selectorValue }, text: typeText } },
    ]
    await executeWithContract(plan)
  }

  const takeScreenshot = async (fullPage = false) => {
    const plan = [{ tool: "web.screenshot", args: { full_page: fullPage } }]
    await executeWithContract(plan)
  }

  const downloadBundle = async () => {
    if (!currentRun) return
    try {
      const blob = await apiClient.getRunBundle(currentRun.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `run-${currentRun.id}-bundle.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Bundle download failed:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Browser Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            LogLineBrowser Runtime
            <Badge variant={isConnected ? "default" : "secondary"}>{isConnected ? "Connected" : "Disconnected"}</Badge>
          </CardTitle>
          <CardDescription>Browser automation with contract-based execution</CardDescription>
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

      {/* Browser Operations */}
      <Tabs defaultValue="navigation" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
          <TabsTrigger value="reading">Reading</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="capture">Capture</TabsTrigger>
        </TabsList>

        <TabsContent value="navigation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Page Navigation</CardTitle>
              <CardDescription>Navigate to web pages with contract approval</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter URL (e.g., https://example.com)"
                  value={navigationUrl}
                  onChange={(e) => setNavigationUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={navigateToUrl} disabled={!isConnected}>
                  Navigate
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reading" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Reading</CardTitle>
              <CardDescription>Extract content from page elements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="selector-type">Selector Type</Label>
                  <Select value={selectorType} onValueChange={(value: typeof selectorType) => setSelectorType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="css">CSS Selector</SelectItem>
                      <SelectItem value="xpath">XPath</SelectItem>
                      <SelectItem value="text">Text Content</SelectItem>
                      <SelectItem value="id">ID</SelectItem>
                      <SelectItem value="class">Class</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="selector-value">Selector Value</Label>
                  <Input
                    id="selector-value"
                    placeholder="e.g., .button, #header, //div[@class='content']"
                    value={selectorValue}
                    onChange={(e) => setSelectorValue(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={readElement} disabled={!isConnected || !selectorValue}>
                  Read Element
                </Button>
                <Button onClick={readPageContent} disabled={!isConnected}>
                  Read Full Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GUI Automation</CardTitle>
              <CardDescription>Interact with page elements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="auto-selector-type">Selector Type</Label>
                  <Select value={selectorType} onValueChange={(value: typeof selectorType) => setSelectorType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="css">CSS Selector</SelectItem>
                      <SelectItem value="xpath">XPath</SelectItem>
                      <SelectItem value="text">Text Content</SelectItem>
                      <SelectItem value="id">ID</SelectItem>
                      <SelectItem value="class">Class</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="auto-selector-value">Selector Value</Label>
                  <Input
                    id="auto-selector-value"
                    placeholder="e.g., .button, #submit, //input[@type='text']"
                    value={selectorValue}
                    onChange={(e) => setSelectorValue(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="type-text">Text to Type</Label>
                <Textarea
                  id="type-text"
                  placeholder="Enter text to type into the element"
                  value={typeText}
                  onChange={(e) => setTypeText(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={clickElement} disabled={!isConnected || !selectorValue}>
                  Click Element
                </Button>
                <Button onClick={typeIntoElement} disabled={!isConnected || !selectorValue || !typeText}>
                  Type Text
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Page Capture</CardTitle>
              <CardDescription>Take screenshots and capture page state</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={() => takeScreenshot(false)} disabled={!isConnected}>
                  Screenshot Viewport
                </Button>
                <Button onClick={() => takeScreenshot(true)} disabled={!isConnected}>
                  Screenshot Full Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {currentRun && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Execution Status
              <Badge variant={currentRun.status === "completed" ? "default" : "secondary"}>{currentRun.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentRun.status === "running" && (
              <div>
                <Label>Progress</Label>
                <Progress value={executionProgress} className="mt-2" />
              </div>
            )}

            {currentRun.status === "completed" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Raw Output</Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg text-sm font-mono max-h-32 overflow-y-auto">
                    {JSON.stringify(currentRun.spans[0]?.out || {}, null, 2)}
                  </div>
                </div>
                <div>
                  <Label>Contracted Output</Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg text-sm font-mono max-h-32 overflow-y-auto">
                    {JSON.stringify(currentRun.spans[0]?.out || {}, null, 2).replace(
                      /\b\d{3}-\d{2}-\d{4}\b/g,
                      "***-**-****",
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button onClick={downloadBundle} disabled={currentRun.status !== "completed"}>
              Download Bundle
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={contractDialog.open} onOpenChange={(open) => setContractDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Minicontract Approval Required</DialogTitle>
            <DialogDescription>Review the contract details before proceeding with execution.</DialogDescription>
          </DialogHeader>

          {contractDialog.contract && (
            <div className="space-y-4">
              <div>
                <Label>Scope</Label>
                <ul className="mt-1 text-sm list-disc list-inside">
                  {contractDialog.contract.details.scope.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Risk Level</Label>
                  <Badge variant={contractDialog.contract.details.risk_level === "high" ? "destructive" : "secondary"}>
                    {contractDialog.contract.details.risk_level}
                  </Badge>
                </div>
                <div>
                  <Label>Estimated Cost</Label>
                  <p className="text-sm">€{contractDialog.contract.details.estimated_cost}</p>
                </div>
              </div>

              <div>
                <Label>Benefits</Label>
                <p className="text-sm">{contractDialog.contract.details.benefits}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setContractDialog({ open: false })}>
              Cancel
            </Button>
            <Button onClick={approveAndExecute}>Approve & Execute</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
