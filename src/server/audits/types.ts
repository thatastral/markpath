export type FindingClassification = "confirmed" | "possible" | "needs_review" | "compliant";
export type AuditFinding = { platform: "github" | "figma"; location: string; ruleId: string; detected: string; expected: string; evidence: string; severity: "low" | "medium" | "high" | "critical"; confidence: number; classification: FindingClassification; recommendedAction: string };
