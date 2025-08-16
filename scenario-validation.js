// Validação de Cenários - Testes End-to-End
// Executa todos os cenários e valida flows + ops + ID

const { spawn } = require("child_process")
const fs = require("fs")
const path = require("path")

class ScenarioValidator {
  constructor() {
    this.results = []
    this.runtimeProcess = null
  }

  async startRuntime() {
    console.log("🚀 Iniciando runtime Rust...")
    this.runtimeProcess = spawn("cargo", ["run"], {
      cwd: "runtime",
      stdio: "pipe",
    })

    // Aguardar runtime inicializar
    await new Promise((resolve) => setTimeout(resolve, 3000))
    console.log("✅ Runtime iniciado")
  }

  async stopRuntime() {
    if (this.runtimeProcess) {
      this.runtimeProcess.kill()
      console.log("🛑 Runtime parado")
    }
  }

  async runScenario(scenarioFile, mode = "flows") {
    console.log(`\n📋 Executando cenário: ${scenarioFile}`)

    const command = mode === "ops" ? "ops" : "flows"
    const subcommand = mode === "ops" ? "timeline" : "run"

    return new Promise((resolve, reject) => {
      const args =
        mode === "ops"
          ? [command, subcommand, "--mode=ops", "--limit=10"]
          : [command, subcommand, scenarioFile, "--simulate"]

      const process = spawn("cargo", ["run", "--", ...args], {
        cwd: "runtime",
        stdio: "pipe",
      })

      let stdout = ""
      let stderr = ""

      process.stdout.on("data", (data) => {
        stdout += data.toString()
      })

      process.stderr.on("data", (data) => {
        stderr += data.toString()
      })

      process.on("close", (code) => {
        const result = {
          scenario: scenarioFile,
          mode,
          exitCode: code,
          stdout,
          stderr,
          success: code === 0,
          timestamp: new Date().toISOString(),
        }

        this.results.push(result)

        if (code === 0) {
          console.log(`✅ ${scenarioFile} - SUCESSO`)
          resolve(result)
        } else {
          console.log(`❌ ${scenarioFile} - FALHOU (código: ${code})`)
          console.log(`Erro: ${stderr}`)
          resolve(result) // Não rejeitar para continuar outros testes
        }
      })
    })
  }

  async validateIntegration() {
    console.log("\n🔍 Validando integração flows + ops + ID...")

    // Testar que flows e ops escrevem na mesma timeline
    const flowsResult = await this.runScenario("examples/humano_comum_minicontrato.logline", "flows")
    const opsResult = await this.runScenario("examples/ops_diagnostico_p95.logline", "ops")

    // Verificar timeline unificada
    const timelineCheck = await this.runScenario("", "ops") // ops timeline command

    const integration = {
      flows_success: flowsResult.success,
      ops_success: opsResult.success,
      timeline_unified: timelineCheck.stdout.includes("Observe Spans") && timelineCheck.stdout.includes("Exec Spans"),
      timestamp: new Date().toISOString(),
    }

    console.log("📊 Resultado da integração:", integration)
    return integration
  }

  async runAllScenarios() {
    console.log("🎯 Iniciando validação de cenários...\n")

    try {
      await this.startRuntime()

      // Cenários por persona
      const scenarios = [
        { file: "examples/humano_comum_minicontrato.logline", mode: "flows", persona: "Humano Comum" },
        { file: "examples/ops_diagnostico_p95.logline", mode: "ops", persona: "Ops" },
        { file: "examples/cientifico_alphafold.logline", mode: "flows", persona: "Científico" },
        { file: "examples/id_licenciamento_dados.logline", mode: "flows", persona: "ID" },
      ]

      for (const scenario of scenarios) {
        console.log(`\n👤 Testando persona: ${scenario.persona}`)
        await this.runScenario(scenario.file, scenario.mode)
      }

      // Validar integração
      const integration = await this.validateIntegration()

      // Gerar relatório
      await this.generateReport(integration)
    } finally {
      await this.stopRuntime()
    }
  }

  async generateReport(integration) {
    const report = {
      timestamp: new Date().toISOString(),
      total_scenarios: this.results.length,
      successful: this.results.filter((r) => r.success).length,
      failed: this.results.filter((r) => r.success === false).length,
      integration_status: integration,
      scenarios: this.results,
      summary: {
        humano_comum: this.results.find((r) => r.scenario.includes("humano_comum"))?.success || false,
        ops: this.results.find((r) => r.scenario.includes("ops_diagnostico"))?.success || false,
        cientifico: this.results.find((r) => r.scenario.includes("cientifico_alphafold"))?.success || false,
        id: this.results.find((r) => r.scenario.includes("id_licenciamento"))?.success || false,
      },
    }

    const reportPath = "test/scenario-report.json"
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    console.log("\n📋 RELATÓRIO FINAL:")
    console.log(`✅ Cenários bem-sucedidos: ${report.successful}/${report.total_scenarios}`)
    console.log(`❌ Cenários falharam: ${report.failed}/${report.total_scenarios}`)
    console.log(`🔗 Integração unificada: ${integration.timeline_unified ? "OK" : "FALHOU"}`)
    console.log(`📄 Relatório salvo em: ${reportPath}`)

    return report
  }
}

// Executar validação se chamado diretamente
if (require.main === module) {
  const validator = new ScenarioValidator()
  validator
    .runAllScenarios()
    .then(() => {
      console.log("\n🎉 Validação de cenários concluída!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("\n💥 Erro na validação:", error)
      process.exit(1)
    })
}

module.exports = ScenarioValidator
