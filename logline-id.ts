// LogLine ID Types
export interface LogLineIDIdentity {
  id: string
  publicKey: string
  claims: IdentityClaims
  credentials: W3CVerifiableCredential[]
  dataLicenses: DataLicense[]
  created: Date
  lastUpdated: Date
  status: "active" | "suspended" | "revoked"
}

export interface IdentityClaims {
  name?: string
  email?: string
  organization?: string
  roles: string[]
  permissions: string[]
  verificationLevel: "basic" | "verified" | "premium"
  privacyPreferences: PrivacyPreferences
}

export interface PrivacyPreferences {
  dataMinimization: boolean
  consentRequired: boolean
  retentionPeriod: number // days
  allowAnalytics: boolean
  allowSharing: boolean
  encryptionRequired: boolean
}

export interface W3CVerifiableCredential {
  "@context": string[]
  id: string
  type: string[]
  issuer: string
  issuanceDate: string
  expirationDate?: string
  credentialSubject: Record<string, any>
  proof: CredentialProof
}

export interface CredentialProof {
  type: string
  created: string
  verificationMethod: string
  proofPurpose: string
  jws: string
}

export interface DataLicense {
  id: string
  identityId: string
  dataType: string
  purpose: string
  recipient: string
  permissions: DataPermission[]
  restrictions: DataRestriction[]
  issuedAt: Date
  expiresAt: Date
  status: "active" | "expired" | "revoked"
  riskLevel: "low" | "medium" | "high"
}

export interface DataPermission {
  action: "read" | "write" | "process" | "share" | "store"
  scope: string
  conditions?: Record<string, any>
}

export interface DataRestriction {
  type: "geographic" | "temporal" | "purpose" | "recipient"
  value: string
  description: string
}

export interface LicenseAlert {
  id: string
  licenseId: string
  type: "expiring" | "expired" | "violation" | "risk_change"
  severity: "info" | "warning" | "critical"
  message: string
  timestamp: Date
  acknowledged: boolean
}

export class LogLineIDSystem {
  private identities: Map<string, LogLineIDIdentity> = new Map()
  private licenses: Map<string, DataLicense> = new Map()
  private alerts: Map<string, LicenseAlert> = new Map()
  private keyPairs: Map<string, { publicKey: string; privateKey: string }> = new Map()

  constructor() {
    this.initializeDefaultIdentity()
    this.startLicenseMonitoring()
  }

  private initializeDefaultIdentity() {
    const keyPair = this.generateKeyPair()
    const identityId = "logline_id_demo"

    const identity: LogLineIDIdentity = {
      id: identityId,
      publicKey: keyPair.publicKey,
      claims: {
        name: "Demo User",
        email: "demo@loglinebrowser.com",
        organization: "LogLineBrowser Demo",
        roles: ["user", "developer"],
        permissions: ["data:read", "data:process", "automation:execute"],
        verificationLevel: "verified",
        privacyPreferences: {
          dataMinimization: true,
          consentRequired: true,
          retentionPeriod: 30,
          allowAnalytics: false,
          allowSharing: false,
          encryptionRequired: true,
        },
      },
      credentials: [],
      dataLicenses: [],
      created: new Date(),
      lastUpdated: new Date(),
      status: "active",
    }

    this.identities.set(identityId, identity)
    this.keyPairs.set(identityId, keyPair)

    // Create initial W3C credential
    this.issueCredential(identityId, "LogLineBrowserUser", {
      name: identity.claims.name,
      email: identity.claims.email,
      roles: identity.claims.roles,
      verificationLevel: identity.claims.verificationLevel,
    })
  }

  private generateKeyPair(): { publicKey: string; privateKey: string } {
    // Simplified key generation for demo - in production use proper cryptography
    const timestamp = Date.now().toString()
    const publicKey = `pub_${Buffer.from(timestamp).toString("base64")}`
    const privateKey = `priv_${Buffer.from(timestamp + "_secret").toString("base64")}`

    return { publicKey, privateKey }
  }

  // Identity Management
  async createIdentity(claims: IdentityClaims): Promise<string> {
    const identityId = `logline_id_${Date.now()}`
    const keyPair = this.generateKeyPair()

    const identity: LogLineIDIdentity = {
      id: identityId,
      publicKey: keyPair.publicKey,
      claims,
      credentials: [],
      dataLicenses: [],
      created: new Date(),
      lastUpdated: new Date(),
      status: "active",
    }

    this.identities.set(identityId, identity)
    this.keyPairs.set(identityId, keyPair)

    return identityId
  }

  getIdentity(identityId: string): LogLineIDIdentity | undefined {
    return this.identities.get(identityId)
  }

