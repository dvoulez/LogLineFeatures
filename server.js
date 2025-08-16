const fastify = require("fastify")({ logger: true })
const fs = require("fs").promises
const path = require("path")
const crypto = require("crypto")

// Initialize data directory
const DATA_DIR = path.join(__dirname, "data")
const BUNDLES_DIR = path.join(DATA_DIR, "bundles")

async function initializeDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.mkdir(BUNDLES_DIR, { recursive: true })
}

// In-memory storage (replace with SQLite for production)
const timeline = []
const runs = new Map()
const contracts = new Map()
let spanCounter = 0
let runCounter = 0
let contractCounter = 0

// Mock tools
const mockTools = {
  "web.fetch": async (args) => {
    await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate delay
    return {
      status: 200,
      headers: { "content-type": "text/html" },
      body: `<html><head><title>Demo Page</title></head><body><h1>Mock Content for ${args.url}</h1><p>This is simulated content from ${args.url}</p></body></html>`,
    }
  },
  "web.summarize": async (args) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    return {
      summary: `This page discusses ${args.content.substring(0, 50)}... Key points include web development, automation, and browser interfaces.`,
      citations: [
        { source: args.url || "unknown", snippet: "Key information about web automation" },
        { source: args.url || "unknown", snippet: "Browser interface implementation details" },
      ],
    }
  },
  "rag.query": async (args) => {
    await new Promise((resolve) => setTimeout(resolve, 600))
    return {
      hits: [
        {
          source: "docs/automation.md",
          snippet: `Results for "${args.query}": Automation best practices...`,
          score: 0.95,
        },
        { source: "docs/security.md", snippet: `Security considerations for "${args.query}"...`, score: 0.87 },
      ],
    }
  },
  "computer.plan": async (args) => {
    await new Promise((resolve) => setTimeout(resolve, 400))
    return {
      plan: [
        { action: "navigate", target: args.url || "https://example.com" },
        { action: "click", selector: args.selector || 'button[type="submit"]' },
        { action: "type", selector: 'input[name="email"]', text: args.email || "test@example.com" },
      ],
      estimated_time: 3000,
      risk_level: "low",
    }
  },
  "computer.execute": async (args) => {
    await new Promise((resolve) => setTimeout(resolve, 1200))
    return {
      executed_steps: args.plan || [],
      success: true,
      screenshot:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      final_state: { url: args.url || "https://example.com", title: "Demo Page" },
    }
  },
}

// Utility functions
function generateId() {
  return crypto.randomBytes(8).toString("hex")
}

function createSpan(type, tool, args, runId, parentId = null) {
  const span = {
    id: `span_${++spanCounter}`,
    type,
    tool,
    args,
    out: null,
    status: "created",
    meta: {
      origin: "ui",
      pii: false,
      cost: Math.random() * 0.1,
      hash: generateId(),
      run_id: runId,
      parent_id: parentId,
      timestamps: {
        created: new Date().toISOString(),
        started: null,
        completed: null,
      },
    },
  }
  timeline.push(span)
  return span
}

