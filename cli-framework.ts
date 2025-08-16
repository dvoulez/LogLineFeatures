import { spanEngine } from "./span-engine"
import { headlessBrowser } from "./headless-browser"

// CLI Command types
export interface CLICommand {
  name: string
  description: string
  usage: string
  examples: string[]
  handler: (args: string[]) => Promise<CLIResult>
}

export interface CLIResult {
  success: boolean
  output: string
  data?: any
  error?: string
}

export interface FlowDefinition {
  id: string
  name: string
  description: string
  steps: FlowStep[]
  created: number
  lastRun?: number
}

export interface FlowStep {
  id: string
  type: "navigate" | "click" | "type" | "read" | "wait" | "screenshot"
  description: string
  params: Record<string, any>
}

export class CLIFramework {
  private flows: Map<string, FlowDefinition> = new Map()
  private commandHistory: Array<{ command: string; timestamp: number; result: CLIResult }> = []

  // Flow Commands (logline flows)
  private flowCommands: Map<string, CLICommand> = new Map([
    [
      "create",
      {
        name: "create",
        description: "Create a new automation flow",
        usage: "logline flows create <flow-name> [description]",
        examples: ["logline flows create login-flow 'Automated login process'"],
        handler: this.createFlow.bind(this),
      },
    ],
    [
      "list",
      {
        name: "list",
        description: "List all automation flows",
        usage: "logline flows list",
        examples: ["logline flows list"],
        handler: this.listFlows.bind(this),
      },
    ],
    [
      "run",
      {
        name: "run",
        description: "Execute an automation flow",
        usage: "logline flows run <flow-id> [--simulate] [--approve-all]",
        examples: ["logline flows run login-flow", "logline flows run login-flow --simulate"],
        handler: this.runFlow.bind(this),
      },
    ],
    [
      "add-step",
      {
        name: "add-step",
        description: "Add a step to an existing flow",
        usage: "logline flows add-step <flow-id> <step-type> <params>",
        examples: [
          "logline flows add-step login-flow navigate --url https://example.com",
          "logline flows add-step login-flow click --selector '#login-button'",
        ],
        handler: this.addFlowStep.bind(this),
      },
    ],
    [
      "delete",
      {
        name: "delete",
        description: "Delete an automation flow",
        usage: "logline flows delete <flow-id>",
        examples: ["logline flows delete login-flow"],
        handler: this.deleteFlow.bind(this),
      },
    ],
  ])

  // Ops Commands (logline ops)
  private opsCommands: Map<string, CLICommand> = new Map([
    [
      "status",
      {
        name: "status",
        description: "Show system status and active spans",
        usage: "logline ops status",
        examples: ["logline ops status"],
        handler: this.getStatus.bind(this),
      },
    ],
    [
      "spans",
      {
        name: "spans",
        description: "List and manage spans",
        usage: "logline ops spans [list|show|rollback] [span-id]",
        examples: ["logline ops spans list", "logline ops spans show span_123", "logline ops spans rollback span_123"],
        handler: this.manageSpans.bind(this),
      },
    ],
    [
      "timeline",
      {
        name: "timeline",
        description: "Show execution timeline",
        usage: "logline ops timeline [--limit <n>] [--filter <type>]",
        examples: [
          "logline ops timeline",
          "logline ops timeline --limit 10",
          "logline ops timeline --filter navigation",
        ],
        handler: this.showTimeline.bind(this),
      },
    ],
    [
      "browser",
      {
        name: "browser",
        description: "Manage browser instances",
        usage: "logline ops browser [status|connect|disconnect|context]",
        examples: ["logline ops browser status", "logline ops browser connect", "logline ops browser context"],
        handler: this.manageBrowser.bind(this),
      },
    ],
    [
      "logs",
      {
        name: "logs",
        description: "View system logs and audit trail",
        usage: "logline ops logs [--level <level>] [--since <time>]",
        examples: ["logline ops logs", "logline ops logs --level error", "logline ops logs --since 1h"],
        handler: this.showLogs.bind(this),
      },
    ],
  ])

