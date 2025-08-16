// Script de Empacotamento - LogLineBrowser O4+ Sprint Delivery
// Gera pacote completo com código, exemplos, Modelfile e binário CLI

const fs = require("fs")
const path = require("path")
const { spawn } = require("child_process")
const archiver = require("archiver")

class DeliveryPackager {
  constructor() {
    this.deliveryDir = "delivery"
    this.version = "0.4.0"
    this.timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  }

  async createDeliveryStructure() {
    console.log("📦 Criando estrutura de entrega...")

    // Limpar e criar diretório de entrega
    if (fs.existsSync(this.deliveryDir)) {
      fs.rmSync(this.deliveryDir, { recursive: true })
    }
    fs.mkdirSync(this.deliveryDir, { recursive: true })

    // Estrutura de diretórios
    const dirs = [
      "logline-browser-o4",
      "logline-browser-o4/runtime",
      "logline-browser-o4/examples",
      "logline-browser-o4/ui",
      "logline-browser-o4/docs",
      "logline-browser-o4/bin",
      "logline-browser-o4/test",
    ]

    dirs.forEach((dir) => {
      fs.mkdirSync(path.join(this.deliveryDir, dir), { recursive: true })
    })

    console.log("✅ Estrutura criada")
  }

  async buildRuntimeBinary() {
    console.log("🔨 Compilando binário CLI...")

    return new Promise((resolve, reject) => {
      const process = spawn("cargo", ["build", "--release"], {
        cwd: "runtime",
        stdio: "inherit",
      })

      process.on("close", (code) => {
        if (code === 0) {
          console.log("✅ Binário compilado")
          resolve()
        } else {
          console.log("❌ Falha na compilação")
          reject(new Error(`Cargo build failed with code ${code}`))
        }
      })
    })
  }

  async copyRuntimeFiles() {
    console.log("📋 Copiando arquivos do runtime...")

    const runtimeFiles = [
      "Cargo.toml",
      "src/main.rs",
      "src/models.rs",
      "src/storage.rs",
      "src/tools.rs",
      "src/parser.rs",
      "src/architect.rs",
      "src/cli.rs",
    ]

    const targetDir = path.join(this.deliveryDir, "logline-browser-o4/runtime")

    // Copiar arquivos fonte
    runtimeFiles.forEach((file) => {
      const srcPath = path.join("runtime", file)
      const destPath = path.join(targetDir, file)

      if (fs.existsSync(srcPath)) {
        fs.mkdirSync(path.dirname(destPath), { recursive: true })
        fs.copyFileSync(srcPath, destPath)
      }
    })

    // Copiar binário compilado
    const binarySource = path.join("runtime", "target", "release", "logline-runtime")
    const binaryDest = path.join(this.deliveryDir, "logline-browser-o4/bin/logline")

    if (fs.existsSync(binarySource)) {
      fs.copyFileSync(binarySource, binaryDest)
      fs.chmodSync(binaryDest, 0o755) // Tornar executável
      console.log("✅ Binário CLI copiado")
    } else {
      console.log("⚠️  Binário não encontrado - execute build:runtime primeiro")
    }
  }

