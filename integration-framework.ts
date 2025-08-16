import { spanEngine, SpanType, type SpanOperation } from "./span-engine"
import { timelineObservability, EventType } from "./timeline-observability"

// Integration Framework Types
export interface Integration {
  id: string
  name: string
  description: string
  version: string
  category: IntegrationCategory
  provider: string
  status: "active" | "inactive" | "error" | "pending"
  config: IntegrationConfig
  capabilities: IntegrationCapability[]
  dependencies: string[]
  created: number
  lastUpdated: number
  metadata: Record<string, any>
}

export enum IntegrationCategory {
  AEROSPACE = "aerospace",
  FINANCIAL = "financial",
  SCIENTIFIC = "scientific",
  HEALTHCARE = "healthcare",
  MANUFACTURING = "manufacturing",
  RETAIL = "retail",
  EDUCATION = "education",
  GOVERNMENT = "government",
  UTILITIES = "utilities",
  CUSTOM = "custom",
}

export interface IntegrationConfig {
  endpoints?: Record<string, string>
  credentials?: Record<string, string>
  settings?: Record<string, any>
  transformations?: DataTransformation[]
  rateLimits?: RateLimit[]
  retryPolicy?: RetryPolicy
}

export interface IntegrationCapability {
  type: "data_source" | "data_sink" | "processor" | "validator" | "transformer" | "notifier"
  name: string
  description: string
  inputSchema?: any
  outputSchema?: any
  parameters?: Parameter[]
}

export interface Parameter {
  name: string
  type: "string" | "number" | "boolean" | "object" | "array"
  required: boolean
  description: string
  defaultValue?: any
  validation?: ValidationRule[]
}

export interface ValidationRule {
  type: "regex" | "range" | "enum" | "custom"
  value: any
  message: string
}

export interface DataTransformation {
  id: string
  name: string
  type: "map" | "filter" | "aggregate" | "join" | "split"
  config: Record<string, any>
  enabled: boolean
}

export interface RateLimit {
  endpoint: string
  requestsPerSecond: number
  burstSize: number
}

export interface RetryPolicy {
  maxRetries: number
  backoffStrategy: "linear" | "exponential" | "fixed"
  baseDelay: number
  maxDelay: number
}

export interface IntegrationExecution {
  id: string
  integrationId: string
  spanId: string
  operation: string
  input: any
  output?: any
  status: "pending" | "running" | "completed" | "failed"
  startTime: number
  endTime?: number
  error?: string
  metrics: ExecutionMetrics
}

export interface ExecutionMetrics {
  duration: number
  dataProcessed: number
  apiCalls: number
  errors: number
  retries: number
}

export interface IntegrationTemplate {
  id: string
  name: string
  description: string
  category: IntegrationCategory
  template: Partial<Integration>
  examples: IntegrationExample[]
  documentation: string
}

export interface IntegrationExample {
  name: string
  description: string
  config: IntegrationConfig
  sampleData: any
}

export class IntegrationFramework {
  private integrations: Map<string, Integration> = new Map()
  private templates: Map<string, IntegrationTemplate> = new Map()
  private executions: Map<string, IntegrationExecution> = new Map()
  private plugins: Map<string, IntegrationPlugin> = new Map()

  constructor() {
    this.initializeDefaultTemplates()
    this.initializeSampleIntegrations()
  }

