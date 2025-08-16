import { timelineObservability, type TimelineEvent } from "./timeline-observability"
import { logLineID } from "./logline-id"
import { securityGovernance } from "./security-governance"

// Unified Timeline Integration
export interface UnifiedTimelineEvent extends TimelineEvent {
  category: "span" | "security" | "identity" | "cli" | "system"
  relatedEvents?: string[]
  traceId?: string
}

export class UnifiedTimeline {
  private events: Map<string, UnifiedTimelineEvent> = new Map()
  private traces: Map<string, string[]> = new Map() // traceId -> eventIds

  constructor() {
    this.initializeIntegrations()
  }

  private initializeIntegrations() {
    // Integration with existing systems
    this.setupSpanEngineIntegration()
    this.setupSecurityIntegration()
    this.setupIdentityIntegration()
    this.setupCLIIntegration()
  }

  private setupSpanEngineIntegration() {
    // Hook into span engine events
    const originalCreateSpan = (window as any).spanEngine?.createSpan
    if (originalCreateSpan) {
      ;(window as any).spanEngine.createSpan = (...args: any[]) => {
        const result = originalCreateSpan.apply((window as any).spanEngine, args)
        this.logEvent({
          type: "span_created",
          category: "span",
          message: `Span created: ${args[0]}`,
          source: "span_engine",
          severity: "info",
          metadata: { spanType: args[0], args: args[1] },
        })
        return result
      }
    }
  }

  private setupSecurityIntegration() {
    // Hook into security governance events
    const originalRequestApproval = securityGovernance.requestApproval
    securityGovernance.requestApproval = async (spanId: string) => {
      const result = await originalRequestApproval.call(securityGovernance, spanId)
      this.logEvent({
        type: "approval_requested",
        category: "security",
        message: `Approval requested for span ${spanId}`,
        source: "security_engine",
        severity: "warning",
        metadata: { spanId, approvalId: result },
        spanId,
      })
      return result
    }
  }

  private setupIdentityIntegration() {
    // Hook into LogLine ID events
    const originalCreateDataLicense = logLineID.createDataLicense
    logLineID.createDataLicense = async (...args: any[]) => {
      const result = await originalCreateDataLicense.apply(logLineID, args)
      this.logEvent({
        type: "data_license_created",
        category: "identity",
        message: `Data license created: ${args[1]} for ${args[3]}`,
        source: "logline_id",
        severity: "info",
        metadata: {
          identityId: args[0],
          dataType: args[1],
          recipient: args[3],
          licenseId: result,
        },
      })
      return result
    }
  }

  private setupCLIIntegration() {
    // Hook into CLI command execution
    const originalExecuteCommand = (window as any).cliFramework?.executeCommand
    if (originalExecuteCommand) {
      ;(window as any).cliFramework.executeCommand = async (command: string) => {
        const startTime = Date.now()
        const result = await originalExecuteCommand.call((window as any).cliFramework, command)
        const duration = Date.now() - startTime

        this.logEvent({
          type: "cli_command_executed",
          category: "cli",
          message: `CLI command executed: ${command}`,
          source: "cli_framework",
          severity: result.success ? "info" : "error",
          metadata: {
            command,
            success: result.success,
            duration,
            output: result.output,
          },
        })
        return result
      }
    }
  }

  logEvent(eventData: Partial<UnifiedTimelineEvent>): string {
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const event: UnifiedTimelineEvent = {
      id: eventId,
      timestamp: Date.now(),
      type: eventData.type || "system_event",
      category: eventData.category || "system",
      message: eventData.message || "System event",
      source: eventData.source || "unified_timeline",
      severity: eventData.severity || "info",
      metadata: eventData.metadata || {},
      tags: eventData.tags || [],
      spanId: eventData.spanId,
      userId: eventData.userId,
      traceId: eventData.traceId,
      relatedEvents: eventData.relatedEvents || [],
    }

    this.events.set(eventId, event)

    // Handle trace grouping
    if (event.traceId) {
      if (!this.traces.has(event.traceId)) {
        this.traces.set(event.traceId, [])
      }
      this.traces.get(event.traceId)!.push(eventId)
    }

    // Also log to the existing timeline system
    timelineObservability.logEvent(event.type as any, event.source, event.message, event.metadata)

    return eventId
  }

  getEvents(
    options: {
      category?: string
      traceId?: string
      startTime?: number
      endTime?: number
      limit?: number
    } = {},
  ): UnifiedTimelineEvent[] {
    let events = Array.from(this.events.values())

    // Apply filters
    if (options.category) {
      events = events.filter((e) => e.category === options.category)
    }

    if (options.traceId) {
      const traceEventIds = this.traces.get(options.traceId) || []
      events = events.filter((e) => traceEventIds.includes(e.id))
    }

    if (options.startTime) {
      events = events.filter((e) => e.timestamp >= options.startTime!)
    }

    if (options.endTime) {
      events = events.filter((e) => e.timestamp <= options.endTime!)
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => b.timestamp - a.timestamp)

    // Apply limit
    if (options.limit) {
      events = events.slice(0, options.limit)
    }

    return events
  }

  getTrace(traceId: string): UnifiedTimelineEvent[] {
    const eventIds = this.traces.get(traceId) || []
    return eventIds
      .map((id) => this.events.get(id))
      .filter((e): e is UnifiedTimelineEvent => e !== undefined)
      .sort((a, b) => a.timestamp - b.timestamp)
  }

  createTrace(): string {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.traces.set(traceId, [])
    return traceId
  }

  linkEvents(eventIds: string[], traceId?: string): string {
    const finalTraceId = traceId || this.createTrace()

    for (const eventId of eventIds) {
      const event = this.events.get(eventId)
      if (event) {
        event.traceId = finalTraceId
        if (!this.traces.has(finalTraceId)) {
          this.traces.set(finalTraceId, [])
        }
        this.traces.get(finalTraceId)!.push(eventId)
      }
    }

    return finalTraceId
  }
}

export const unifiedTimeline = new UnifiedTimeline()
