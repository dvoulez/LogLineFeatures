// Core span types and interfaces
export interface SpanContext {
  id: string
  parentId?: string
  type: SpanType
  status: SpanStatus
  startTime: number
  endTime?: number
  metadata: Record<string, any>
  reversible: boolean
}

export enum SpanType {
  NAVIGATION = "navigation",
  READ = "read",
  WRITE = "write",
  GUI_AUTOMATION = "gui_automation",
  IO_OPERATION = "io_operation",
  COMPUTATION = "computation",
}

export enum SpanStatus {
  PENDING = "pending",
  SIMULATING = "simulating",
  AWAITING_APPROVAL = "awaiting_approval",
  EXECUTING = "executing",
  COMPLETED = "completed",
  FAILED = "failed",
  ROLLED_BACK = "rolled_back",
}

export interface SpanOperation {
  id: string
  description: string
  operation: () => Promise<any>
  rollback?: () => Promise<void>
  simulate: () => Promise<SpanDiff>
}

export interface SpanDiff {
  changes: Array<{
    type: "create" | "update" | "delete"
    target: string
    before?: any
    after?: any
  }>
  impact: "low" | "medium" | "high"
  reversible: boolean
}

export class SpanEngine {
  private spans: Map<string, SpanContext> = new Map()
  private operations: Map<string, SpanOperation> = new Map()
  private timeline: Array<{ spanId: string; timestamp: number; event: string }> = []

  async createSpan(type: SpanType, operation: SpanOperation, parentId?: string): Promise<string> {
    const spanId = `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const span: SpanContext = {
      id: spanId,
      parentId,
      type,
      status: SpanStatus.PENDING,
      startTime: Date.now(),
      metadata: {},
      reversible: !!operation.rollback,
    }

    this.spans.set(spanId, span)
    this.operations.set(spanId, operation)
    this.addTimelineEvent(spanId, "span_created")

    return spanId
  }

  async simulateSpan(spanId: string): Promise<SpanDiff> {
    const span = this.spans.get(spanId)
    const operation = this.operations.get(spanId)

    if (!span || !operation) {
      throw new Error(`Span ${spanId} not found`)
    }

    span.status = SpanStatus.SIMULATING
    this.addTimelineEvent(spanId, "simulation_started")

    try {
      const diff = await operation.simulate()
      span.status = SpanStatus.AWAITING_APPROVAL
      this.addTimelineEvent(spanId, "simulation_completed")
      return diff
    } catch (error) {
      span.status = SpanStatus.FAILED
      this.addTimelineEvent(spanId, "simulation_failed")
      throw error
    }
  }

  async executeSpan(spanId: string): Promise<any> {
    const span = this.spans.get(spanId)
    const operation = this.operations.get(spanId)

    if (!span || !operation) {
      throw new Error(`Span ${spanId} not found`)
    }

    if (span.status !== SpanStatus.AWAITING_APPROVAL) {
      throw new Error(`Span ${spanId} is not ready for execution`)
    }

    span.status = SpanStatus.EXECUTING
    this.addTimelineEvent(spanId, "execution_started")

    try {
      const result = await operation.operation()
      span.status = SpanStatus.COMPLETED
      span.endTime = Date.now()
      this.addTimelineEvent(spanId, "execution_completed")
      return result
    } catch (error) {
      span.status = SpanStatus.FAILED
      span.endTime = Date.now()
      this.addTimelineEvent(spanId, "execution_failed")
      throw error
    }
  }

  async rollbackSpan(spanId: string): Promise<void> {
    const span = this.spans.get(spanId)
    const operation = this.operations.get(spanId)

    if (!span || !operation) {
      throw new Error(`Span ${spanId} not found`)
    }

    if (!span.reversible || !operation.rollback) {
      throw new Error(`Span ${spanId} is not reversible`)
    }

    if (span.status !== SpanStatus.COMPLETED) {
      throw new Error(`Span ${spanId} cannot be rolled back in current state`)
    }

    this.addTimelineEvent(spanId, "rollback_started")

    try {
      await operation.rollback()
      span.status = SpanStatus.ROLLED_BACK
      this.addTimelineEvent(spanId, "rollback_completed")
    } catch (error) {
      this.addTimelineEvent(spanId, "rollback_failed")
      throw error
    }
  }

  getSpan(spanId: string): SpanContext | undefined {
    return this.spans.get(spanId)
  }

  getAllSpans(): SpanContext[] {
    return Array.from(this.spans.values())
  }

  getTimeline(): Array<{ spanId: string; timestamp: number; event: string }> {
    return [...this.timeline].sort((a, b) => a.timestamp - b.timestamp)
  }

  private addTimelineEvent(spanId: string, event: string): void {
    this.timeline.push({
      spanId,
      timestamp: Date.now(),
      event,
    })
  }
}

// Global span engine instance
export const spanEngine = new SpanEngine()