  private initializeDefaultTemplates() {
    const templates: IntegrationTemplate[] = [
      {
        id: "aerospace-flight-data",
        name: "Aerospace Flight Data Integration",
        description: "Integration for flight data systems, aircraft telemetry, and aviation databases",
        category: IntegrationCategory.AEROSPACE,
        template: {
          name: "Flight Data System",
          category: IntegrationCategory.AEROSPACE,
          capabilities: [
            {
              type: "data_source",
              name: "Flight Telemetry",
              description: "Real-time aircraft telemetry data",
              parameters: [
                { name: "aircraft_id", type: "string", required: true, description: "Aircraft identifier" },
                { name: "data_types", type: "array", required: false, description: "Telemetry data types to collect" },
              ],
            },
            {
              type: "processor",
              name: "Flight Path Analysis",
              description: "Analyze flight paths and performance metrics",
            },
          ],
        },
        examples: [
          {
            name: "Commercial Aircraft Monitoring",
            description: "Monitor commercial aircraft telemetry",
            config: {
              endpoints: { telemetry: "https://api.flightdata.com/telemetry" },
              settings: { updateInterval: 5000, dataRetention: "30d" },
            },
            sampleData: { aircraft_id: "N12345", altitude: 35000, speed: 450, heading: 270 },
          },
        ],
        documentation: "# Aerospace Integration\n\nThis integration provides access to flight data systems...",
      },
      {
        id: "financial-trading",
        name: "Financial Trading Integration",
        description: "Integration for trading systems, market data, and financial analytics",
        category: IntegrationCategory.FINANCIAL,
        template: {
          name: "Trading System",
          category: IntegrationCategory.FINANCIAL,
          capabilities: [
            {
              type: "data_source",
              name: "Market Data Feed",
              description: "Real-time market data and price feeds",
              parameters: [
                { name: "symbols", type: "array", required: true, description: "Trading symbols to monitor" },
                { name: "data_types", type: "array", required: false, description: "Market data types" },
              ],
            },
            {
              type: "data_sink",
              name: "Trade Execution",
              description: "Execute trades through broker APIs",
            },
          ],
        },
        examples: [
          {
            name: "Stock Market Integration",
            description: "Real-time stock market data and trading",
            config: {
              endpoints: { market_data: "https://api.marketdata.com/v1", trading: "https://api.broker.com/v2" },
              settings: { riskLimits: { maxPosition: 10000, stopLoss: 0.05 } },
            },
            sampleData: { symbol: "AAPL", price: 150.25, volume: 1000000, timestamp: Date.now() },
          },
        ],
        documentation: "# Financial Trading Integration\n\nThis integration connects to trading systems...",
      },
      {
        id: "scientific-research",
        name: "Scientific Research Integration",
        description: "Integration for research data, laboratory systems, and scientific databases",
        category: IntegrationCategory.SCIENTIFIC,
        template: {
          name: "Research Data System",
          category: IntegrationCategory.SCIENTIFIC,
          capabilities: [
            {
              type: "data_source",
              name: "Laboratory Data",
              description: "Laboratory instrument data and measurements",
            },
            {
              type: "processor",
              name: "Statistical Analysis",
              description: "Statistical analysis and data processing",
            },
          ],
        },
        examples: [
          {
            name: "Laboratory Information System",
            description: "Integration with laboratory management systems",
            config: {
              endpoints: { lims: "https://api.lims.research.edu/v1" },
              settings: { dataValidation: true, qualityControl: "strict" },
            },
            sampleData: { experiment_id: "EXP-2024-001", measurements: [1.23, 4.56, 7.89], units: "mg/L" },
          },
        ],
        documentation: "# Scientific Research Integration\n\nThis integration provides access to research data...",
      },
    ]

    templates.forEach((template) => this.templates.set(template.id, template))
  }

  private initializeSampleIntegrations() {
    // Create sample integrations from templates
    const sampleIntegrations = [
      {
        templateId: "aerospace-flight-data",
        name: "Demo Flight Tracker",
        config: {
          endpoints: { api: "https://demo.flightapi.com" },
          settings: { demo: true, updateInterval: 10000 },
        },
      },
      {
        templateId: "financial-trading",
        name: "Demo Trading System",
        config: {
          endpoints: { market: "https://demo.marketapi.com" },
          settings: { demo: true, paperTrading: true },
        },
      },
    ]

    sampleIntegrations.forEach((sample) => {
      const template = this.templates.get(sample.templateId)
      if (template) {
        this.createIntegrationFromTemplate(sample.templateId, sample.name, sample.config)
      }
    })
  }

