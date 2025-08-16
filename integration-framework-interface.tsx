"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  integrationFramework,
  type Integration,
  type IntegrationTemplate,
  type IntegrationExecution,
  IntegrationCategory,
} from "@/lib/integration-framework"

export function IntegrationFrameworkInterface() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [templates, setTemplates] = useState<IntegrationTemplate[]>([])
  const [executions, setExecutions] = useState<IntegrationExecution[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)

  // Create integration form state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [integrationName, setIntegrationName] = useState("")
  const [integrationConfig, setIntegrationConfig] = useState("")

  // Execute integration form state
  const [executeDialogOpen, setExecuteDialogOpen] = useState(false)
  const [executeOperation, setExecuteOperation] = useState("")
  const [executeInput, setExecuteInput] = useState("")

  const refreshData = () => {
    const categoryFilter = selectedCategory !== "all" ? (selectedCategory as IntegrationCategory) : undefined
    setIntegrations(integrationFramework.getIntegrations(categoryFilter))
    setTemplates(integrationFramework.getTemplates(categoryFilter))
    setExecutions(integrationFramework.getExecutions())
  }

  useEffect(() => {
    refreshData()
  }, [selectedCategory])

  const createIntegrationFromTemplate = async () => {
    if (!selectedTemplate || !integrationName) return

    try {
      let config = {}
      if (integrationConfig.trim()) {
        config = JSON.parse(integrationConfig)
      }

      await integrationFramework.createIntegrationFromTemplate(selectedTemplate, integrationName, config)
      refreshData()
      setCreateDialogOpen(false)
      setSelectedTemplate("")
      setIntegrationName("")
      setIntegrationConfig("")
    } catch (error) {
      console.error("Failed to create integration:", error)
    }
  }

  const executeIntegration = async () => {
    if (!selectedIntegration || !executeOperation) return

    try {
      let input = {}
      if (executeInput.trim()) {
        input = JSON.parse(executeInput)
      }

      await integrationFramework.executeIntegration(selectedIntegration, executeOperation, input)
      refreshData()
      setExecuteDialogOpen(false)
      setExecuteOperation("")
      setExecuteInput("")
    } catch (error) {
      console.error("Failed to execute integration:", error)
    }
  }

  const deleteIntegration = async (integrationId: string) => {
    try {
      await integrationFramework.deleteIntegration(integrationId)
      refreshData()
    } catch (error) {
      console.error("Failed to delete integration:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "inactive":
        return "bg-gray-500"
      case "error":
        return "bg-red-500"
      case "pending":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getExecutionStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "running":
        return "bg-blue-500"
      case "failed":
        return "bg-red-500"
      case "pending":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getCategoryColor = (category: IntegrationCategory) => {
    const colors = {
      [IntegrationCategory.AEROSPACE]: "bg-blue-600",
      [IntegrationCategory.FINANCIAL]: "bg-green-600",
      [IntegrationCategory.SCIENTIFIC]: "bg-purple-600",
      [IntegrationCategory.HEALTHCARE]: "bg-red-600",
      [IntegrationCategory.MANUFACTURING]: "bg-orange-600",
      [IntegrationCategory.RETAIL]: "bg-pink-600",
      [IntegrationCategory.EDUCATION]: "bg-indigo-600",
      [IntegrationCategory.GOVERNMENT]: "bg-gray-600",
      [IntegrationCategory.UTILITIES]: "bg-yellow-600",
      [IntegrationCategory.CUSTOM]: "bg-teal-600",
    }
    return colors[category] || "bg-gray-600"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Framework</CardTitle>
          <CardDescription>
            Manage integrations for aerospace, financial, scientific, and other domain-specific systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Filter by Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="aerospace">Aerospace</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="scientific">Scientific</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Create Integration</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Integration</DialogTitle>
                    <DialogDescription>Create an integration from a template</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Template</Label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name} ({template.category})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Integration Name</Label>
                      <Input
                        value={integrationName}
                        onChange={(e) => setIntegrationName(e.target.value)}
                        placeholder="Enter integration name"
                      />
                    </div>
                    <div>
                      <Label>Configuration (JSON)</Label>
                      <Textarea
                        value={integrationConfig}
                        onChange={(e) => setIntegrationConfig(e.target.value)}
                        placeholder='{"endpoints": {"api": "https://api.example.com"}, "settings": {"timeout": 5000}}'
                        rows={6}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createIntegrationFromTemplate}>Create Integration</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={refreshData}>
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integrations">Active Integrations</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="executions">Execution History</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          <ScrollArea className="h-96">
            {integrations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No integrations found. Create one from a template to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {integrations.map((integration) => (
                  <Card key={integration.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{integration.name}</h4>
                            <Badge className={getStatusColor(integration.status)}>{integration.status}</Badge>
                            <Badge className={getCategoryColor(integration.category)} variant="secondary">
                              {integration.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{integration.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Version: {integration.version}</span>
                            <span>Provider: {integration.provider}</span>
                            <span>Capabilities: {integration.capabilities.length}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <p>Created: {new Date(integration.created).toLocaleDateString()}</p>
                            <p>Last Updated: {new Date(integration.lastUpdated).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog open={executeDialogOpen} onOpenChange={setExecuteDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => setSelectedIntegration(integration.id)}
                                disabled={integration.status !== "active"}
                              >
                                Execute
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Execute Integration</DialogTitle>
                                <DialogDescription>Execute an operation on {integration.name}</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Operation</Label>
                                  <Input
                                    value={executeOperation}
                                    onChange={(e) => setExecuteOperation(e.target.value)}
                                    placeholder="e.g., fetch_data, process_request"
                                  />
                                </div>
                                <div>
                                  <Label>Input Data (JSON)</Label>
                                  <Textarea
                                    value={executeInput}
                                    onChange={(e) => setExecuteInput(e.target.value)}
                                    placeholder='{"param1": "value1", "param2": "value2"}'
                                    rows={4}
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setExecuteDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={executeIntegration}>Execute</Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button size="sm" variant="destructive" onClick={() => deleteIntegration(integration.id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <ScrollArea className="h-96">
            {templates.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No templates available</p>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{template.name}</h4>
                          <Badge className={getCategoryColor(template.category)} variant="secondary">
                            {template.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <div className="text-xs text-muted-foreground">
                          <p>Examples: {template.examples.length}</p>
                          <p>Capabilities: {template.template.capabilities?.length || 0}</p>
                        </div>
                        {template.examples.length > 0 && (
                          <div className="mt-2">
                            <h5 className="text-sm font-medium mb-1">Examples:</h5>
                            {template.examples.map((example, index) => (
                              <div key={index} className="text-xs bg-muted p-2 rounded mb-1">
                                <strong>{example.name}:</strong> {example.description}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <ScrollArea className="h-96">
            {executions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No execution history</p>
            ) : (
              <div className="space-y-2">
                {executions
                  .sort((a, b) => b.startTime - a.startTime)
                  .slice(0, 20)
                  .map((execution) => (
                    <Card key={execution.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={getExecutionStatusColor(execution.status)}>{execution.status}</Badge>
                              <span className="font-medium">{execution.operation}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Integration: {integrations.find((i) => i.id === execution.integrationId)?.name}
                            </p>
                            <div className="text-xs text-muted-foreground">
                              <p>Started: {new Date(execution.startTime).toLocaleString()}</p>
                              {execution.endTime && <p>Duration: {execution.endTime - execution.startTime}ms</p>}
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <p>API Calls: {execution.metrics.apiCalls}</p>
                            <p>Data: {execution.metrics.dataProcessed} bytes</p>
                            {execution.metrics.errors > 0 && (
                              <p className="text-red-500">Errors: {execution.metrics.errors}</p>
                            )}
                          </div>
                        </div>
                        {execution.error && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            Error: {execution.error}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Marketplace</CardTitle>
              <CardDescription>Discover and install integration plugins from the community</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    name: "AWS Services Integration",
                    description: "Connect to AWS services like S3, Lambda, and DynamoDB",
                    category: "Cloud",
                    downloads: 1250,
                    rating: 4.8,
                  },
                  {
                    name: "Slack Notifications",
                    description: "Send notifications and alerts to Slack channels",
                    category: "Communication",
                    downloads: 890,
                    rating: 4.6,
                  },
                  {
                    name: "Database Connectors",
                    description: "Connect to PostgreSQL, MySQL, MongoDB, and more",
                    category: "Database",
                    downloads: 2100,
                    rating: 4.9,
                  },
                  {
                    name: "Email Automation",
                    description: "Send automated emails via SMTP or email services",
                    category: "Communication",
                    downloads: 670,
                    rating: 4.4,
                  },
                  {
                    name: "File Processing",
                    description: "Process CSV, JSON, XML, and other file formats",
                    category: "Data",
                    downloads: 1450,
                    rating: 4.7,
                  },
                  {
                    name: "API Gateway",
                    description: "Create and manage REST API endpoints",
                    category: "API",
                    downloads: 980,
                    rating: 4.5,
                  },
                ].map((plugin, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">{plugin.name}</h4>
                        <p className="text-sm text-muted-foreground">{plugin.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{plugin.category}</Badge>
                          <div className="text-xs text-muted-foreground">
                            ⭐ {plugin.rating} • {plugin.downloads} downloads
                          </div>
                        </div>
                        <Button size="sm" className="w-full">
                          Install
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