  async executeCommand(input: string): Promise<CLIResult> {
    const parts = input.trim().split(/\s+/)
    if (parts.length < 2) {
      return {
        success: false,
        output: "Invalid command format. Use 'logline flows <command>' or 'logline ops <command>'",
        error: "Invalid format",
      }
    }

    const [logline, category, command, ...args] = parts

    if (logline !== "logline") {
      return {
        success: false,
        output: "Commands must start with 'logline'",
        error: "Invalid prefix",
      }
    }

    let result: CLIResult

    try {
      if (category === "flows") {
        const cmd = this.flowCommands.get(command)
        if (!cmd) {
          result = {
            success: false,
            output: `Unknown flows command: ${command}\nAvailable commands: ${Array.from(this.flowCommands.keys()).join(", ")}`,
            error: "Unknown command",
          }
        } else {
          result = await cmd.handler(args)
        }
      } else if (category === "ops") {
        const cmd = this.opsCommands.get(command)
        if (!cmd) {
          result = {
            success: false,
            output: `Unknown ops command: ${command}\nAvailable commands: ${Array.from(this.opsCommands.keys()).join(", ")}`,
            error: "Unknown command",
          }
        } else {
          result = await cmd.handler(args)
        }
      } else {
        result = {
          success: false,
          output: `Unknown category: ${category}\nAvailable categories: flows, ops`,
          error: "Unknown category",
        }
      }
    } catch (error) {
      result = {
        success: false,
        output: `Command execution failed: ${error instanceof Error ? error.message : String(error)}`,
        error: String(error),
      }
    }

    // Add to command history
    this.commandHistory.push({
      command: input,
      timestamp: Date.now(),
      result,
    })

    return result
  }

  // Flow command handlers
  private async createFlow(args: string[]): Promise<CLIResult> {
    if (args.length < 1) {
      return {
        success: false,
        output: "Usage: logline flows create <flow-name> [description]",
        error: "Missing flow name",
      }
    }

    const flowId = args[0]
    const description = args.slice(1).join(" ") || `Automation flow: ${flowId}`

    if (this.flows.has(flowId)) {
      return {
        success: false,
        output: `Flow '${flowId}' already exists`,
        error: "Flow exists",
      }
    }

    const flow: FlowDefinition = {
      id: flowId,
      name: flowId,
      description,
      steps: [],
      created: Date.now(),
    }

    this.flows.set(flowId, flow)

    return {
      success: true,
      output: `Created flow '${flowId}': ${description}`,
      data: flow,
    }
  }

  private async listFlows(args: string[]): Promise<CLIResult> {
    const flows = Array.from(this.flows.values())

    if (flows.length === 0) {
      return {
        success: true,
        output: "No flows found. Create one with 'logline flows create <name>'",
      }
    }

    const output = flows
      .map((flow) => {
        const lastRun = flow.lastRun ? new Date(flow.lastRun).toLocaleString() : "Never"
        return `${flow.id} - ${flow.description} (${flow.steps.length} steps, last run: ${lastRun})`
      })
      .join("\n")

    return {
      success: true,
      output: `Found ${flows.length} flows:\n${output}`,
      data: flows,
    }
  }

  private async runFlow(args: string[]): Promise<CLIResult> {
    if (args.length < 1) {
      return {
        success: false,
        output: "Usage: logline flows run <flow-id> [--simulate] [--approve-all]",
        error: "Missing flow ID",
      }
    }

    const flowId = args[0]
    const simulate = args.includes("--simulate")
    const approveAll = args.includes("--approve-all")

    const flow = this.flows.get(flowId)
    if (!flow) {
      return {
        success: false,
        output: `Flow '${flowId}' not found`,
        error: "Flow not found",
      }
    }

    if (flow.steps.length === 0) {
      return {
        success: false,
        output: `Flow '${flowId}' has no steps. Add steps with 'logline flows add-step'`,
        error: "No steps",
      }
    }

    let output = `${simulate ? "Simulating" : "Executing"} flow '${flowId}' with ${flow.steps.length} steps:\n`

    for (const step of flow.steps) {
      try {
        let spanId: string

        switch (step.type) {
          case "navigate":
            spanId = await headlessBrowser.navigateToSpan(step.params.url)
            break
          case "click":
            spanId = await headlessBrowser.clickElementSpan({ type: "css", value: step.params.selector })
            break
          case "type":
            spanId = await headlessBrowser.typeTextSpan({ type: "css", value: step.params.selector }, step.params.text)
            break
          case "read":
            spanId = await headlessBrowser.readElementSpan({ type: "css", value: step.params.selector })
            break
          case "screenshot":
            spanId = await headlessBrowser.takeScreenshotSpan(step.params.fullPage || false)
            break
          default:
            output += `  ❌ Unknown step type: ${step.type}\n`
            continue
        }

        if (simulate || approveAll) {
          if (simulate) {
            await spanEngine.simulateSpan(spanId)
            output += `  ✓ Simulated: ${step.description}\n`
          } else {
            await spanEngine.simulateSpan(spanId)
            await spanEngine.executeSpan(spanId)
            output += `  ✓ Executed: ${step.description}\n`
          }
        } else {
          await spanEngine.simulateSpan(spanId)
          output += `  ⏳ Awaiting approval: ${step.description} (span: ${spanId})\n`
        }
      } catch (error) {
        output += `  ❌ Failed: ${step.description} - ${error}\n`
      }
    }

    flow.lastRun = Date.now()

    return {
      success: true,
      output,
      data: { flowId, simulate, approveAll },
    }
  }

