"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cliFramework, type CLIResult, type FlowDefinition } from "@/lib/cli-framework"

interface TerminalEntry {
  type: "command" | "output" | "error"
  content: string
  timestamp: number
}

export function CLIInterface() {
  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>([
    {
      type: "output",
      content:
        "LogLineBrowser CLI v1.0.0\nType 'help' for available commands or try:\n  logline flows list\n  logline ops status",
      timestamp: Date.now(),
    },
  ])
  const [currentCommand, setCurrentCommand] = useState("")
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [flows, setFlows] = useState<FlowDefinition[]>([])
  const [isExecuting, setIsExecuting] = useState(false)

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [terminalEntries])

  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const refreshFlows = () => {
    setFlows(cliFramework.getFlows())
  }

  useEffect(() => {
    refreshFlows()
  }, [])

  const addTerminalEntry = (type: TerminalEntry["type"], content: string) => {
    setTerminalEntries((prev) => [
      ...prev,
      {
        type,
        content,
        timestamp: Date.now(),
      },
    ])
  }

  const executeCommand = async (command: string) => {
    if (!command.trim()) return

    setIsExecuting(true)
    addTerminalEntry("command", `$ ${command}`)

    // Add to command history
    setCommandHistory((prev) => [...prev, command])
    setHistoryIndex(-1)

    try {
      let result: CLIResult

      if (command.trim() === "help") {
        result = {
          success: true,
          output: `LogLineBrowser CLI Commands:

Flows (Automation):
  logline flows create <name> [description]    - Create new automation flow
  logline flows list                           - List all flows
  logline flows run <flow-id> [--simulate]     - Execute flow
  logline flows add-step <flow-id> <type> ...  - Add step to flow
  logline flows delete <flow-id>               - Delete flow

Ops (Observability):
  logline ops status                           - Show system status
  logline ops spans [list|show|rollback]       - Manage spans
  logline ops timeline [--limit n]            - Show execution timeline
  logline ops browser [status|connect]        - Manage browser
  logline ops logs                             - View system logs

Examples:
  logline flows create login-test "Login automation"
  logline flows add-step login-test navigate --url https://example.com
  logline flows add-step login-test click --selector "#login-btn"
  logline flows run login-test --simulate
  logline ops status`,
        }
      } else if (command.trim() === "clear") {
        setTerminalEntries([])
        setIsExecuting(false)
        return
      } else {
        result = await cliFramework.executeCommand(command)
      }

      addTerminalEntry(result.success ? "output" : "error", result.output)
      refreshFlows()
    } catch (error) {
      addTerminalEntry("error", `Command failed: ${error}`)
    }

    setIsExecuting(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      executeCommand(currentCommand)
      setCurrentCommand("")
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[newIndex])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1)
          setCurrentCommand("")
        } else {
          setHistoryIndex(newIndex)
          setCurrentCommand(commandHistory[newIndex])
        }
      }
    }
  }

  const runQuickCommand = (command: string) => {
    setCurrentCommand(command)
    executeCommand(command)
    setCurrentCommand("")
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="terminal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="terminal">Terminal</TabsTrigger>
          <TabsTrigger value="flows">Flows</TabsTrigger>
          <TabsTrigger value="quick">Quick Commands</TabsTrigger>
        </TabsList>

        <TabsContent value="terminal">
          <Card>
            <CardHeader>
              <CardTitle>LogLineBrowser CLI</CardTitle>
              <CardDescription>Interactive command-line interface for automation and observability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ScrollArea
                  className="h-96 w-full border rounded-md p-4 bg-black text-green-400 font-mono text-sm"
                  ref={scrollAreaRef}
                >
                  {terminalEntries.map((entry, index) => (
                    <div key={index} className="mb-2">
                      <div
                        className={
                          entry.type === "command"
                            ? "text-yellow-400"
                            : entry.type === "error"
                              ? "text-red-400"
                              : "text-green-400"
                        }
                      >
                        {entry.content.split("\n").map((line, lineIndex) => (
                          <div key={lineIndex}>{line}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {isExecuting && <div className="text-blue-400">Executing...</div>}
                </ScrollArea>

                <div className="flex items-center space-x-2">
                  <span className="text-green-400 font-mono">$</span>
                  <Input
                    ref={inputRef}
                    value={currentCommand}
                    onChange={(e) => setCurrentCommand(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter command (try 'help' or 'logline ops status')"
                    className="font-mono"
                    disabled={isExecuting}
                  />
                  <Button
                    onClick={() => executeCommand(currentCommand)}
                    disabled={isExecuting || !currentCommand.trim()}
                  >
                    Execute
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flows">
          <Card>
            <CardHeader>
              <CardTitle>Automation Flows</CardTitle>
              <CardDescription>Manage and execute automation workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {flows.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No flows created yet. Use 'logline flows create &lt;name&gt;' to create one.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {flows.map((flow) => (
                      <Card key={flow.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{flow.name}</h4>
                              <p className="text-sm text-muted-foreground">{flow.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline">{flow.steps.length} steps</Badge>
                                <Badge variant="secondary">
                                  Created: {new Date(flow.created).toLocaleDateString()}
                                </Badge>
                                {flow.lastRun && <Badge>Last run: {new Date(flow.lastRun).toLocaleDateString()}</Badge>}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => runQuickCommand(`logline flows run ${flow.id} --simulate`)}
                              >
                                Simulate
                              </Button>
                              <Button size="sm" onClick={() => runQuickCommand(`logline flows run ${flow.id}`)}>
                                Run
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quick">
          <Card>
            <CardHeader>
              <CardTitle>Quick Commands</CardTitle>
              <CardDescription>Common commands for quick access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">System Status</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => runQuickCommand("logline ops status")}
                    >
                      System Status
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => runQuickCommand("logline ops browser status")}
                    >
                      Browser Status
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => runQuickCommand("logline ops spans list")}
                    >
                      List Spans
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => runQuickCommand("logline ops timeline --limit 5")}
                    >
                      Recent Timeline
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Flow Management</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => runQuickCommand("logline flows list")}
                    >
                      List Flows
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => runQuickCommand("logline flows create demo-flow 'Demo automation flow'")}
                    >
                      Create Demo Flow
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() =>
                        runQuickCommand("logline flows add-step demo-flow navigate --url https://example.com")
                      }
                    >
                      Add Navigate Step
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => runQuickCommand("logline flows add-step demo-flow click --selector #button")}
                    >
                      Add Click Step
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