  getAllIdentities(): LogLineIDIdentity[] {
    return Array.from(this.identities.values())
  }

  // W3C Verifiable Credentials
  async issueCredential(
    identityId: string,
    credentialType: string,
    credentialSubject: Record<string, any>,
  ): Promise<string> {
    const identity = this.identities.get(identityId)
    if (!identity) {
      throw new Error(`Identity ${identityId} not found`)
    }

    const credentialId = `vc_${Date.now()}`
    const issuanceDate = new Date().toISOString()
    const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year

    const credential: W3CVerifiableCredential = {
      "@context": ["https://www.w3.org/2018/credentials/v1", "https://loglinebrowser.com/credentials/v1"],
      id: credentialId,
      type: ["VerifiableCredential", credentialType],
      issuer: "did:logline:system",
      issuanceDate,
      expirationDate,
      credentialSubject: {
        id: identityId,
        ...credentialSubject,
      },
      proof: {
        type: "JsonWebSignature2020",
        created: issuanceDate,
        verificationMethod: `${identity.publicKey}#key-1`,
        proofPurpose: "assertionMethod",
        jws: this.signCredential(credentialId, identityId),
      },
    }

    identity.credentials.push(credential)
    identity.lastUpdated = new Date()

    return credentialId
  }

  private signCredential(credentialId: string, identityId: string): string {
    // Simplified signing for demo - in production use proper JWS
    const keyPair = this.keyPairs.get(identityId)
    if (!keyPair) {
      throw new Error("Key pair not found")
    }

    const payload = Buffer.from(`${credentialId}:${identityId}:${Date.now()}`).toString("base64")
    return `${payload}.signature`
  }

  exportCredentials(identityId: string): W3CVerifiableCredential[] {
    const identity = this.identities.get(identityId)
    if (!identity) {
      throw new Error(`Identity ${identityId} not found`)
    }

    return identity.credentials
  }

  // Data Licensing System
  async createDataLicense(
    identityId: string,
    dataType: string,
    purpose: string,
    recipient: string,
    permissions: DataPermission[],
    durationDays = 30,
  ): Promise<string> {
    const identity = this.identities.get(identityId)
    if (!identity) {
      throw new Error(`Identity ${identityId} not found`)
    }

    const licenseId = `license_${Date.now()}`
    const issuedAt = new Date()
    const expiresAt = new Date(issuedAt.getTime() + durationDays * 24 * 60 * 60 * 1000)

    // Assess risk level based on data type and permissions
    const riskLevel = this.assessLicenseRisk(dataType, permissions, recipient)

    const license: DataLicense = {
      id: licenseId,
      identityId,
      dataType,
      purpose,
      recipient,
      permissions,
      restrictions: this.generateRestrictions(identity.claims.privacyPreferences, riskLevel),
      issuedAt,
      expiresAt,
      status: "active",
      riskLevel,
    }

    this.licenses.set(licenseId, license)
    identity.dataLicenses.push(licenseId)

    // Create alert for high-risk licenses
    if (riskLevel === "high") {
      this.createAlert(
        licenseId,
        "risk_change",
        "critical",
        `High-risk data license issued for ${dataType} to ${recipient}`,
      )
    }

    // Log to timeline
    this.logLicenseEvent(licenseId, "license_created", {
      dataType,
      recipient,
      riskLevel,
      expiresAt: expiresAt.toISOString(),
    })

    return licenseId
  }

  private assessLicenseRisk(
    dataType: string,
    permissions: DataPermission[],
    recipient: string,
  ): "low" | "medium" | "high" {
    let riskScore = 0

    // Data type risk
    const sensitiveDataTypes = ["personal", "financial", "health", "biometric"]
    if (sensitiveDataTypes.some((type) => dataType.toLowerCase().includes(type))) {
      riskScore += 3
    }

    // Permission risk
    const highRiskActions = ["write", "share", "store"]
    const hasHighRiskActions = permissions.some((p) => highRiskActions.includes(p.action))
    if (hasHighRiskActions) {
      riskScore += 2
    }

    // Recipient risk
    if (recipient.includes("external") || recipient.includes("third-party")) {
      riskScore += 2
    }

    if (riskScore >= 5) return "high"
    if (riskScore >= 3) return "medium"
    return "low"
  }

