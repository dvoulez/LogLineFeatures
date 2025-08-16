import { spanEngine } from "./span-engine"

// Security and Governance Types
export interface SecurityPolicy {
  id: string
  name: string
  description: string
  rules: PolicyRule[]
  enabled: boolean
  created: number
  lastModified: number
}

export interface PolicyRule {
  id: string
  type: "allow" | "deny" | "require_approval"
  condition: PolicyCondition
  action: string
  priority: number
}

export interface PolicyCondition {
  spanType?: string[]
  targetDomains?: string[]
  riskLevel?: ("low" | "medium" | "high")[]
  userRoles?: string[]
  timeRestrictions?: {
    allowedHours?: { start: number; end: number }
    allowedDays?: number[]
  }
}

export interface SecurityContract {
  id: string
  name: string
  version: string
  policies: string[] // Policy IDs
  permissions: Permission[]
  approvers: string[] // User IDs
  created: number
  expiresAt?: number
}

export interface Permission {
  resource: string
  actions: string[]
  conditions?: Record<string, any>
}

export interface GovernanceApproval {
  id: string
  spanId: string
  requestedBy: string
  requestedAt: number
  approvers: ApprovalStatus[]
  status: "pending" | "approved" | "rejected" | "expired"
  riskAssessment: RiskAssessment
  expiresAt: number
}

export interface ApprovalStatus {
  userId: string
  status: "pending" | "approved" | "rejected"
  timestamp?: number
  comment?: string
}

export interface RiskAssessment {
  level: "low" | "medium" | "high" | "critical"
  factors: RiskFactor[]
  score: number
  mitigations: string[]
}

export interface RiskFactor {
  type: string
  description: string
  impact: number
  likelihood: number
}

export interface LogLineIdentity {
  id: string
  username: string
  email: string
  roles: string[]
  permissions: string[]
  contracts: string[]
  created: number
  lastActive: number
  status: "active" | "suspended" | "inactive"
}

// PII Detection and Masking Functionality
export interface PIIDetectionResult {
  hasPII: boolean
  piiTypes: string[]
  confidence: number
  maskedContent: string
  originalContent: string
}

export class PIIDetector {
  private static readonly PII_PATTERNS = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    passport: /\b[A-Z]{1,2}\d{6,9}\b/g,
    driverLicense: /\b[A-Z]{1,2}\d{6,8}\b/g,
    bankAccount: /\b\d{8,17}\b/g,
  }

  static detectPII(content: string): PIIDetectionResult {
    const detectedTypes: string[] = []
    let maskedContent = content
    let confidence = 0

    for (const [type, pattern] of Object.entries(this.PII_PATTERNS)) {
      const matches = content.match(pattern)
      if (matches && matches.length > 0) {
        detectedTypes.push(type)
        confidence += matches.length * 0.1

        // Apply masking based on type
        switch (type) {
          case "email":
            maskedContent = maskedContent.replace(pattern, "***@***.***")
            break
          case "ssn":
            maskedContent = maskedContent.replace(pattern, "***-**-****")
            break
          case "phone":
            maskedContent = maskedContent.replace(pattern, "***-***-****")
            break
          case "creditCard":
            maskedContent = maskedContent.replace(pattern, "****-****-****-****")
            break
          case "ipAddress":
            maskedContent = maskedContent.replace(pattern, "***.***.***.***")
            break
          default:
            maskedContent = maskedContent.replace(pattern, "***REDACTED***")
        }
      }
    }

    return {
      hasPII: detectedTypes.length > 0,
      piiTypes: detectedTypes,
      confidence: Math.min(confidence, 1.0),
      maskedContent,
      originalContent: content,
    }
  }

  static maskPIIInObject(obj: any, showPII = false): any {
    if (showPII) return obj

    if (typeof obj === "string") {
      return this.detectPII(obj).maskedContent
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.maskPIIInObject(item, showPII))
    }

    if (obj && typeof obj === "object") {
      const masked: any = {}
      for (const [key, value] of Object.entries(obj)) {
        masked[key] = this.maskPIIInObject(value, showPII)
      }
      return masked
    }

    return obj
  }
}

export class SecurityGovernanceEngine {
  private policies: Map<string, SecurityPolicy> = new Map()
  private contracts: Map<string, SecurityContract> = new Map()
  private approvals: Map<string, GovernanceApproval> = new Map()
  private identities: Map<string, LogLineIdentity> = new Map()
  private currentUser: LogLineIdentity | null = null

  constructor() {
    this.initializeDefaultPolicies()
    this.initializeDefaultIdentity()
  }

