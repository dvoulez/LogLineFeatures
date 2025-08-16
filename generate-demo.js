// Gerador de Demo - LogLineBrowser O4+
// Cria script de demonstração executando 2 fluxos e 1 diagnóstico ops

const fs = require("fs")
const path = require("path")

class DemoGenerator {
  constructor() {
    this.demoDir = "demo"
    this.timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  }

  generateDemoScript() {
    console.log("🎬 Gerando script de demonstração...")

    if (!fs.existsSync(this.demoDir)) {
      fs.mkdirSync(this.demoDir, { recursive: true })
    }

    const demoScript = `#!/bin/bash
# LogLineBrowser O4+ - Demo Script
# Executa 2 fluxos e 1 diagnóstico ops para demonstração

echo "🎬 LogLineBrowser O4+ - Demonstração"
echo "===================================="
echo ""

# Verificar se o runtime está disponível
if [ ! -f "./bin/logline" ]; then
    echo "❌ CLI não encontrado. Execute o script de instalação primeiro."
    exit 1
fi

# Iniciar runtime em background
echo "🚀 Iniciando runtime..."
cd runtime && cargo run &
RUNTIME_PID=$!
cd ..

# Aguardar runtime inicializar
sleep 5

echo ""
echo "📋 DEMO 1: Minicontrato Simples (Humano Comum)"
echo "=============================================="
echo "Executando resumo de página com análise de ROI..."
./bin/logline flows run examples/humano_comum_minicontrato.logline --simulate
echo ""
echo "✅ Demo 1 concluído - Minicontrato com ROI estimado"
echo ""

sleep 3

echo "📋 DEMO 2: Pipeline Científico (AlphaFold)"
echo "=========================================="
echo "Executando predição de estrutura proteica..."
./bin/logline flows contract examples/cientifico_alphafold.logline
echo ""
echo "Aprovando contrato de alto custo..."
./bin/logline flows approve contract_alphafold_123
echo ""
echo "✅ Demo 2 concluído - Pipeline científico com aprovação"
echo ""

sleep 3

echo "📋 DEMO 3: Diagnóstico Ops (P95 Latência)"
echo "========================================="
echo "Executando diagnóstico de performance..."
./bin/logline ops query --service=payments --metric=response_time_p95
echo ""
echo "Coletando evidências..."
./bin/logline ops evidence logs --type=error
echo ""
echo "Gerando hipótese..."
./bin/logline ops hypothesis "Deploy recente causou degradação de performance"
echo ""
echo "✅ Demo 3 concluído - Diagnóstico com evidências"
echo ""

echo "📊 Visualizando timeline unificada..."
./bin/logline ops timeline --mode=all --limit=20
echo ""

echo "🎉 DEMONSTRAÇÃO COMPLETA!"
echo "========================"
echo ""
echo "Resumo dos demos executados:"
echo "1. ✅ Minicontrato simples com ROI"
echo "2. ✅ Pipeline científico com aprovação"
echo "3. ✅ Diagnóstico ops com evidências"
echo ""
echo "📋 Timeline unificada mostra flows + ops integrados"
echo "📦 Bundles de auditoria disponíveis para download"
echo ""

# Parar runtime
kill $RUNTIME_PID
echo "🛑 Runtime parado"
`

    const scriptPath = path.join(this.demoDir, "run-demo.sh")
    fs.writeFileSync(scriptPath, demoScript)
    fs.chmodSync(scriptPath, 0o755)

    console.log(`✅ Script de demo criado: ${scriptPath}`)
  }

  generateDemoDocumentation() {
    console.log("📚 Gerando documentação do demo...")

    const demoDoc = `# LogLineBrowser O4+ - Demonstração

## Visão Geral

Esta demonstração executa 3 cenários principais do LogLineBrowser O4+:

1. **Minicontrato Simples** (Humano Comum)
2. **Pipeline Científico** (AlphaFold)
3. **Diagnóstico Ops** (P95 Latência)

## Execução

\`\`\`bash
# Executar demo completo
./demo/run-demo.sh
\`\`\`

## Cenários Demonstrados

### 1. Minicontrato Simples
- **Persona**: Humano Comum
- **Cenário**: Resumo automático de artigo
- **Features**: ROI estimado, custo baixo, aprovação automática
- **Duração**: ~15 segundos

### 2. Pipeline Científico
- **Persona**: Científico
- **Cenário**: Predição de estrutura proteica AlphaFold
- **Features**: Contrato de alto custo, aprovação manual, export PDB
- **Duração**: ~5 minutos (simulado)

### 3. Diagnóstico Ops
- **Persona**: Ops
- **Cenário**: Investigação de latência P95
- **Features**: Coleta de evidências, hipóteses, recomendações
- **Duração**: ~30 segundos

## Resultados Esperados

### Timeline Unificada
- Spans de flows e ops na mesma timeline
- Metadados completos (custo, PII, origem)
- Rastreabilidade end-to-end

### Minicontratos
- Preview antes da execução
- Aprovação baseada em risco
- Auditoria completa

### Evidências
- Chain of custody
- Hashes de integridade
- Bundles downloadáveis

## Comandos Demonstrados

### Flows
\`\`\`bash
logline flows run <arquivo.logline> --simulate
logline flows contract <arquivo.logline>
logline flows approve <contract_id>
\`\`\`

### Ops
\`\`\`bash
logline ops query --service=payments --metric=response_time_p95
logline ops evidence logs --type=error
logline ops hypothesis "Deploy recente causou degradação"
logline ops timeline --mode=all
\`\`\`

## Validação

O demo valida:
- ✅ CLI dual (flows + ops)
- ✅ Timeline unificada
- ✅ Minicontratos funcionais
- ✅ Coleta de evidências
- ✅ Integração end-to-end

## Próximos Passos

Após o demo:
1. Explorar outros exemplos .logline
2. Configurar Modelfile no Ollama
3. Executar testes de cenário completos
4. Integrar com sistemas reais
`

    const docPath = path.join(this.demoDir, "README.md")
    fs.writeFileSync(docPath, demoDoc)

    console.log(`✅ Documentação do demo criada: ${docPath}`)
  }

  generateDemo() {
    this.generateDemoScript()
    this.generateDemoDocumentation()

    console.log("\n🎬 DEMO GERADO!")
    console.log("📁 Arquivos criados:")
    console.log("  - demo/run-demo.sh (script executável)")
    console.log("  - demo/README.md (documentação)")
    console.log("")
    console.log("🚀 Para executar: ./demo/run-demo.sh")
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const generator = new DemoGenerator()
  generator.generateDemo()
}

module.exports = DemoGenerator
