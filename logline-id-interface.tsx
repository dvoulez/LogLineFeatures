"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Shield, Key, FileText, AlertTriangle, Download, Clock } from "lucide-react"
import {
  logLineID,
  type LogLineIDIdentity,
  type DataLicense,
  type LicenseAlert,
  type W3CVerifiableCredential,
} from "@/lib/logline-id"

export function LogLineIDInterface() {
  const [identity, setIdentity] = useState<LogLineIDIdentity | null>(null)
  const [licenses, setLicenses] = useState<DataLicense[]>([])
  const [alerts, setAlerts] = useState<LicenseAlert[]>([])
  const [credentials, setCredentials] = useState<W3CVerifiableCredential[]>([])

  useEffect(() => {
    // Load demo identity
    const demoIdentity = logLineID.getIdentity("logline_id_demo")
    if (demoIdentity) {
      setIdentity(demoIdentity)
      setLicenses(logLineID.getLicenses(demoIdentity.id))
      setCredentials(logLineID.exportCredentials(demoIdentity.id))
    }
    setAlerts(logLineID.getAlerts(false))
  }, [])

  const simulateLicensing = async () => {
    const result = await logLineID.simulateDataLicensing()
    setLicenses(logLineID.getLicenses("logline_id_demo"))
    setAlerts(logLineID.getAlerts(false))
  }

  const exportCredentials = () => {
    if (!identity) return

    const credentialsData = {
      identity: identity.id,
      credentials: credentials,
      exported_at: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(credentialsData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `logline-credentials-${identity.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const acknowledgeAlert = (alertId: string) => {
    logLineID.acknowledgeAlert(alertId)
    setAlerts(logLineID.getAlerts(false))
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "info":
        return "bg-blue-100 text-blue-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "critical":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">LogLine ID - Active Privacy System</h2>
        <p className="text-muted-foreground">Identity management with W3C credentials and data licensing</p>
      </div>

      <Tabs defaultValue="identity" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="licenses">Data Licenses</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="identity">
          {identity && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  LogLine Identity
                </CardTitle>
                <CardDescription>Your decentralized identity with privacy controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>ID:</strong> {identity.id}
                      </div>
                      <div>
                        <strong>Name:</strong> {identity.claims.name}
                      </div>
                      <div>
                        <strong>Email:</strong> {identity.claims.email}
                      </div>
                      <div>
                        <strong>Organization:</strong> {identity.claims.organization}
                      </div>
                      <div>
                        <strong>Status:</strong> <Badge variant="outline">{identity.status}</Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Privacy Preferences</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Data Minimization:</span>
                        <Badge variant={identity.claims.privacyPreferences.dataMinimization ? "default" : "secondary"}>
                          {identity.claims.privacyPreferences.dataMinimization ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Consent Required:</span>
                        <Badge variant={identity.claims.privacyPreferences.consentRequired ? "default" : "secondary"}>
                          {identity.claims.privacyPreferences.consentRequired ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Retention Period:</span>
                        <span>{identity.claims.privacyPreferences.retentionPeriod} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Encryption Required:</span>
                        <Badge
                          variant={identity.claims.privacyPreferences.encryptionRequired ? "default" : "secondary"}
                        >
                          {identity.claims.privacyPreferences.encryptionRequired ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Public Key</h4>
                  <div className="bg-muted p-3 rounded font-mono text-sm break-all">{identity.publicKey}</div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Roles & Permissions</h4>
                  <div className="flex flex-wrap gap-2">
                    {identity.claims.roles.map((role) => (
                      <Badge key={role} variant="outline">
                        {role}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {identity.claims.permissions.map((permission) => (
                      <Badge key={permission} variant="secondary">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="credentials">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                W3C Verifiable Credentials
              </CardTitle>
              <CardDescription>Export and manage your verifiable credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Available Credentials: {credentials.length}</span>
                  <Button onClick={exportCredentials} disabled={!identity}>
                    <Download className="h-4 w-4 mr-2" />
                    Export W3C VC
                  </Button>
                </div>

                <ScrollArea className="h-64">
                  {credentials.map((credential) => (
                    <Card key={credential.id} className="mb-3">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{credential.type.join(", ")}</h4>
                          <Badge variant="outline">Valid</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>
                            <strong>ID:</strong> {credential.id}
                          </div>
                          <div>
                            <strong>Issuer:</strong> {credential.issuer}
                          </div>
                          <div>
                            <strong>Issued:</strong> {new Date(credential.issuanceDate).toLocaleDateString()}
                          </div>
                          {credential.expirationDate && (
                            <div>
                              <strong>Expires:</strong> {new Date(credential.expirationDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="licenses">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Data Licenses
              </CardTitle>
              <CardDescription>Manage data usage permissions and licensing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Active Licenses: {licenses.filter((l) => l.status === "active").length}</span>
                  <Button onClick={simulateLicensing}>
                    <Clock className="h-4 w-4 mr-2" />
                    Simulate 30-Day License
                  </Button>
                </div>

                <ScrollArea className="h-64">
                  {licenses.map((license) => (
                    <Card key={license.id} className="mb-3">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{license.dataType}</h4>
                          <div className="flex gap-2">
                            <Badge variant="outline">{license.status}</Badge>
                            <Badge className={getRiskColor(license.riskLevel)}>{license.riskLevel} risk</Badge>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>
                            <strong>Purpose:</strong> {license.purpose}
                          </div>
                          <div>
                            <strong>Recipient:</strong> {license.recipient}
                          </div>
                          <div>
                            <strong>Issued:</strong> {license.issuedAt.toLocaleDateString()}
                          </div>
                          <div>
                            <strong>Expires:</strong> {license.expiresAt.toLocaleDateString()}
                          </div>
                          <div>
                            <strong>Permissions:</strong> {license.permissions.map((p) => p.action).join(", ")}
                          </div>
                          {license.restrictions.length > 0 && (
                            <div>
                              <strong>Restrictions:</strong> {license.restrictions.length} applied
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                License Alerts
              </CardTitle>
              <CardDescription>Monitor license status and privacy risks</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {alerts.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">No alerts at this time</div>
                ) : (
                  alerts.map((alert) => (
                    <Alert key={alert.id} className="mb-3">
                      <AlertTriangle className="h-4 w-4" />
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                            <Badge variant="outline">{alert.type}</Badge>
                          </div>
                          <AlertDescription>{alert.message}</AlertDescription>
                          <div className="text-xs text-muted-foreground mt-1">{alert.timestamp.toLocaleString()}</div>
                        </div>
                        {!alert.acknowledged && (
                          <Button size="sm" variant="outline" onClick={() => acknowledgeAlert(alert.id)}>
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </Alert>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