  private async addFlowStep(args: string[]): Promise<CLIResult> {
    if (args.length < 2) {
      return {
        success: false,
        output: "Usage: logline flows add-step <flow-id> <step-type> <params>",
        error: "Missing arguments",
      }
    }

    const flowId = args[0]
    const stepType = args[1]
    const params: Record<string, any> = {}

    // Parse parameters
    for (let i = 2; i < args.length; i += 2) {
      if (args[i].startsWith("--") && i + 1 < args.length) {
        const key = args[i].substring(2)
        const value = args[i + 1]
        params[key] = value
      }
    }

    const flow = this.flows.get(flowId)
    if (!flow) {
      return {
        success: false,
        output: `Flow '${flowId}' not found`,
        error: "Flow not found",
      }
    }

    const step: FlowStep = {
      id: `step_${Date.now()}`,
      type: stepType as FlowStep["type"],
      description: `${stepType} with params: ${JSON.stringify(params)}`,
      params,
    }

    flow.steps.push(step)

    return {
      success: true,
      output: `Added step to flow '${flowId}': ${step.description}`,
      data: step,
    }
  }

  private async deleteFlow(args: string[]): Promise<CLIResult> {
    if (args.length < 1) {
      return {
        success: false,
        output: "Usage: logline flows delete <flow-id>",
        error: "Missing flow ID",
      }
    }

    const flowId = args[0]

    if (!this.flows.has(flowId)) {
      return {
        success: false,
        output: `Flow '${flowId}' not found`,
        error: "Flow not found",
      }
    }

    this.flows.delete(flowId)

    return {
      success: true,
      output: `Deleted flow '${flowId}'`,
    }
  }

  // Ops command handlers
  private async getStatus(args: string[]): Promise<CLIResult> {
    const spans = spanEngine.getAllSpans()
    const browserContext = headlessBrowser.getBrowserContext()
    const isConnected = headlessBrowser.isReady()

    const activeSpans = spans.filter((s) => s.status === "executing" || s.status === "awaiting_approval")
    const completedSpans = spans.filter((s) => s.status === "completed")
    const failedSpans = spans.filter((s) => s.status === "failed")

    const output = `
LogLineBrowser System Status:

Browser:
  Status: ${isConnected ? "Connected" : "Disconnected"}
  Current URL: ${browserContext.url || "None"}
  Page Title: ${browserContext.title || "None"}

Spans:
  Total: ${spans.length}
  Active: ${activeSpans.length}
  Completed: ${completedSpans.length}
  Failed: ${failedSpans.length}

Flows:
  Total: ${this.flows.size}
  Available: ${Array.from(this.flows.keys()).join(", ") || "None"}
    `.trim()

    return {
      success: true,
      output,
      data: { spans: spans.length, flows: this.flows.size, browserConnected: isConnected },
    }
  }