  private initializeDefaultPolicies() {
    // Default security policies
    const defaultPolicies: SecurityPolicy[] = [
      {
        id: "high-risk-approval",
        name: "High Risk Operations Require Approval",
        description: "Operations with high risk level must be approved before execution",
        rules: [
          {
            id: "rule-1",
            type: "require_approval",
            condition: { riskLevel: ["high", "critical"] },
            action: "require_governance_approval",
            priority: 1,
          },
        ],
        enabled: true,
        created: Date.now(),
        lastModified: Date.now(),
      },
      {
        id: "domain-restrictions",
        name: "Domain Access Restrictions",
        description: "Restrict access to sensitive domains",
        rules: [
          {
            id: "rule-2",
            type: "deny",
            condition: {
              targetDomains: ["admin.internal", "secure.company.com", "*.gov"],
            },
            action: "block_access",
            priority: 2,
          },
        ],
        enabled: true,
        created: Date.now(),
        lastModified: Date.now(),
      },
      {
        id: "business-hours",
        name: "Business Hours Only",
        description: "Restrict automation to business hours",
        rules: [
          {
            id: "rule-3",
            type: "deny",
            condition: {
              timeRestrictions: {
                allowedHours: { start: 9, end: 17 },
                allowedDays: [1, 2, 3, 4, 5], // Monday to Friday
              },
            },
            action: "time_restriction",
            priority: 3,
          },
        ],
        enabled: false, // Disabled by default
        created: Date.now(),
        lastModified: Date.now(),
      },
    ]

    defaultPolicies.forEach((policy) => this.policies.set(policy.id, policy))
  }

  private initializeDefaultIdentity() {
    const defaultUser: LogLineIdentity = {
      id: "user_default",
      username: "demo-user",
      email: "demo@loglinebrowser.com",
      roles: ["operator", "viewer"],
      permissions: ["span:create", "span:read", "span:simulate", "browser:navigate", "browser:read"],
      contracts: [],
      created: Date.now(),
      lastActive: Date.now(),
      status: "active",
    }

    this.identities.set(defaultUser.id, defaultUser)
    this.currentUser = defaultUser
  }

  // Security Policy Management
  async createPolicy(policy: Omit<SecurityPolicy, "id" | "created" | "lastModified">): Promise<string> {
    const policyId = `policy_${Date.now()}`
    const newPolicy: SecurityPolicy = {
      ...policy,
      id: policyId,
      created: Date.now(),
      lastModified: Date.now(),
    }

    this.policies.set(policyId, newPolicy)
    return policyId
  }

  async updatePolicy(policyId: string, updates: Partial<SecurityPolicy>): Promise<void> {
    const policy = this.policies.get(policyId)
    if (!policy) {
      throw new Error(`Policy ${policyId} not found`)
    }

    const updatedPolicy = {
      ...policy,
      ...updates,
      lastModified: Date.now(),
    }

    this.policies.set(policyId, updatedPolicy)
  }

  getPolicies(): SecurityPolicy[] {
    return Array.from(this.policies.values())
  }

  getPolicy(policyId: string): SecurityPolicy | undefined {
    return this.policies.get(policyId)
  }

  // Risk Assessment
  async assessSpanRisk(spanId: string): Promise<RiskAssessment> {
    const span = spanEngine.getSpan(spanId)
    if (!span) {
      throw new Error(`Span ${spanId} not found`)
    }

    const factors: RiskFactor[] = []
    let totalScore = 0

    // Assess based on span type
    switch (span.type) {
      case "navigation":
        factors.push({
          type: "navigation_risk",
          description: "Navigation to external domains",
          impact: 3,
          likelihood: 2,
        })
        totalScore += 6
        break
      case "write":
        factors.push({
          type: "data_modification",
          description: "Potential data modification",
          impact: 4,
          likelihood: 3,
        })
        totalScore += 12
        break
      case "gui_automation":
        factors.push({
          type: "user_interaction",
          description: "Automated user interactions",
          impact: 3,
          likelihood: 4,
        })
        totalScore += 12
        break
    }

    // Assess based on reversibility
    if (!span.reversible) {
      factors.push({
        type: "irreversible_action",
        description: "Action cannot be undone",
        impact: 5,
        likelihood: 5,
      })
      totalScore += 25
    }

    // Determine risk level
    let level: RiskAssessment["level"]
    if (totalScore <= 10) level = "low"
    else if (totalScore <= 20) level = "medium"
    else if (totalScore <= 35) level = "high"
    else level = "critical"

    const mitigations: string[] = []
    if (level === "high" || level === "critical") {
      mitigations.push("Require manual approval before execution")
      mitigations.push("Enable comprehensive audit logging")
    }
    if (!span.reversible) {
      mitigations.push("Create backup before execution")
    }

    return {
      level,
      factors,
      score: totalScore,
      mitigations,
    }
  }