  // Integration Management
  async createIntegration(integration: Omit<Integration, "id" | "created" | "lastUpdated">): Promise<string> {
    const integrationId = `integration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const newIntegration: Integration = {
      ...integration,
      id: integrationId,
      created: Date.now(),
      lastUpdated: Date.now(),
    }

    this.integrations.set(integrationId, newIntegration)

    timelineObservability.logEvent(
      EventType.SYSTEM_ERROR, // Using existing event type
      "integration_framework",
      `Integration created: ${integration.name}`,
      {
        severity: "info",
        metadata: { integrationId, category: integration.category },
        tags: ["integration", "created"],
      },
    )

    return integrationId
  }

  async createIntegrationFromTemplate(templateId: string, name: string, config: IntegrationConfig): Promise<string> {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    const integration: Omit<Integration, "id" | "created" | "lastUpdated"> = {
      name,
      description: template.template.description || `Integration based on ${template.name}`,
      version: "1.0.0",
      category: template.category,
      provider: "LogLineBrowser",
      status: "active",
      config,
      capabilities: template.template.capabilities || [],
      dependencies: [],
      metadata: { templateId },
    }

    return await this.createIntegration(integration)
  }

  getIntegrations(category?: IntegrationCategory): Integration[] {
    const integrations = Array.from(this.integrations.values())
    return category ? integrations.filter((i) => i.category === category) : integrations
  }

  getIntegration(integrationId: string): Integration | undefined {
    return this.integrations.get(integrationId)
  }

  async updateIntegration(integrationId: string, updates: Partial<Integration>): Promise<void> {
    const integration = this.integrations.get(integrationId)
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`)
    }

    const updatedIntegration = {
      ...integration,
      ...updates,
      lastUpdated: Date.now(),
    }

    this.integrations.set(integrationId, updatedIntegration)

    timelineObservability.logEvent(
      EventType.SYSTEM_ERROR,
      "integration_framework",
      `Integration updated: ${integration.name}`,
      {
        severity: "info",
        metadata: { integrationId, updates: Object.keys(updates) },
        tags: ["integration", "updated"],
      },
    )
  }

  async deleteIntegration(integrationId: string): Promise<void> {
    const integration = this.integrations.get(integrationId)
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`)
    }

    this.integrations.delete(integrationId)

    timelineObservability.logEvent(
      EventType.SYSTEM_ERROR,
      "integration_framework",
      `Integration deleted: ${integration.name}`,
      {
        severity: "warning",
        metadata: { integrationId },
        tags: ["integration", "deleted"],
      },
    )
  }

  // Integration Execution
  async executeIntegration(
    integrationId: string,
    operation: string,
    input: any,
    options: { timeout?: number; retries?: number } = {},
  ): Promise<string> {
    const integration = this.integrations.get(integrationId)
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`)
    }

    if (integration.status !== "active") {
      throw new Error(`Integration ${integrationId} is not active`)
    }

    // Create span for integration execution
    const spanOperation: SpanOperation = {
      id: `integration_op_${Date.now()}`,
      description: `Execute ${operation} on ${integration.name}`,
      operation: async () => {
        return await this.performIntegrationOperation(integrationId, operation, input, options)
      },
      rollback: async () => {
        // Integration-specific rollback logic would go here
        console.log(`Rolling back integration operation: ${operation}`)
      },
      simulate: async () => {
        return {
          changes: [
            {
              type: "create" as const,
              target: `integration_${integrationId}`,
              after: `Execute ${operation} with input: ${JSON.stringify(input)}`,
            },
          ],
          impact: "medium" as const,
          reversible: true,
        }
      },
    }

    const spanId = await spanEngine.createSpan(SpanType.IO_OPERATION, spanOperation)

    // Create execution record
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const execution: IntegrationExecution = {
      id: executionId,
      integrationId,
      spanId,
      operation,
      input,
      status: "pending",
      startTime: Date.now(),
      metrics: {
        duration: 0,
        dataProcessed: 0,
        apiCalls: 0,
        errors: 0,
        retries: 0,
      },
    }

    this.executions.set(executionId, execution)

    return spanId
  }

  private async performIntegrationOperation(
    integrationId: string,
    operation: string,
    input: any,
    options: { timeout?: number; retries?: number },
  ): Promise<any> {
    const integration = this.integrations.get(integrationId)!
    const execution = Array.from(this.executions.values()).find(
      (e) => e.integrationId === integrationId && e.operation === operation,
    )

    if (execution) {
      execution.status = "running"
    }

    try {
      // Simulate integration operation
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

      // Simulate different outcomes based on integration category
      let result: any
      switch (integration.category) {
        case IntegrationCategory.AEROSPACE:
          result = {
            aircraft_data: {
              id: input.aircraft_id || "N12345",
              altitude: 35000 + Math.random() * 5000,
              speed: 450 + Math.random() * 50,
              heading: Math.random() * 360,
              timestamp: Date.now(),
            },
          }
          break
        case IntegrationCategory.FINANCIAL:
          result = {
            market_data: {
              symbol: input.symbol || "DEMO",
              price: 100 + Math.random() * 50,
              volume: Math.floor(Math.random() * 1000000),
              change: (Math.random() - 0.5) * 10,
              timestamp: Date.now(),
            },
          }
          break
        case IntegrationCategory.SCIENTIFIC:
          result = {
            experiment_data: {
              id: input.experiment_id || "EXP-DEMO",
              measurements: Array.from({ length: 10 }, () => Math.random() * 100),
              quality_score: 0.8 + Math.random() * 0.2,
              timestamp: Date.now(),
            },
          }
          break
        default:
          result = { status: "success", data: input, timestamp: Date.now() }
      }

      if (execution) {
        execution.status = "completed"
        execution.endTime = Date.now()
        execution.output = result
        execution.metrics.duration = execution.endTime - execution.startTime
        execution.metrics.dataProcessed = JSON.stringify(result).length
        execution.metrics.apiCalls = 1
      }

      return result
    } catch (error) {
      if (execution) {
        execution.status = "failed"
        execution.endTime = Date.now()
        execution.error = String(error)
        execution.metrics.errors = 1
      }
      throw error
    }
  }

  // Template Management
  getTemplates(category?: IntegrationCategory): IntegrationTemplate[] {
    const templates = Array.from(this.templates.values())
    return category ? templates.filter((t) => t.category === category) : templates
  }

  getTemplate(templateId: string): IntegrationTemplate | undefined {
    return this.templates.get(templateId)
  }

  // Execution History
  getExecutions(integrationId?: string): IntegrationExecution[] {
    const executions = Array.from(this.executions.values())
    return integrationId ? executions.filter((e) => e.integrationId === integrationId) : executions
  }

  getExecution(executionId: string): IntegrationExecution | undefined {
    return this.executions.get(executionId)
  }

  // Plugin System
  registerPlugin(plugin: IntegrationPlugin): void {
    this.plugins.set(plugin.id, plugin)
    timelineObservability.logEvent(
      EventType.SYSTEM_ERROR,
      "integration_framework",
      `Plugin registered: ${plugin.name}`,
      {
        severity: "info",
        metadata: { pluginId: plugin.id, version: plugin.version },
        tags: ["plugin", "registered"],
      },
    )
  }

  getPlugins(): IntegrationPlugin[] {
    return Array.from(this.plugins.values())
  }

  // Integration Health Check
  async checkIntegrationHealth(integrationId: string): Promise<{
    status: "healthy" | "degraded" | "unhealthy"
    checks: Array<{ name: string; status: "pass" | "fail"; message: string }>
    lastCheck: number
  }> {
    const integration = this.integrations.get(integrationId)
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`)
    }

    const checks = [
      {
        name: "Integration Status",
        status: integration.status === "active" ? ("pass" as const) : ("fail" as const),
        message: `Status: ${integration.status}`,
      },
      {
        name: "Recent Executions",
        status: this.getExecutions(integrationId).length > 0 ? ("pass" as const) : ("fail" as const),
        message: `${this.getExecutions(integrationId).length} executions found`,
      },
      {
        name: "Error Rate",
        status: this.calculateErrorRate(integrationId) < 0.1 ? ("pass" as const) : ("fail" as const),
        message: `Error rate: ${(this.calculateErrorRate(integrationId) * 100).toFixed(1)}%`,
      },
    ]

    const failedChecks = checks.filter((check) => check.status === "fail").length
    const status = failedChecks === 0 ? "healthy" : failedChecks <= 1 ? "degraded" : "unhealthy"

    return {
      status,
      checks,
      lastCheck: Date.now(),
    }
  }

  private calculateErrorRate(integrationId: string): number {
    const executions = this.getExecutions(integrationId)
    if (executions.length === 0) return 0

    const errors = executions.filter((e) => e.status === "failed").length
    return errors / executions.length
  }
}

export interface IntegrationPlugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  capabilities: string[]
  install: () => Promise<void>
  uninstall: () => Promise<void>
  execute: (operation: string, input: any) => Promise<any>
}

// Global integration framework instance
export const integrationFramework = new IntegrationFramework()
