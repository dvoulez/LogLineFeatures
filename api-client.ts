// Generated API client from OpenAPI contract
const API_BASE = "http://localhost:4123"

export interface Span {
  id: string
  type: "exec" | "ui" | "approval" | "observe"
  tool: string
  args: Record<string, any>
  out: any
  status: "created" | "simulated" | "running" | "completed" | "failed"
  meta: {
    origin: string
    pii: boolean
    cost: number
    hash: string
    run_id: string
    parent_id?: string
    timestamps: {
      created: string
      started?: string
      completed?: string
    }
  }
}

export interface Run {
  id: string
  status: "simulated" | "running" | "completed" | "failed" | "waiting_approval"
  plan: Array<{ tool: string; args: Record<string, any> }>
  spans: Span[]
  created: string
  mode: string
  contract_id?: string
}

export interface Contract {
  id: string
  title: string
  summary: string
  details: {
    scope: string[]
    risk_level: string
    estimated_cost: number
    estimated_time: number
    pii_handling: boolean
    benefits: string
  }
  status: "pending" | "approved" | "rejected"
  created: string
  approved_at?: string
}

class ApiClient {
  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async createSpan(span: Omit<Span, "id" | "out" | "status" | "meta"> & { run_id: string; parent_id?: string }) {
    return this.request("/spans", {
      method: "POST",
      body: JSON.stringify(span),
    })
  }

  async createRun(plan: Array<{ tool: string; args: Record<string, any> }>, mode: "simulate" | "execute" = "simulate") {
    return this.request("/runs", {
      method: "POST",
      body: JSON.stringify({ plan, mode }),
    })
  }

  async getRun(id: string): Promise<Run> {
    return this.request(`/runs/${id}`)
  }

  async getRunBundle(id: string) {
    const response = await fetch(`${API_BASE}/runs/${id}/bundle`)
    return response.blob()
  }

  async getTimeline(filters: { type?: string; status?: string; run_id?: string } = {}) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })

    return this.request(`/timeline?${params}`)
  }

  async previewContract(
    plan: Array<{ tool: string; args: Record<string, any> }>,
    risk: string,
    estCost: number,
    estTime: number,
  ): Promise<{ contract: Contract }> {
    return this.request("/contracts/preview", {
      method: "POST",
      body: JSON.stringify({
        plan,
        risk,
        est_cost: estCost,
        est_time_sec: estTime,
      }),
    })
  }

  async approveContract(contractId: string, approved: boolean): Promise<{ contract: Contract }> {
    return this.request("/contracts/approve", {
      method: "POST",
      body: JSON.stringify({
        contract_id: contractId,
        approved,
      }),
    })
  }

  async executeRun(id: string) {
    return this.request(`/runs/${id}/execute`, {
      method: "POST",
    })
  }

  async validateCredentials(provider: string, credentials: Record<string, any>) {
    return this.request("/identity/credentials", {
      method: "POST",
      body: JSON.stringify({ provider, credentials }),
    })
  }
}

export const apiClient = new ApiClient()