  private async manageSpans(args: string[]): Promise<CLIResult> {
    const action = args[0] || "list"
    const spanId = args[1]

    switch (action) {
      case "list":
        const spans = spanEngine.getAllSpans()
        if (spans.length === 0) {
          return { success: true, output: "No spans found" }
        }

        const output = spans
          .map((span) => {
            const duration = span.endTime ? span.endTime - span.startTime : Date.now() - span.startTime
            return `${span.id} - ${span.type} (${span.status}) - ${duration}ms`
          })
          .join("\n")

        return { success: true, output: `Found ${spans.length} spans:\n${output}`, data: spans }

      case "show":
        if (!spanId) {
          return { success: false, output: "Usage: logline ops spans show <span-id>", error: "Missing span ID" }
        }

        const span = spanEngine.getSpan(spanId)
        if (!span) {
          return { success: false, output: `Span '${spanId}' not found`, error: "Span not found" }
        }

        return {
          success: true,
          output: `Span Details:\n${JSON.stringify(span, null, 2)}`,
          data: span,
        }

      case "rollback":
        if (!spanId) {
          return { success: false, output: "Usage: logline ops spans rollback <span-id>", error: "Missing span ID" }
        }

        try {
          await spanEngine.rollbackSpan(spanId)
          return { success: true, output: `Rolled back span '${spanId}'` }
        } catch (error) {
          return { success: false, output: `Rollback failed: ${error}`, error: String(error) }
        }

      default:
        return {
          success: false,
          output: `Unknown spans action: ${action}\nAvailable actions: list, show, rollback`,
          error: "Unknown action",
        }
    }
  }

  private async showTimeline(args: string[]): Promise<CLIResult> {
    const timeline = spanEngine.getTimeline()
    let limit = 20
    let filter: string | undefined

    // Parse arguments
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--limit" && i + 1 < args.length) {
        limit = Number.parseInt(args[i + 1])
        i++
      } else if (args[i] === "--filter" && i + 1 < args.length) {
        filter = args[i + 1]
        i++
      }
    }

    let filteredTimeline = timeline
    if (filter) {
      filteredTimeline = timeline.filter((event) => event.event.includes(filter))
    }

    const recentEvents = filteredTimeline.slice(-limit)

    if (recentEvents.length === 0) {
      return { success: true, output: "No timeline events found" }
    }

    const output = recentEvents
      .map((event) => {
        const time = new Date(event.timestamp).toLocaleTimeString()
        return `[${time}] ${event.spanId}: ${event.event}`
      })
      .join("\n")

    return {
      success: true,
      output: `Timeline (${recentEvents.length} events):\n${output}`,
      data: recentEvents,
    }
  }

  private async manageBrowser(args: string[]): Promise<CLIResult> {
    const action = args[0] || "status"

    switch (action) {
      case "status":
        const isConnected = headlessBrowser.isReady()
        return {
          success: true,
          output: `Browser Status: ${isConnected ? "Connected" : "Disconnected"}`,
          data: { connected: isConnected },
        }

      case "connect":
        await headlessBrowser.connect()
        return { success: true, output: "Browser connected" }

      case "disconnect":
        await headlessBrowser.disconnect()
        return { success: true, output: "Browser disconnected" }

      case "context":
        const context = headlessBrowser.getBrowserContext()
        return {
          success: true,
          output: `Browser Context:\n${JSON.stringify(context, null, 2)}`,
          data: context,
        }

      default:
        return {
          success: false,
          output: `Unknown browser action: ${action}\nAvailable actions: status, connect, disconnect, context`,
          error: "Unknown action",
        }
    }
  }

  private async showLogs(args: string[]): Promise<CLIResult> {
    // Simulate log entries
    const logs = this.commandHistory.slice(-10).map((entry) => {
      const time = new Date(entry.timestamp).toLocaleTimeString()
      const level = entry.result.success ? "INFO" : "ERROR"
      return `[${time}] ${level}: ${entry.command} -> ${entry.result.success ? "SUCCESS" : entry.result.error}`
    })

    return {
      success: true,
      output: logs.length > 0 ? `Recent Logs:\n${logs.join("\n")}` : "No logs found",
      data: logs,
    }
  }

  getFlows(): FlowDefinition[] {
    return Array.from(this.flows.values())
  }

  getCommandHistory(): Array<{ command: string; timestamp: number; result: CLIResult }> {
    return [...this.commandHistory]
  }
}

// Global CLI instance
export const cliFramework = new CLIFramework()