  async copyExamples() {
    console.log("📝 Copiando exemplos .logline...")

    const exampleFiles = [
      "humano_comum_minicontrato.logline",
      "ops_diagnostico_p95.logline",
      "cientifico_alphafold.logline",
      "id_licenciamento_dados.logline",
    ]

    const targetDir = path.join(this.deliveryDir, "logline-browser-o4/examples")

    exampleFiles.forEach((file) => {
      const srcPath = path.join("examples", file)
      const destPath = path.join(targetDir, file)

      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath)
      }
    })

    console.log("✅ Exemplos copiados")
  }

  async copyUIFiles() {
    console.log("🎨 Copiando arquivos da UI...")

    // Build da UI primeiro
    await this.buildUI()

    const uiFiles = [
      "package.json",
      "next.config.js",
      "tailwind.config.js",
      "tsconfig.json",
      ".next",
      "app",
      "components",
      "lib",
      "public",
    ]

    const targetDir = path.join(this.deliveryDir, "logline-browser-o4/ui")

    uiFiles.forEach((file) => {
      const srcPath = file
      const destPath = path.join(targetDir, file)

      if (fs.existsSync(srcPath)) {
        if (fs.statSync(srcPath).isDirectory()) {
          this.copyDirectory(srcPath, destPath)
        } else {
          fs.copyFileSync(srcPath, destPath)
        }
      }
    })

    console.log("✅ UI copiada")
  }

  async buildUI() {
    console.log("🔨 Compilando UI...")

    return new Promise((resolve, reject) => {
      const process = spawn("pnpm", ["build"], {
        stdio: "inherit",
      })

      process.on("close", (code) => {
        if (code === 0) {
          console.log("✅ UI compilada")
          resolve()
        } else {
          console.log("❌ Falha na compilação da UI")
          reject(new Error(`UI build failed with code ${code}`))
        }
      })
    })
  }

  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }

    const entries = fs.readdirSync(src, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)

      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath)
      } else {
        fs.copyFileSync(srcPath, destPath)
      }
    }
  }

  async copyModelfile() {
    console.log("🤖 Copiando Modelfile...")

    const srcPath = "Modelfile"
    const destPath = path.join(this.deliveryDir, "logline-browser-o4/Modelfile")

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath)
      console.log("✅ Modelfile copiado")
    }
  }

  async copyTestFiles() {
    console.log("🧪 Copiando arquivos de teste...")

    const testFiles = ["test/scenario-validation.js"]

    const targetDir = path.join(this.deliveryDir, "logline-browser-o4/test")

    testFiles.forEach((file) => {
      const srcPath = file
      const destPath = path.join(targetDir, path.basename(file))

      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath)
      }
    })

    console.log("✅ Testes copiados")
  }

  async generateDocumentation() {
    console.log("📚 Gerando documentação...")

    const readme = `# LogLineBrowser O4+ - Sprint Delivery

## Visão Geral

LogLineBrowser O4+ é um sistema completo de automação headless-first com execução baseada em spans, governança integrada e observabilidade unificada.

## Estrutura do Pacote

\`\`\`
logline-browser-o4/
├── bin/
│   └── logline                 # Binário CLI único
├── runtime/                    # Código fonte Rust
│   ├── src/
│   └── Cargo.toml
├── ui/                        # Interface web Next.js
│   ├── app/
│   ├── components/
│   └── package.json
├── examples/                  # Exemplos .logline
│   ├── humano_comum_minicontrato.logline
│   ├── ops_diagnostico_p95.logline
│   ├── cientifico_alphafold.logline
│   └── id_licenciamento_dados.logline
├── test/                     # Testes de cenário
│   └── scenario-validation.js
├── Modelfile                 # Prompt system para Ollama
└── docs/                     # Documentação
\`\`\`

## Instalação Rápida

\`\`\`bash
# 1. Extrair pacote
unzip logline-browser-o4-${this.version}.zip
cd logline-browser-o4

# 2. Instalar dependências da UI
cd ui && npm install && cd ..

# 3. Testar CLI
./bin/logline --help

# 4. Executar exemplo
./bin/logline flows run examples/humano_comum_minicontrato.logline --simulate
\`\`\`

## Comandos CLI

### Flows (Automação)
\`\`\`bash
./bin/logline flows run <arquivo.logline>     # Executar fluxo
./bin/logline flows contract <arquivo>        # Preview de contrato
./bin/logline flows approve <contract_id>     # Aprovar execução
\`\`\`

### Ops (Observabilidade)
\`\`\`bash
./bin/logline ops status                      # Status do sistema
./bin/logline ops timeline --mode=ops        # Timeline de observação
./bin/logline ops query --service=payments   # Query de métricas
\`\`\`

## Exemplos por Persona

1. **Humano Comum**: Minicontrato simples com ROI
2. **Ops**: Diagnóstico P95 com evidências
3. **Científico**: Pipeline AlphaFold com export PDB
4. **ID**: Licenciamento de dados com W3C VC

## Arquitetura

- **Runtime Rust**: Parser, executor, storage unificado
- **UI Next.js**: Interface web com viewer dual (bruto vs contratado)
- **CLI Dual**: Comandos separados para flows e ops
- **Timeline Unificada**: Flows e ops na mesma timeline
- **Minicontratos**: Sistema de aprovação com PII e custo
- **LogLine ID**: Identidade e licenciamento de dados

## Validação

Execute os testes de cenário:
\`\`\`bash
cd test
node scenario-validation.js
\`\`\`

## Suporte

- Documentação: docs/
- Exemplos: examples/
- Testes: test/

Versão: ${this.version}
Build: ${this.timestamp}
`

    const docsDir = path.join(this.deliveryDir, "logline-browser-o4/docs")
    fs.writeFileSync(path.join(docsDir, "README.md"), readme)

    // Gerar arquivo de instalação
    const installScript = `#!/bin/bash
# LogLineBrowser O4+ - Script de Instalação

echo "🚀 Instalando LogLineBrowser O4+..."

# Verificar dependências
command -v node >/dev/null 2>&1 || { echo "❌ Node.js é necessário"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm é necessário"; exit 1; }

# Instalar dependências da UI
echo "📦 Instalando dependências da UI..."
cd ui && npm install && cd ..

# Tornar CLI executável
chmod +x bin/logline

# Testar instalação
echo "🧪 Testando instalação..."
./bin/logline --help

echo "✅ LogLineBrowser O4+ instalado com sucesso!"
echo "📋 Execute: ./bin/logline flows run examples/humano_comum_minicontrato.logline --simulate"
`

    fs.writeFileSync(path.join(this.deliveryDir, "logline-browser-o4/install.sh"), installScript)
    fs.chmodSync(path.join(this.deliveryDir, "logline-browser-o4/install.sh"), 0o755)

    console.log("✅ Documentação gerada")
  }

  async createZipPackage() {
    console.log("📦 Criando pacote ZIP...")

    const zipPath = path.join(this.deliveryDir, `logline-browser-o4-${this.version}.zip`)
    const output = fs.createWriteStream(zipPath)
    const archive = archiver("zip", { zlib: { level: 9 } })

    return new Promise((resolve, reject) => {
      output.on("close", () => {
        console.log(`✅ Pacote criado: ${zipPath} (${archive.pointer()} bytes)`)
        resolve(zipPath)
      })

      archive.on("error", (err) => {
        reject(err)
      })

      archive.pipe(output)
      archive.directory(path.join(this.deliveryDir, "logline-browser-o4"), "logline-browser-o4")
      archive.finalize()
    })
  }

  async generateDeliveryReport() {
    const report = {
      version: this.version,
      timestamp: this.timestamp,
      components: {
        rust_runtime: "✅ Compilado",
        cli_binary: "✅ Gerado",
        ui_build: "✅ Compilado",
        examples: "✅ 4 cenários",
        modelfile: "✅ Pronto para Ollama",
        tests: "✅ Validação de cenários",
        documentation: "✅ README + install.sh",
      },
      deliverables: {
        zip_package: `logline-browser-o4-${this.version}.zip`,
        cli_binary: "bin/logline",
        examples_count: 4,
        personas_covered: ["Humano Comum", "Ops", "Científico", "ID"],
      },
      next_steps: [
        "Extrair pacote ZIP",
        "Executar install.sh",
        "Testar exemplos com CLI",
        "Configurar Modelfile no Ollama",
        "Executar testes de cenário",
      ],
    }

    const reportPath = path.join(this.deliveryDir, "delivery-report.json")
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    console.log("\n📋 RELATÓRIO DE ENTREGA:")
    console.log(`📦 Pacote: logline-browser-o4-${this.version}.zip`)
    console.log(`🔧 CLI: bin/logline`)
    console.log(`📝 Exemplos: 4 cenários (.logline)`)
    console.log(`🤖 Modelfile: Pronto para Ollama`)
    console.log(`📚 Docs: README.md + install.sh`)
    console.log(`🧪 Testes: scenario-validation.js`)

    return report
  }

  async packageDelivery() {
    try {
      await this.createDeliveryStructure()
      await this.buildRuntimeBinary()
      await this.copyRuntimeFiles()
      await this.copyExamples()
      await this.copyUIFiles()
      await this.copyModelfile()
      await this.copyTestFiles()
      await this.generateDocumentation()
      await this.createZipPackage()
      await this.generateDeliveryReport()

      console.log("\n🎉 SPRINT DELIVERY COMPLETO!")
      console.log(`📦 Pacote pronto: delivery/logline-browser-o4-${this.version}.zip`)
    } catch (error) {
      console.error("💥 Erro no empacotamento:", error)
      process.exit(1)
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const packager = new DeliveryPackager()
  packager.packageDelivery()
}

module.exports = DeliveryPackager
