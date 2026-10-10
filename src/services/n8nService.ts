import { IncidentRecord, ScanRequest, WebhookConfig } from '../types/blockshield';

export const DEFAULT_DETECT_WEBHOOK = 'https://laharika.app.n8n.cloud/webhook/blockshield-detect';
export const DEFAULT_ADMIN_WEBHOOK = 'https://laharika.app.n8n.cloud/webhook/blockshield-admin-login';

const STORAGE_KEYS = {
  INCIDENTS: 'blockshield_incidents_v1',
  WEBHOOK_CONFIG: 'blockshield_webhook_config_v1',
  ADMIN_AUTH: 'blockshield_admin_auth_v1',
};

export const getWebhookConfig = (): WebhookConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.WEBHOOK_CONFIG);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load webhook config:', e);
  }
  return {
    detectUrl: DEFAULT_DETECT_WEBHOOK,
    adminLoginUrl: DEFAULT_ADMIN_WEBHOOK,
  };
};

export const saveWebhookConfig = (config: WebhookConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.WEBHOOK_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save webhook config:', e);
  }
};

export const resetWebhookConfig = (): WebhookConfig => {
  const defaults = {
    detectUrl: DEFAULT_DETECT_WEBHOOK,
    adminLoginUrl: DEFAULT_ADMIN_WEBHOOK,
  };
  saveWebhookConfig(defaults);
  return defaults;
};

// Execute Detection against n8n webhook
export async function runBlockshieldDetect(
  request: ScanRequest,
  customUrl?: string
): Promise<{ success: boolean; data?: IncidentRecord; error?: string; latencyMs: number; status?: number }> {
  const url = customUrl || getWebhookConfig().detectUrl;
  const startTime = performance.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        error: `n8n Webhook Error (${response.status}): ${errText || response.statusText}`,
        latencyMs,
        status: response.status,
      };
    }

    const data: IncidentRecord = await response.json();
    
    // Enrich with target search metadata if available
    if (request.query || request.input || request.user) {
      data.target = request.query || request.input || request.user;
      data.targetType = request.type || 'wallet';
    }

    // Persist to local incident history
    saveIncidentToHistory(data);

    return {
      success: true,
      data,
      latencyMs,
      status: response.status,
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - startTime);
    const errorMessage = err instanceof Error ? err.message : 'Unknown network error';
    return {
      success: false,
      error: `Connection failure to ${url}: ${errorMessage}`,
      latencyMs,
    };
  }
}

// Execute Admin Login against n8n webhook
export async function executeAdminLogin(
  username: string,
  password: string,
  customUrl?: string
): Promise<{ success: boolean; data?: unknown; error?: string; status: number; latencyMs: number }> {
  const url = customUrl || getWebhookConfig().adminLoginUrl;
  const startTime = performance.now();

  try {
    const credentials = btoa(`${username}:${password}`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        username,
        password,
        action: 'login',
        timestamp: new Date().toISOString(),
      }),
    });

    const latencyMs = Math.round(performance.now() - startTime);
    const responseText = await response.text();

    let parsedData: unknown = responseText;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      // Keep as string if not JSON
    }

    if (!response.ok) {
      return {
        success: false,
        data: parsedData,
        error: responseText || `HTTP ${response.status} ${response.statusText}`,
        status: response.status,
        latencyMs,
      };
    }

    return {
      success: true,
      data: parsedData,
      status: response.status,
      latencyMs,
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - startTime);
    const msg = err instanceof Error ? err.message : 'Network error';
    return {
      success: false,
      error: `Network failure: ${msg}`,
      status: 0,
      latencyMs,
    };
  }
}

// History Management
export function getStoredIncidents(): IncidentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INCIDENTS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read incident history:', e);
  }
  return getSeedIncidents();
}

export function saveIncidentToHistory(incident: IncidentRecord): void {
  try {
    const existing = getStoredIncidents();
    // Prepend and dedup by incident_id
    const filtered = existing.filter((item) => item.incident_id !== incident.incident_id);
    const updated = [incident, ...filtered].slice(0, 50); // keep last 50
    localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save incident:', e);
  }
}

export function updateStoredIncident(incident: IncidentRecord): void {
  try {
    const existing = getStoredIncidents();
    const index = existing.findIndex((item) => item.incident_id === incident.incident_id);
    if (index !== -1) {
      existing[index] = incident;
      localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(existing));
    }
  } catch (e) {
    console.error('Failed to update incident:', e);
  }
}

export function clearStoredIncidents(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.INCIDENTS);
  } catch (e) {
    console.error('Failed to clear incident history:', e);
  }
}

