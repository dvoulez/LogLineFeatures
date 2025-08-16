import type { TimelineEvent } from "./timeline-event"
import { EventType } from "./event-type"
import type { PerformanceMetric } from "./performance-metric"
import type { SystemAlert } from "./system-alert"
import type { AuditLog } from "./audit-log"
import type { ObservabilityDashboard } from "./observability-dashboard"
import type { TimelineQuery } from "./timeline-query"
import type { MetricsQuery } from "./metrics-query"

let spanEngine: any = null
let securityGovernance: any = null

// Safely import dependencies if they exist
try {
  spanEngine = require("./span-engine")?.spanEngine || { getAllSpans: () => [] }
} catch {
  spanEngine = { getAllSpans: () => [] }
}

try {
  securityGovernance = require("./security-governance")?.securityGovernance || { getPendingApprovals: () => [] }
} catch {
  securityGovernance = { getPendingApprovals: () => [] }
}

export class TimelineObservabilityEngine {
  private events: TimelineEvent[] = []
  private metrics: PerformanceMetric[] = []
  private alerts: SystemAlert[] = []
  private auditLogs: AuditLog[] = []
  private dashboards: Map<string, ObservabilityDashboard> = new Map()
  private eventListeners: Map<EventType, Array<(event: TimelineEvent) => void>> = new Map()

  constructor() {
    this.initializeDefaultDashboard()
    this.startPerformanceMonitoring()
    this.setupEventListeners()
  }

  private initializeDefaultDashboard() {
    const defaultDashboard: ObservabilityDashboard = {
      id: "default",
      name: "System Overview",
      widgets: [
        {
          id: "system-metrics",
          type: "metric",
          title: "System Metrics",
          config: { metrics: ["span_execution_time", "span_success_rate", "active_spans"] },
          position: { x: 0, y: 0, width: 6, height: 4 },
        },
        {
          id: "recent-events",
          type: "timeline",
          title: "Recent Events",
          config: { limit: 10, severities: ["warning", "error", "critical"] },
          position: { x: 6, y: 0, width: 6, height: 4 },
        },
        {
          id: "active-alerts",
          type: "alert",
          title: "Active Alerts",
          config: { resolved: false },
          position: { x: 0, y: 4, width: 12, height: 3 },
        },
      ],
      created: Date.now(),
      lastModified: Date.now(),
    }

    this.dashboards.set(defaultDashboard.id, defaultDashboard)
  }

  private startPerformanceMonitoring() {
    // Simulate performance monitoring
    setInterval(() => {
      this.recordMetric("active_spans", spanEngine.getAllSpans().length, "count", "span_engine")
      this.recordMetric("memory_usage", Math.random() * 100, "MB", "system")
      this.recordMetric("cpu_usage", Math.random() * 100, "percent", "system")
    }, 5000)
  }

  private setupEventListeners() {
    // Listen for span engine events
    this.addEventListener(EventType.SPAN_CREATED, (event) => {
      this.recordMetric("spans_created_total", 1, "count", "span_engine")
    })

    this.addEventListener(EventType.SPAN_EXECUTED, (event) => {
      this.recordMetric("spans_executed_total", 1, "count", "span_engine")
      // Simulate execution time
      const executionTime = Math.random() * 2000 + 100
      this.recordMetric("span_execution_time", executionTime, "ms", "span_engine")
    })

    this.addEventListener(EventType.SPAN_FAILED, (event) => {
      this.recordMetric("spans_failed_total", 1, "count", "span_engine")
      this.createAlert(
        "error",
        "high",
        "Span Execution Failed",
        `Span ${event.spanId} failed to execute`,
        "span_engine",
      )
    })

    this.addEventListener(EventType.SECURITY_VIOLATION, (event) => {
      this.createAlert("security", "critical", "Security Policy Violation", event.message, "security_engine")
    })
  }

