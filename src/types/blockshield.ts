export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ResponsePlan {
  action: string;
  priority: string;
  notifyAdmin: boolean;
}

export interface SecurityReport {
  user: string;
  agent: string;
  title: string;
  status: string;
  reasons: string[];
  auditHash: string;
  riskLevel: RiskLevel;
  riskScore: number;
  timestamp: string;
  incidentId: string;
  suspicious: boolean;
  generatedBy: string;
  responsePlan: ResponsePlan;
  executionMode: string;
  actionExecuted: boolean;
  responseStatus: string;
  aiInvestigation: string;
  canonicalRecord: string;
  detectionReasons: string[];
  recommendedActions: string[];
  requiresHumanApproval: boolean;
}

export interface IncidentRecord {
  id: number;
  incident_id: string;
  user_id: string;
  risk_level: RiskLevel;
  risk_score: number;
  report: SecurityReport;
  audit_hash: string;
  blockchain_status: string;
  created_at: string;
  canonical_record: string;
  owner_id: string | null;
  target?: string;
  targetType?: string;
}

export interface ScanRequest {
  user_id?: string;
  user?: string;
  query?: string;
  input?: string;
  type?: 'contract' | 'wallet' | 'transaction' | 'url' | 'activity' | 'custom';
  network?: string;
  activity?: string;
  risk?: string;
  score?: number;
  reasons?: string[];
  logs?: string[];
}

export interface WebhookConfig {
  detectUrl: string;
  adminLoginUrl: string;
}

export interface AdminAuthState {
  isAuthenticated: boolean;
  user: string | null;
  mode: 'live_n8n' | 'sandbox';
  loginTime: string | null;
  rawResponse?: unknown;
}