  private generateRestrictions(
    preferences: PrivacyPreferences,
    riskLevel: "low" | "medium" | "high",
  ): DataRestriction[] {
    const restrictions: DataRestriction[] = []

    if (preferences.encryptionRequired) {
      restrictions.push({
        type: "purpose",
        value: "encryption_required",
        description: "Data must be encrypted at rest and in transit",
      })
    }

    if (!preferences.allowSharing) {
      restrictions.push({
        type: "recipient",
        value: "no_third_party",
        description: "Data cannot be shared with third parties",
      })
    }

    if (riskLevel === "high") {
      restrictions.push({
        type: "temporal",
        value: `max_${preferences.retentionPeriod}_days`,
        description: `Data must be deleted after ${preferences.retentionPeriod} days`,
      })
    }

    return restrictions
  }

  // License Monitoring and Alerts
  private startLicenseMonitoring() {
    // Check for expiring licenses every hour
    setInterval(
      () => {
        this.checkExpiringLicenses()
      },
      60 * 60 * 1000,
    )

    // Initial check
    setTimeout(() => this.checkExpiringLicenses(), 1000)
  }

  private checkExpiringLicenses() {
    const now = new Date()
    const warningThreshold = 7 * 24 * 60 * 60 * 1000 // 7 days

    for (const license of this.licenses.values()) {
      if (license.status !== "active") continue

      const timeToExpiry = license.expiresAt.getTime() - now.getTime()

      if (timeToExpiry <= 0) {
        // License expired
        license.status = "expired"
        this.createAlert(license.id, "expired", "critical", `Data license for ${license.dataType} has expired`)
        this.logLicenseEvent(license.id, "license_expired", {
          dataType: license.dataType,
          recipient: license.recipient,
        })
      } else if (timeToExpiry <= warningThreshold) {
        // License expiring soon
        const daysLeft = Math.ceil(timeToExpiry / (24 * 60 * 60 * 1000))
        this.createAlert(
          license.id,
          "expiring",
          "warning",
          `Data license for ${license.dataType} expires in ${daysLeft} days`,
        )
      }
    }
  }

  private createAlert(
    licenseId: string,
    type: LicenseAlert["type"],
    severity: LicenseAlert["severity"],
    message: string,
  ) {
    const alertId = `alert_${Date.now()}`
    const alert: LicenseAlert = {
      id: alertId,
      licenseId,
      type,
      severity,
      message,
      timestamp: new Date(),
      acknowledged: false,
    }

    this.alerts.set(alertId, alert)
  }

  private logLicenseEvent(licenseId: string, eventType: string, data: Record<string, any>) {
    // Integration with timeline system
    console.log(`[LogLine ID] ${eventType}:`, { licenseId, ...data })

    // In a real system, this would integrate with the timeline storage
    // timelineStorage.addEvent({
    //   type: eventType,
    //   source: "logline_id",
    //   data: { licenseId, ...data },
    //   timestamp: new Date(),
    // })
  }

  // Public API Methods
  getLicenses(identityId?: string): DataLicense[] {
    const allLicenses = Array.from(this.licenses.values())
    if (identityId) {
      return allLicenses.filter((license) => license.identityId === identityId)
    }
    return allLicenses
  }

  getAlerts(acknowledged?: boolean): LicenseAlert[] {
    const allAlerts = Array.from(this.alerts.values())
    if (acknowledged !== undefined) {
      return allAlerts.filter((alert) => alert.acknowledged === acknowledged)
    }
    return allAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId)
    if (alert) {
      alert.acknowledged = true
    }
  }

  revokeLicense(licenseId: string, reason: string): void {
    const license = this.licenses.get(licenseId)
    if (license) {
      license.status = "revoked"
      this.createAlert(licenseId, "violation", "warning", `License revoked: ${reason}`)
      this.logLicenseEvent(licenseId, "license_revoked", { reason })
    }
  }

  // Demo Methods
  async simulateDataLicensing(): Promise<{
    licenseId: string
    alerts: LicenseAlert[]
    timelineEvents: string[]
  }> {
    const identityId = "logline_id_demo"

    // Create a 30-day data license
    const licenseId = await this.createDataLicense(
      identityId,
      "personal_browsing_data",
      "automation_analysis",
      "logline_system",
      [
        { action: "read", scope: "browsing_history" },
        { action: "process", scope: "user_interactions" },
      ],
      30,
    )

    // Simulate some time passing and create alerts
    setTimeout(() => {
      this.createAlert(licenseId, "expiring", "warning", "Data license expires in 7 days - consider renewal")
    }, 100)

    const alerts = this.getAlerts(false)
    const timelineEvents = [
      `License ${licenseId} created for personal_browsing_data`,
      `Risk assessment: medium (data processing permissions)`,
      `Expiration alert scheduled for 7 days before expiry`,
    ]

    return { licenseId, alerts, timelineEvents }
  }
}

// Global LogLine ID instance
export const logLineID = new LogLineIDSystem()