// Seed incidents for demo and instant inspection
function getSeedIncidents(): IncidentRecord[] {
  return [
    {
      id: 14,
      incident_id: 'BS-1791569716114-70ual7',
      user_id: 'attacker_99',
      risk_level: 'HIGH',
      risk_score: 88,
      target: '0x3a4b9c1d8820f17e34928bcf9a410b392a8e771c',
      targetType: 'contract',
      report: {
        user: 'attacker_99',
        agent: 'Response Agent',
        title: 'BlockShield AI Security Incident Report',
        status: 'REPORT_GENERATED',
        reasons: ['Suspicious flashloan reentrancy drainer detected', 'Unauthorized vault withdrawal vector'],
        auditHash: '11f4f36d3ce511fab4df998d3b4e73c5e9617e8132292d5a94216181fbcdd889',
        riskLevel: 'HIGH',
        riskScore: 88,
        timestamp: '2026-10-09T18:15:16.114Z',
        incidentId: 'BS-1791569716114-70ual7',
        suspicious: true,
        generatedBy: 'BlockShield AI',
        responsePlan: {
          action: 'ISOLATE_CONTRACT_AND_FREEZE',
          priority: 'CRITICAL',
          notifyAdmin: true,
        },
        executionMode: 'AUTOMATED_SIMULATION',
        actionExecuted: true,
        responseStatus: 'PLAN_GENERATED',
        aiInvestigation: `User: attacker_99\n\nRisk Level: HIGH - Critical Smart Contract Vulnerability Exploitation Attempt\n\nEvidence:\n- Reentrancy pattern flagged during batch flashloan execution on liquidity pool\n- Calldata invokes unauthorized proxy delegatecall fallback\n- Transaction origin flagged in known malicious drainer cluster\n\nPossible Threat:\n- Full pool asset liquidation via recursive reentrancy fallback hook.\n- Potential loss: 500 ETH equivalent in collateralized tokens.\n\nInvestigation Findings:\n- An unverified proxy contract initiated multiple reentrancy attempts within block 21940212.\n- BlockShield Threat Detection Agent identified signature mismatch with standard ERC-4626 vault operations.\n\nRecommended Actions:\n1. Pause target vault deposit/withdrawal functions via emergency multi-sig.\n2. Blacklist calling contract address in on-chain firewall.\n3. Verify slippage and frontrunning protection parameters.`,
        canonicalRecord: '{"incidentId":"BS-1791569716114-70ual7","timestamp":"2026-10-09T18:15:16.114Z","user":"attacker_99","riskScore":88,"riskLevel":"HIGH","suspicious":true,"detectionReasons":["Reentrancy exploit vector","Flashloan manipulation"],"recommendedActions":["Pause Vault","Blacklist calling address"],"status":"REPORT_GENERATED"}',
        detectionReasons: ['Reentrancy exploit vector', 'Flashloan manipulation'],
        recommendedActions: ['Emergency Pause Vault', 'Blacklist Address', 'Notify On-Chain Security Ops'],
        requiresHumanApproval: true,
      },
      audit_hash: '11f4f36d3ce511fab4df998d3b4e73c5e9617e8132292d5a94216181fbcdd889',
      blockchain_status: 'ANCHORED_ETHEREUM_SEPOLIA',
      created_at: '2026-10-09T18:15:16.813Z',
      canonical_record: '{"incidentId":"BS-1791569716114-70ual7","timestamp":"2026-10-09T18:15:16.114Z","user":"attacker_99","riskScore":88,"riskLevel":"HIGH","suspicious":true,"detectionReasons":["Reentrancy exploit vector","Flashloan manipulation"],"recommendedActions":["Emergency Pause Vault","Blacklist Address"],"status":"REPORT_GENERATED"}',
      owner_id: 'sec_ops_admin',
    },
    {
      id: 13,
      incident_id: 'BS-1791569700987-73sbot',
      user_id: 'analyst_01',
      risk_level: 'LOW',
      risk_score: 5,
      target: '0xbb9bc244d798123fde783fcc1c72d3bb8c189413',
      targetType: 'contract',
      report: {
        user: 'analyst_01',
        agent: 'Response Agent',
        title: 'BlockShield AI Security Incident Report',
        status: 'REPORT_GENERATED',
        reasons: [],
        auditHash: '49a0d32117ae87259b59dc47c1d8009d6209bce62f89e1cc285a25b29a301a46',
        riskLevel: 'LOW',
        riskScore: 5,
        timestamp: '2026-10-09T18:15:00.987Z',
        incidentId: 'BS-1791569700987-73sbot',
        suspicious: false,
        generatedBy: 'BlockShield AI',
        responsePlan: {
          action: 'CONTINUE_MONITORING',
          priority: 'LOW',
          notifyAdmin: false,
        },
        executionMode: 'SIMULATION',
        actionExecuted: false,
        responseStatus: 'PLAN_GENERATED',
        aiInvestigation: `User: analyst_01\n\nRisk Level: LOW\n\nEvidence:\n- Detection analysis completed on verified ERC-20 staking contract.\n- Zero anomalous token minting or unindexed transfers detected.\n\nRecommended Actions:\n1. Maintain baseline anomaly monitoring.\n2. Periodic sanity checks for balance invariants.`,
        canonicalRecord: '{"incidentId":"BS-1791569700987-73sbot","timestamp":"2026-10-09T18:15:00.987Z","user":"analyst_01","riskScore":5,"riskLevel":"LOW","suspicious":false,"detectionReasons":[],"recommendedActions":["Continue monitoring"],"status":"REPORT_GENERATED"}',
        detectionReasons: [],
        recommendedActions: ['Continue monitoring'],
        requiresHumanApproval: false,
      },
      audit_hash: '49a0d32117ae87259b59dc47c1d8009d6209bce62f89e1cc285a25b29a301a46',
      blockchain_status: 'NOT_ANCHORED',
      created_at: '2026-10-09T18:15:01.793Z',
      canonical_record: '{"incidentId":"BS-1791569700987-73sbot","timestamp":"2026-10-09T18:15:00.987Z","user":"analyst_01","riskScore":5,"riskLevel":"LOW","suspicious":false,"detectionReasons":[],"recommendedActions":["Continue monitoring"],"status":"REPORT_GENERATED"}',
      owner_id: null,
    },
  ];
}