  // Event Management
  logEvent(
    type: EventType,
    source: string,
    message: string,
    options: {
      spanId?: string
      userId?: string
      severity?: TimelineEvent["severity"]
      metadata?: Record<string, any>
      tags?: string[]
    } = {},
  ): string {
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const event: TimelineEvent = {
      id: eventId,
      timestamp: Date.now(),
      type,
      source,
      spanId: options.spanId,
      userId: options.userId,
      severity: options.severity || "info",
      message,
      metadata: options.metadata || {},
      tags: options.tags || [],
    }

    this.events.push(event)

    // Trigger event listeners
    const listeners = this.eventListeners.get(type) || []
    listeners.forEach((listener) => {
      try {
        listener(event)
      } catch (error) {
        console.error("Event listener error:", error)
      }
    })

    // Keep only recent events (last 1000)
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000)
    }

    return eventId
  }

  addEventListener(type: EventType, listener: (event: TimelineEvent) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, [])
    }
    this.eventListeners.get(type)!.push(listener)
  }

  removeEventListener(type: EventType, listener: (event: TimelineEvent) => void): void {
    const listeners = this.eventListeners.get(type)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // Timeline Queries
  queryEvents(query: TimelineQuery = {}): TimelineEvent[] {
    let filteredEvents = [...this.events]

    // Apply filters
    if (query.startTime) {
      filteredEvents = filteredEvents.filter((e) => e.timestamp >= query.startTime!)
    }

    if (query.endTime) {
      filteredEvents = filteredEvents.filter((e) => e.timestamp <= query.endTime!)
    }

    if (query.eventTypes && query.eventTypes.length > 0) {
      filteredEvents = filteredEvents.filter((e) => query.eventTypes!.includes(e.type))
    }

    if (query.sources && query.sources.length > 0) {
      filteredEvents = filteredEvents.filter((e) => query.sources!.includes(e.source))
    }

    if (query.severities && query.severities.length > 0) {
      filteredEvents = filteredEvents.filter((e) => query.severities!.includes(e.severity))
    }

    if (query.spanIds && query.spanIds.length > 0) {
      filteredEvents = filteredEvents.filter((e) => e.spanId && query.spanIds!.includes(e.spanId))
    }

    if (query.userIds && query.userIds.length > 0) {
      filteredEvents = filteredEvents.filter((e) => e.userId && query.userIds!.includes(e.userId))
    }

    if (query.tags && query.tags.length > 0) {
      filteredEvents = filteredEvents.filter((e) => query.tags!.some((tag) => e.tags.includes(tag)))
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => b.timestamp - a.timestamp)

    // Apply pagination
    const offset = query.offset || 0
    const limit = query.limit || 100

    return filteredEvents.slice(offset, offset + limit)
  }

  // Performance Metrics
  recordMetric(metric: string, value: number, unit: string, source: string, tags: Record<string, string> = {}): void {
    const metricId = `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const performanceMetric: PerformanceMetric = {
      id: metricId,
      timestamp: Date.now(),
      metric,
      value,
      unit,
      source,
      tags,
    }

    this.metrics.push(performanceMetric)

    // Keep only recent metrics (last 10000)
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-10000)
    }

    // Check for performance alerts
    this.checkPerformanceThresholds(metric, value, source)
  }

  private checkPerformanceThresholds(metric: string, value: number, source: string): void {
    const thresholds: Record<string, { warning: number; critical: number }> = {
      cpu_usage: { warning: 80, critical: 95 },
      memory_usage: { warning: 80, critical: 95 },
      span_execution_time: { warning: 5000, critical: 10000 },
    }

    const threshold = thresholds[metric]
    if (!threshold) return

    if (value >= threshold.critical) {
      this.createAlert(
        "performance",
        "critical",
        `Critical ${metric} threshold exceeded`,
        `${metric} is ${value} (threshold: ${threshold.critical})`,
        source,
      )
    } else if (value >= threshold.warning) {
      this.createAlert(
        "performance",
        "medium",
        `Warning ${metric} threshold exceeded`,
        `${metric} is ${value} (threshold: ${threshold.warning})`,
        source,
      )
    }
  }

  queryMetrics(query: MetricsQuery = {}): PerformanceMetric[] {
    let filteredMetrics = [...this.metrics]

    // Apply filters
    if (query.startTime) {
      filteredMetrics = filteredMetrics.filter((m) => m.timestamp >= query.startTime!)
    }

    if (query.endTime) {
      filteredMetrics = filteredMetrics.filter((m) => m.timestamp <= query.endTime!)
    }

    if (query.metrics && query.metrics.length > 0) {
      filteredMetrics = filteredMetrics.filter((m) => query.metrics!.includes(m.metric))
    }

    if (query.sources && query.sources.length > 0) {
      filteredMetrics = filteredMetrics.filter((m) => query.sources!.includes(m.source))
    }

    // Sort by timestamp
    filteredMetrics.sort((a, b) => b.timestamp - a.timestamp)

    return filteredMetrics
  }

  // Alert Management
  createAlert(type: string, severity: string, title: string, description: string, source: string): string {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const alert: SystemAlert = {
      id: alertId,
      timestamp: Date.now(),
      type,
      severity,
      title,
      description,
      source,
      resolved: false,
    }

    this.alerts.push(alert)

    // Log alert as event
    this.logEvent(EventType.PERFORMANCE_ALERT, source, `Alert created: ${title}`, {
      severity: severity === "critical" ? "critical" : severity === "high" ? "error" : "warning",
      metadata: { alertId, alertType: type },
      tags: ["alert", type],
    })

    return alertId
  }

  resolveAlert(alertId: string, resolvedBy: string): void {
    const alert = this.alerts.find((a) => a.id === alertId)
    if (alert && !alert.resolved) {
      alert.resolved = true
      alert.resolvedAt = Date.now()
      alert.resolvedBy = resolvedBy

      this.logEvent(EventType.PERFORMANCE_ALERT, alert.source, `Alert resolved: ${alert.title}`, {
        severity: "info",
        metadata: { alertId, resolvedBy },
        tags: ["alert", "resolved"],
      })
    }
  }

  getAlerts(resolved?: boolean): SystemAlert[] {
    if (resolved === undefined) {
      return [...this.alerts].sort((a, b) => b.timestamp - a.timestamp)
    }
    return this.alerts.filter((a) => a.resolved === resolved).sort((a, b) => b.timestamp - a.timestamp)
  }

  // Audit Logging
  logAudit(
    userId: string,
    action: string,
    resource: string,
    outcome: "success" | "failure",
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string,
  ): string {
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const auditLog: AuditLog = {
      id: auditId,
      timestamp: Date.now(),
      userId,
      action,
      resource,
      outcome,
      details,
      ipAddress,
      userAgent,
    }

    this.auditLogs.push(auditLog)

    // Keep only recent audit logs (last 5000)
    if (this.auditLogs.length > 5000) {
      this.auditLogs = this.auditLogs.slice(-5000)
    }

    return auditId
  }

  getAuditLogs(
    filters: {
      userId?: string
      action?: string
      resource?: string
      outcome?: "success" | "failure"
      startTime?: number
      endTime?: number
    } = {},
  ): AuditLog[] {
    let filteredLogs = [...this.auditLogs]

    if (filters.userId) {
      filteredLogs = filteredLogs.filter((log) => log.userId === filters.userId)
    }

    if (filters.action) {
      filteredLogs = filteredLogs.filter((log) => log.action.includes(filters.action!))
    }

    if (filters.resource) {
      filteredLogs = filteredLogs.filter((log) => log.resource.includes(filters.resource!))
    }

    if (filters.outcome) {
      filteredLogs = filteredLogs.filter((log) => log.outcome === filters.outcome)
    }

    if (filters.startTime) {
      filteredLogs = filteredLogs.filter((log) => log.timestamp >= filters.startTime!)
    }

    if (filters.endTime) {
      filteredLogs = filteredLogs.filter((log) => log.timestamp <= filters.endTime!)
    }

    return filteredLogs.sort((a, b) => b.timestamp - a.timestamp)
  }

  // Dashboard Management
  createDashboard(dashboard: Omit<ObservabilityDashboard, "id" | "created" | "lastModified">): string {
    const dashboardId = `dashboard_${Date.now()}`
    const newDashboard: ObservabilityDashboard = {
      ...dashboard,
      id: dashboardId,
      created: Date.now(),
      lastModified: Date.now(),
    }

    this.dashboards.set(dashboardId, newDashboard)
    return dashboardId
  }

  getDashboards(): ObservabilityDashboard[] {
    return Array.from(this.dashboards.values())
  }

  getDashboard(dashboardId: string): ObservabilityDashboard | undefined {
    return this.dashboards.get(dashboardId)
  }

  // System Health
  getSystemHealth(): {
    status: "healthy" | "degraded" | "critical"
    checks: Array<{ name: string; status: "pass" | "fail"; message: string }>
    uptime: number
    lastCheck: number
  } {
    const checks = [
      {
        name: "Span Engine",
        status: spanEngine.getAllSpans().length < 100 ? ("pass" as const) : ("fail" as const),
        message: `${spanEngine.getAllSpans().length} active spans`,
      },
      {
        name: "Security Engine",
        status: securityGovernance.getPendingApprovals().length < 10 ? ("pass" as const) : ("fail" as const),
        message: `${securityGovernance.getPendingApprovals().length} pending approvals`,
      },
      {
        name: "Active Alerts",
        status: this.getAlerts(false).length < 5 ? ("pass" as const) : ("fail" as const),
        message: `${this.getAlerts(false).length} unresolved alerts`,
      },
    ]

    const failedChecks = checks.filter((check) => check.status === "fail").length
    const status = failedChecks === 0 ? "healthy" : failedChecks <= 1 ? "degraded" : "critical"

    return {
      status,
      checks,
      uptime: Date.now() - (Date.now() - 3600000), // Simulate 1 hour uptime
      lastCheck: Date.now(),
    }
  }
}

// Global timeline observability instance
export const timelineObservability = new TimelineObservabilityEngine()
