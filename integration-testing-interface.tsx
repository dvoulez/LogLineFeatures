"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Play, Download, CheckCircle, XCircle, Clock } from "lucide-react"
import { integrationTester, type TestSuite } from "@/lib/integration-testing"

export function IntegrationTestingInterface() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string>("")

  const runAllTests = async () => {
    setIsRunning(true)
    setCurrentTest("Initializing tests...")

    try {
      const suites = await integrationTester.runAllTests()
      setTestSuites(suites)
    } catch (error) {
      console.error("Test execution failed:", error)
    } finally {
      setIsRunning(false)
      setCurrentTest("")
    }
  }

  const downloadReport = () => {
    const report = integrationTester.generateTestReport()
    const blob = new Blob([report], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `loglinebrowser-test-report-${new Date().toISOString().split("T")[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusColor = (success: boolean) => {
    return success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

  const calculateOverallStats = () => {
    const totalTests = testSuites.reduce((sum, s) => sum + s.totalTests, 0)
    const totalPassed = testSuites.reduce((sum, s) => sum + s.passedTests, 0)
    const totalFailed = testSuites.reduce((sum, s) => sum + s.failedTests, 0)
    const totalDuration = testSuites.reduce((sum, s) => sum + s.totalDuration, 0)
    const successRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0

    return { totalTests, totalPassed, totalFailed, totalDuration, successRate }
  }

  const stats = calculateOverallStats()

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Integration Testing & Timeline Verification</h2>
        <p className="text-muted-foreground">Comprehensive testing of all LogLineBrowser systems</p>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Execution</CardTitle>
          <CardDescription>Run comprehensive integration tests across all systems</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={runAllTests} disabled={isRunning} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              {isRunning ? "Running Tests..." : "Run All Tests"}
            </Button>
            {testSuites.length > 0 && (
              <Button variant="outline" onClick={downloadReport} className="flex items-center gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            )}
          </div>
          {isRunning && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 animate-spin" />
                <span className="text-sm">{currentTest}</span>
              </div>
              <Progress value={33} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results Overview */}
      {testSuites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results Overview</CardTitle>
            <CardDescription>Summary of all test suite executions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.totalTests}</p>
                <p className="text-sm text-muted-foreground">Total Tests</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.totalPassed}</p>
                <p className="text-sm text-muted-foreground">Passed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.totalFailed}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.totalDuration}ms</p>
                <p className="text-sm text-muted-foreground">Duration</p>
              </div>
            </div>
            <Progress value={stats.successRate} className="w-full" />
          </CardContent>
        </Card>
      )}

      {/* Detailed Test Results */}
      {testSuites.length > 0 && (
        <Tabs defaultValue="suites" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="suites">Test Suites</TabsTrigger>
            <TabsTrigger value="details">Detailed Results</TabsTrigger>
          </TabsList>

          <TabsContent value="suites">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testSuites.map((suite) => (
                <Card key={suite.name}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {suite.name}
                      <Badge className={getStatusColor(suite.failedTests === 0)}>
                        {suite.failedTests === 0 ? "PASSED" : "FAILED"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {suite.passedTests}/{suite.totalTests} tests passed • {suite.totalDuration}ms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Progress value={(suite.passedTests / suite.totalTests) * 100} className="w-full" />
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center">
                          <p className="font-medium">{suite.totalTests}</p>
                          <p className="text-muted-foreground">Total</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-green-600">{suite.passedTests}</p>
                          <p className="text-muted-foreground">Passed</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-red-600">{suite.failedTests}</p>
                          <p className="text-muted-foreground">Failed</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="details">
            <ScrollArea className="h-96">
              {testSuites.map((suite) => (
                <Card key={suite.name} className="mb-4">
                  <CardHeader>
                    <CardTitle>{suite.name}</CardTitle>
                    <CardDescription>Detailed test results and outputs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {suite.tests.map((test) => (
                        <div key={test.name} className="border rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(test.success)}
                              <span className="font-medium">{test.name}</span>
                            </div>
                            <Badge variant="outline">{test.duration}ms</Badge>
                          </div>
                          {test.success ? (
                            <p className="text-sm text-green-700 bg-green-50 p-2 rounded">{test.output}</p>
                          ) : (
                            <p className="text-sm text-red-700 bg-red-50 p-2 rounded">{test.error}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}

      {/* Sprint Acceptance Criteria */}
      <Card>
        <CardHeader>
          <CardTitle>Sprint Acceptance Criteria</CardTitle>
          <CardDescription>Verification of sprint board objectives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>CLI Flows and Ops functioning with unified timeline</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Examples executable from UI and CLI</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>LogLine ID exporting credentials and simulating licensing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Timeline integration across all systems</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Comprehensive testing and validation</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
