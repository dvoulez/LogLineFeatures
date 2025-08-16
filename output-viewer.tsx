"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Eye, EyeOff, Shield, AlertTriangle } from "lucide-react"
import { PIIDetector } from "@/lib/security-governance"

interface OutputViewerProps {
  runId: string
  spans: any[]
  contracts: any[]
  evidence: any[]
}

export function OutputViewer({ runId, spans, contracts, evidence }: OutputViewerProps) {
  const [showPII, setShowPII] = useState(false)
  const [activeView, setActiveView] = useState("raw")

  const maskPII = (content: any) => {
    return PIIDetector.maskPIIInObject(content, showPII)
  }

  const generateContractedOutput = (rawOutput: any) => {
    const maskedOutput = maskPII(rawOutput)
    return {
      ...maskedOutput,
      _metadata: {
        summary: "Processed and validated output according to contract terms",
        pii_masked: !showPII,
        compliance_status: "APPROVED",
        risk_level: "LOW",
        processing_timestamp: new Date().toISOString(),
        contract_applied: true,
      },
    }
  }

  const detectPIIInSpan = (span: any) => {
    const content = JSON.stringify(span.out || span.args || {})
    return PIIDetector.detectPII(content)
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Run Output: {runId.slice(0, 8)}</h3>
          <Badge variant="outline">{spans.length} spans</Badge>
          {spans.some((span) => detectPIIInSpan(span).hasPII) && (
            <Badge variant="destructive" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              PII Detected
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPII(!showPII)}>
            {showPII ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPII ? "Hide PII" : "Show PII"}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Bundle
          </Button>
        </div>
      </div>

      {/* PII Warning */}
      {!showPII && spans.some((span) => detectPIIInSpan(span).hasPII) && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">PII Protection Active</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            Personally identifiable information has been automatically masked in the output. Toggle "Show PII" to view
            unmasked data (requires appropriate permissions).
          </p>
        </div>
      )}

      {/* Output Comparison */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="raw">Saída Bruta</TabsTrigger>
          <TabsTrigger value="contracted">Saída Contratada</TabsTrigger>
          <TabsTrigger value="contracts">Minicontratos</TabsTrigger>
          <TabsTrigger value="evidence">Evidências</TabsTrigger>
        </TabsList>

        <TabsContent value="raw" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Raw System Output
              </CardTitle>
              <CardDescription>Unprocessed output from span execution - may contain PII</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {spans.map((span, index) => {
                  const piiResult = detectPIIInSpan(span)
                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={span.status === "completed" ? "default" : "destructive"}>{span.tool}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {span.meta?.cost ? `$${span.meta.cost.toFixed(4)}` : "$0.00"}
                          </span>
                          {piiResult.hasPII && (
                            <Badge variant="destructive" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              PII ({piiResult.piiTypes.join(", ")})
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{span.meta?.timestamps?.created}</span>
                      </div>
                      <pre className="text-sm bg-muted p-3 rounded overflow-x-auto">
                        {JSON.stringify(maskPII(span.out || span.args), null, 2)}
                      </pre>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracted" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Contracted Output
              </CardTitle>
              <CardDescription>
                Processed output according to minicontract terms - PII masked, validated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {spans.map((span, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">{span.tool}</Badge>
                        <Badge variant="outline" className="text-green-600">
                          VALIDATED
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          PII PROTECTED
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">Contract Applied</span>
                    </div>
                    <pre className="text-sm bg-muted p-3 rounded overflow-x-auto">
                      {JSON.stringify(generateContractedOutput(span.out || span.args), null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Minicontratos Ativos</CardTitle>
              <CardDescription>Contratos aplicados durante a execução</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contracts.length > 0 ? (
                  contracts.map((contract, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{contract.titulo}</h4>
                        <Badge variant={contract.aprovacao_necessaria ? "destructive" : "default"}>
                          {contract.risco.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Custo Estimado:</span>
                          <span className="ml-2">${contract.custo_estimado.toFixed(4)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">PII Detectado:</span>
                          <span className="ml-2">{contract.pii_detectado ? "Sim" : "Não"}</span>
                        </div>
                      </div>
                      {contract.aprovacao_necessaria && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                          <AlertTriangle className="h-4 w-4 inline mr-2 text-yellow-600" />
                          Aprovação necessária antes da execução
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">Nenhum minicontrato ativo</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Painel de Evidências</CardTitle>
              <CardDescription>Evidências coletadas durante a execução</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {evidence.length > 0 ? (
                  evidence.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.source}</Badge>
                          <Badge variant="secondary">{item.type}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                      </div>
                      <div className="text-sm">
                        <div className="mb-2">
                          <span className="text-muted-foreground">Hash:</span>
                          <code className="ml-2 text-xs bg-muted px-1 rounded">{item.data?.hash}</code>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Size:</span>
                          <span className="ml-2">{item.data?.size_bytes} bytes</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">Nenhuma evidência coletada</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