// API Routes
fastify.register(async (fastify) => {
  // CORS
  fastify.addHook("preHandler", async (request, reply) => {
    reply.header("Access-Control-Allow-Origin", "*")
    reply.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    if (request.method === "OPTIONS") {
      reply.code(200).send()
    }
  })

  // POST /spans
  fastify.post("/spans", async (request, reply) => {
    const { type, tool, args, run_id, parent_id } = request.body
    const span = createSpan(type, tool, args, run_id, parent_id)
    return { span }
  })

  // POST /runs
  fastify.post("/runs", async (request, reply) => {
    const { plan, mode = "simulate" } = request.body
    const runId = `run_${++runCounter}`

    const run = {
      id: runId,
      status: mode === "simulate" ? "simulated" : "running",
      plan,
      spans: [],
      created: new Date().toISOString(),
      mode,
    }

    // Create spans from plan
    for (const step of plan) {
      const span = createSpan("exec", step.tool, step.args, runId)

      if (mode === "simulate") {
        span.status = "simulated"
        span.meta.timestamps.started = new Date().toISOString()
        span.meta.timestamps.completed = new Date().toISOString()

        // Simulate execution
        if (mockTools[step.tool]) {
          span.out = await mockTools[step.tool](step.args)
        }
      }

      run.spans.push(span.id)
    }

    runs.set(runId, run)
    return { run }
  })

  // GET /runs/:id
  fastify.get("/runs/:id", async (request, reply) => {
    const run = runs.get(request.params.id)
    if (!run) {
      reply.code(404).send({ error: "Run not found" })
      return
    }

    // Get spans for this run
    const runSpans = timeline.filter((span) => span.meta.run_id === run.id)

    return {
      ...run,
      spans: runSpans,
    }
  })

  // GET /runs/:id/bundle
  fastify.get("/runs/:id/bundle", async (request, reply) => {
    const run = runs.get(request.params.id)
    if (!run) {
      reply.code(404).send({ error: "Run not found" })
      return
    }

    const runSpans = timeline.filter((span) => span.meta.run_id === run.id)

    // Create bundle
    const bundle = {
      plan: `# LogLine Plan - ${run.id}\n${JSON.stringify(run.plan, null, 2)}`,
      spans: runSpans,
      contract: contracts.get(run.contract_id) || null,
      hashes: runSpans.map((span) => `${span.id}:${span.meta.hash}`),
      signature: `fake_signature_${generateId()}`,
    }

    // Save bundle to disk
    const bundlePath = path.join(BUNDLES_DIR, `${run.id}.json`)
    await fs.writeFile(bundlePath, JSON.stringify(bundle, null, 2))

    reply.header("Content-Type", "application/json")
    reply.header("Content-Disposition", `attachment; filename="${run.id}_bundle.json"`)
    return bundle
  })

  // GET /timeline
  fastify.get("/timeline", async (request, reply) => {
    const { type, status, run_id } = request.query

    let filteredTimeline = [...timeline]

    if (type) {
      filteredTimeline = filteredTimeline.filter((span) => span.type === type)
    }
    if (status) {
      filteredTimeline = filteredTimeline.filter((span) => span.status === status)
    }
    if (run_id) {
      filteredTimeline = filteredTimeline.filter((span) => span.meta.run_id === run_id)
    }

    return {
      spans: filteredTimeline.sort((a, b) => new Date(b.meta.timestamps.created) - new Date(a.meta.timestamps.created)),
    }
  })

  // POST /contracts/preview
  fastify.post("/contracts/preview", async (request, reply) => {
    const { plan, risk, est_cost, est_time_sec } = request.body

    const contractId = `contract_${++contractCounter}`
    const contract = {
      id: contractId,
      title: `Execution Contract - ${plan.length} steps`,
      summary: `This contract authorizes execution of ${plan.length} automation steps with estimated cost of €${est_cost.toFixed(2)} and ${est_time_sec}s duration.`,
      details: {
        scope: plan.map((step) => `${step.tool}(${Object.keys(step.args).join(", ")})`),
        risk_level: risk,
        estimated_cost: est_cost,
        estimated_time: est_time_sec,
        pii_handling: plan.some((step) => step.args.email || step.args.personal_data),
        benefits: `Automated execution will save approximately ${Math.round(est_time_sec / 60)} minutes of manual work.`,
      },
      status: "pending",
      created: new Date().toISOString(),
    }

    contracts.set(contractId, contract)
    return { contract }
  })

  // POST /contracts/approve
  fastify.post("/contracts/approve", async (request, reply) => {
    const { contract_id, approved } = request.body

    const contract = contracts.get(contract_id)
    if (!contract) {
      reply.code(404).send({ error: "Contract not found" })
      return
    }

    contract.status = approved ? "approved" : "rejected"
    contract.approved_at = new Date().toISOString()

    return { contract }
  })

  // POST /identity/credentials
  fastify.post("/identity/credentials", async (request, reply) => {
    const { provider, credentials } = request.body

    // Mock credential validation
    return {
      valid: true,
      identity: {
        id: generateId(),
        provider,
        verified: true,
        permissions: ["read", "write", "execute"],
      },
    }
  })

  // Execute run (approve → execute)
  fastify.post("/runs/:id/execute", async (request, reply) => {
    const run = runs.get(request.params.id)
    if (!run) {
      reply.code(404).send({ error: "Run not found" })
      return
    }

    run.status = "running"

    // Execute spans
    for (const spanId of run.spans) {
      const span = timeline.find((s) => s.id === spanId)
      if (span && span.status === "simulated") {
        span.status = "running"
        span.meta.timestamps.started = new Date().toISOString()

        // Execute with mock tool
        if (mockTools[span.tool]) {
          span.out = await mockTools[span.tool](span.args)
        }

        span.status = "completed"
        span.meta.timestamps.completed = new Date().toISOString()
      }
    }

    run.status = "completed"
    return { run }
  })
})

// Start server
const start = async () => {
  try {
    await initializeDataDir()
    await fastify.listen({ port: 4123, host: "0.0.0.0" })
    console.log("🚀 LogLineBrowser Runtime running on http://localhost:4123")
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