  // Policy Evaluation
  async evaluateSpanAgainstPolicies(spanId: string): Promise<{
    allowed: boolean
    requiresApproval: boolean
    violations: string[]
    applicablePolicies: string[]
    piiDetected: boolean
    contractRequired: boolean
  }> {
    const span = spanEngine.getSpan(spanId)
    if (!span) {
      throw new Error(`Span ${spanId} not found`)
    }

    const riskAssessment = await this.assessSpanRisk(spanId)
    const violations: string[] = []
    const applicablePolicies: string[] = []
    let allowed = true
    let requiresApproval = false
    let contractRequired = false

    // Check for PII in span data
    const spanContent = JSON.stringify(span.args || {})
    const piiResult = PIIDetector.detectPII(spanContent)
    const piiDetected = piiResult.hasPII

    // PII Policy: Block execution if PII detected without approved contract
    if (piiDetected) {
      const hasApprovedContract = await this.hasApprovedPIIContract(spanId)
      if (!hasApprovedContract) {
        contractRequired = true
        requiresApproval = true
        violations.push("PII detected - contract approval required before execution")
      }
    }

    for (const policy of this.policies.values()) {
      if (!policy.enabled) continue

      for (const rule of policy.rules) {
        if (this.ruleApplies(rule, span, riskAssessment)) {
          applicablePolicies.push(policy.id)

          switch (rule.type) {
            case "deny":
              allowed = false
              violations.push(`Policy '${policy.name}': ${rule.action}`)
              break
            case "require_approval":
              requiresApproval = true
              break
          }
        }
      }
    }

    return {
      allowed,
      requiresApproval,
      violations,
      applicablePolicies,
      piiDetected,
      contractRequired,
    }
  }

  private async hasApprovedPIIContract(spanId: string): Promise<boolean> {
    // Check if there's an approved contract that covers PII handling for this span
    const approvals = Array.from(this.approvals.values())
    return approvals.some(
      (approval) =>
        approval.spanId === spanId &&
        approval.status === "approved" &&
        approval.riskAssessment.factors.some((factor) => factor.type.includes("pii")),
    )
  }

  // Governance Approval System
  async requestApproval(spanId: string): Promise<string> {
    if (!this.currentUser) {
      throw new Error("No authenticated user")
    }

    const riskAssessment = await this.assessSpanRisk(spanId)
    const approvalId = `approval_${Date.now()}`

    // Determine required approvers based on risk level
    const requiredApprovers = this.getRequiredApprovers(riskAssessment.level)

    const approval: GovernanceApproval = {
      id: approvalId,
      spanId,
      requestedBy: this.currentUser.id,
      requestedAt: Date.now(),
      approvers: requiredApprovers.map((userId) => ({
        userId,
        status: "pending",
      })),
      status: "pending",
      riskAssessment,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    }

    this.approvals.set(approvalId, approval)
    return approvalId
  }

  private getRequiredApprovers(riskLevel: RiskAssessment["level"]): string[] {
    // In a real system, this would query user roles and permissions
    switch (riskLevel) {
      case "low":
        return [] // No approval needed
      case "medium":
        return ["approver_1"] // One approver
      case "high":
        return ["approver_1", "approver_2"] // Two approvers
      case "critical":
        return ["approver_1", "approver_2", "security_admin"] // Three approvers including security admin
      default:
        return []
    }
  }

  async approveSpan(approvalId: string, userId: string, comment?: string): Promise<void> {
    const approval = this.approvals.get(approvalId)
    if (!approval) {
      throw new Error(`Approval ${approvalId} not found`)
    }

    if (approval.status !== "pending") {
      throw new Error(`Approval ${approvalId} is not pending`)
    }

    const approver = approval.approvers.find((a) => a.userId === userId)
    if (!approver) {
      throw new Error(`User ${userId} is not an approver for this request`)
    }

    approver.status = "approved"
    approver.timestamp = Date.now()
    approver.comment = comment

    // Check if all approvers have approved
    const allApproved = approval.approvers.every((a) => a.status === "approved")
    if (allApproved) {
      approval.status = "approved"
      // Update span status to allow execution
      const span = spanEngine.getSpan(approval.spanId)
      if (span && span.status === "awaiting_approval") {
        // This would normally be handled by the span engine
        console.log(`Span ${approval.spanId} approved for execution`)
      }
    }
  }

