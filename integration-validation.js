const fs = require("fs")
const path = require("path")
const { execSync, spawn } = require("child_process")

class LogLineBrowserTester {
  constructor() {
    this.runtimeUrl = process.env.RUNTIME_URL || "http://localhost:4123"
    this.results = []
    this.errors = []
  }

  async validateRuntimeHealth() {
    console.log("🔍 Validating runtime health...")
    try {
      const response = await fetch(`${this.runtimeUrl}/health`)
      if (response.ok) {
        console.log("✅ Runtime is healthy")
        return true
      }
    } catch (error) {
      console.log("❌ Runtime not accessible:", error.message)
      return false
    }
  }

  async testExampleFiles() {
    console.log("📋 Testing .logline example files...")
    const exampleFiles = [
      "humano_comum_minicontrato.logline",
      "ops_diagnostico_p95.logline",
      "cientifico_alphafold.logline",
      "id_licenciamento_dados.logline",
    ]

    for (const file of exampleFiles) {
      try {
        const filePath = path.join("examples", file)
        if (fs.existsSync(filePath)) {
          console.log(`✅ ${file} exists`)

          // Test CLI simulation
          const result = execSync(`./scripts/logline-flows simulate ${filePath}`, { encoding: "utf8" })
          if (result.includes("contract_id")) {
            console.log(`✅ ${file} CLI simulation works`)
          }
        } else {
          console.log(`❌ ${file} missing`)
          this.errors.push(`Missing example file: ${file}`)
        }
      } catch (error) {
        console.log(`❌ ${file} CLI test failed:`, error.message)
        this.errors.push(`CLI test failed for ${file}: ${error.message}`)
      }
    }
  }

  async testPIIGovernance() {
    console.log("🔒 Testing PII governance...")
    try {
      // Create a test plan with PII
      const testPlan = {
        spans: [
          {
            type: "exec.web.fetch",
            tool: "web.fetch",
            args: { url: "https://example.com/user-data" },
            meta: { pii: true },
          },
        ],
      }

      const response = await fetch(`${this.runtimeUrl}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: testPlan }),
      })

      const result = await response.json()
      if (result.status === "waiting_approval") {
        console.log("✅ PII governance blocks execution correctly")
        return true
      }
    } catch (error) {
      console.log("❌ PII governance test failed:", error.message)
      this.errors.push(`PII governance test failed: ${error.message}`)
    }
  }

  async testContractWorkflow() {
    console.log("📝 Testing contract workflow...")
    try {
      // Test contract preview
      const response = await fetch(`${this.runtimeUrl}/contracts/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: { spans: [{ type: "exec.web.fetch", tool: "web.fetch", args: { url: "https://example.com" } }] },
        }),
      })

      if (response.ok) {
        const contract = await response.json()
        console.log("✅ Contract preview works")

        // Test contract approval
        const approveResponse = await fetch(`${this.runtimeUrl}/contracts/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contract_id: contract.id }),
        })

        if (approveResponse.ok) {
          console.log("✅ Contract approval works")
          return true
        }
      }
    } catch (error) {
      console.log("❌ Contract workflow test failed:", error.message)
      this.errors.push(`Contract workflow test failed: ${error.message}`)
    }
  }

  async testTimelineIntegration() {
    console.log("📊 Testing timeline integration...")
    try {
      const response = await fetch(`${this.runtimeUrl}/timeline`)
      if (response.ok) {
        const timeline = await response.json()
        console.log(`✅ Timeline accessible with ${timeline.length} events`)
        return true
      }
    } catch (error) {
      console.log("❌ Timeline test failed:", error.message)
      this.errors.push(`Timeline test failed: ${error.message}`)
    }
  }

  async runAllTests() {
    console.log("🚀 Starting LogLineBrowser O4+ Integration Tests\n")

    const isHealthy = await this.validateRuntimeHealth()
    if (!isHealthy) {
      console.log("❌ Cannot proceed without healthy runtime")
      return false
    }

    await this.testExampleFiles()
    await this.testPIIGovernance()
    await this.testContractWorkflow()
    await this.testTimelineIntegration()

    console.log("\n📋 Test Summary:")
    console.log(`✅ Successful tests: ${this.results.length}`)
    console.log(`❌ Failed tests: ${this.errors.length}`)

    if (this.errors.length > 0) {
      console.log("\nErrors:")
      this.errors.forEach((error) => console.log(`  - ${error}`))
    }

    return this.errors.length === 0
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new LogLineBrowserTester()
  tester.runAllTests().then((success) => {
    process.exit(success ? 0 : 1)
  })
}

module.exports = LogLineBrowserTester