  async rejectSpan(approvalId: string, userId: string, comment?: string): Promise<void> {
    const approval = this.approvals.get(approvalId)
    if (!approval) {
      throw new Error(`Approval ${approvalId} not found`)
    }

    const approver = approval.approvers.find((a) => a.userId === userId)
    if (!approver) {
      throw new Error(`User ${userId} is not an approver for this request`)
    }

    approver.status = "rejected"
    approver.timestamp = Date.now()
    approver.comment = comment

    approval.status = "rejected"
  }

  getApprovals(): GovernanceApproval[] {
    return Array.from(this.approvals.values())
  }

  getPendingApprovals(): GovernanceApproval[] {
    return Array.from(this.approvals.values()).filter((a) => a.status === "pending")
  }

  // Identity Management
  getCurrentUser(): LogLineIdentity | null {
    return this.currentUser
  }

  async authenticateUser(username: string, password: string): Promise<LogLineIdentity> {
    // Simplified authentication - in real system would verify credentials
    const user = Array.from(this.identities.values()).find((u) => u.username === username)
    if (!user) {
      throw new Error("Invalid credentials")
    }

    user.lastActive = Date.now()
    this.currentUser = user
    return user
  }

  async createUser(userData: Omit<LogLineIdentity, "id" | "created" | "lastActive">): Promise<string> {
    const userId = `user_${Date.now()}`
    const user: LogLineIdentity = {
      ...userData,
      id: userId,
      created: Date.now(),
      lastActive: Date.now(),
    }

    this.identities.set(userId, user)
    return userId
  }

  getUsers(): LogLineIdentity[] {
    return Array.from(this.identities.values())
  }

  // Contract Management
  async createContract(contract: Omit<SecurityContract, "id" | "created">): Promise<string> {
    const contractId = `contract_${Date.now()}`
    const newContract: SecurityContract = {
      ...contract,
      id: contractId,
      created: Date.now(),
    }

    this.contracts.set(contractId, newContract)
    return contractId
  }

  getContracts(): SecurityContract[] {
    return Array.from(this.contracts.values())
  }

  // Security Validation Hook
  async validateSpanExecution(spanId: string): Promise<{
    canExecute: boolean
    requiresApproval: boolean
    approvalId?: string
    violations: string[]
    piiDetected: boolean
    contractRequired: boolean
  }> {
    const evaluation = await this.evaluateSpanAgainstPolicies(spanId)

    if (!evaluation.allowed) {
      return {
        canExecute: false,
        requiresApproval: false,
        violations: evaluation.violations,
        piiDetected: evaluation.piiDetected,
        contractRequired: evaluation.contractRequired,
      }
    }

    if (evaluation.requiresApproval || evaluation.contractRequired) {
      const approvalId = await this.requestApproval(spanId)
      return {
        canExecute: false,
        requiresApproval: true,
        approvalId,
        violations: [],
        piiDetected: evaluation.piiDetected,
        contractRequired: evaluation.contractRequired,
      }
    }

    return {
      canExecute: true,
      requiresApproval: false,
      violations: [],
      piiDetected: evaluation.piiDetected,
      contractRequired: false,
    }
  }

  async generatePIIContract(
    spanId: string,
    piiTypes: string[],
  ): Promise<{
    id: string
    title: string
    summary: string
    details: {
      scope: string[]
      risk_level: string
      estimated_cost: number
      estimated_time: number
      pii_handling: boolean
      pii_types: string[]
      benefits: string
    }
    status: string
    created: string
  }> {
    const contractId = `contract_pii_${Date.now()}`

    return {
      id: contractId,
      title: "PII Data Processing Contract",
      summary: `Contract for processing data containing ${piiTypes.join(", ")} information`,
      details: {
        scope: [
          "Process data containing personally identifiable information",
          "Apply appropriate data masking and anonymization",
          "Ensure compliance with data protection regulations",
          "Maintain audit trail of PII access",
        ],
        risk_level: "high",
        estimated_cost: 0.1,
        estimated_time: 45,
        pii_handling: true,
        pii_types: piiTypes,
        benefits: "Enables secure processing of sensitive data with appropriate safeguards and compliance measures",
      },
      status: "pending",
      created: new Date().toISOString(),
    }
  }
}

// Global security governance instance
export const securityGovernance = new SecurityGovernanceEngine()
