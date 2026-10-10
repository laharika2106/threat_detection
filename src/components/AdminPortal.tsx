import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  ShieldAlert,
  Server,
  Activity,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  KeyRound,
  RefreshCw,
  LogOut,
  Database,
  Sliders,
  ExternalLink,
  Plus,
  Trash2,
  Terminal,
  Clock,
} from 'lucide-react';
import { AdminAuthState, IncidentRecord, WebhookConfig } from '../types/blockshield';
import { executeAdminLogin } from '../services/n8nService';

interface AdminPortalProps {
  authState: AdminAuthState;
  setAuthState: (state: AdminAuthState) => void;
  incidents: IncidentRecord[];
  onUpdateIncidentStatus: (incidentId: string, newStatus: string) => void;
  webhookConfig: WebhookConfig;
}

interface SecurityRule {
  id: string;
  name: string;
  type: 'BLACKLIST' | 'AUTOPAUSE' | 'RATE_LIMIT';
  target: string;
  enabled: boolean;
  action: string;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  authState,
  setAuthState,
  incidents,
  onUpdateIncidentStatus,
  webhookConfig,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [lastResponseInfo, setLastResponseInfo] = useState<{ status: number; text: string; latencyMs: number } | null>(null);

  // Security Rules State
  const [rules, setRules] = useState<SecurityRule[]>([
    {
      id: 'rule_1',
      name: 'Block Known Flashloan Drainer Bytecode',
      type: 'AUTOPAUSE',
      target: '0x3a4b9c1d8820f17e34928bcf9a410b392a8e771c',
      enabled: true,
      action: 'Emergency Pause Pool',
    },
    {
      id: 'rule_2',
      name: 'Tornado Cash Intermediary Blacklist',
      type: 'BLACKLIST',
      target: '0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc',
      enabled: true,
      action: 'Drop Transaction Broadcast',
    },
    {
      id: 'rule_3',
      name: 'EIP-2612 Permit Phishing Blackhole',
      type: 'BLACKLIST',
      target: 'claim-uniswap-v4-airdrop.xyz',
      enabled: true,
      action: 'Block Domain & DNS Sinkhole',
    },
  ]);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleTarget, setNewRuleTarget] = useState('');
  const [newRuleType, setNewRuleType] = useState<'BLACKLIST' | 'AUTOPAUSE' | 'RATE_LIMIT'>('BLACKLIST');

  // Handle form submission to n8n webhook
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);
    setLastResponseInfo(null);

    try {
      const result = await executeAdminLogin(username.trim(), password.trim(), webhookConfig.adminLoginUrl);
      
      setLastResponseInfo({
        status: result.status,
        text: typeof result.data === 'string' ? result.data : JSON.stringify(result.data),
        latencyMs: result.latencyMs,
      });

      if (result.success) {
        setAuthState({
          isAuthenticated: true,
          user: username.trim(),
          mode: 'live_n8n',
          loginTime: new Date().toISOString(),
          rawResponse: result.data,
        });
      } else {
        if (result.status === 403 || result.status === 401) {
          setLoginError(
            `Authentication Denied (HTTP ${result.status}): ${result.error || 'Authorization data is wrong'}. The n8n Webhook node requires specific Basic Auth credentials set in the n8n Cloud workflow.`
          );
        } else {
          setLoginError(result.error || `Failed to authenticate with status ${result.status}`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setLoginError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSandboxLogin = () => {
    setAuthState({
      isAuthenticated: true,
      user: 'sec_admin_demo',
      mode: 'sandbox',
      loginTime: new Date().toISOString(),
      rawResponse: { mode: 'sandbox', access: 'full_admin_privileges' },
    });
  };

  const handleLogout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      mode: 'live_n8n',
      loginTime: null,
    });
    setPassword('');
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim() || !newRuleTarget.trim()) return;
    const newRule: SecurityRule = {
      id: `rule_${Date.now()}`,
      name: newRuleName.trim(),
      type: newRuleType,
      target: newRuleTarget.trim(),
      enabled: true,
      action: newRuleType === 'AUTOPAUSE' ? 'Emergency Pause' : 'Block & Drop',
    };
    setRules([newRule, ...rules]);
    setNewRuleName('');
    setNewRuleTarget('');
  };

  const toggleRule = (id: string) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  // If not authenticated, render the Cyber Gateway Login
  if (!authState.isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 p-3 shadow-lg shadow-cyan-500/10">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            BlockShield Admin Command Center
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Directly connected to n8n authentication webhook: <br />
            <span className="font-mono text-cyan-400 text-xs">/webhook/blockshield-admin-login</span>
          </p>
        </div>

        {/* Login Form Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm space-y-6">
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Admin Username (Basic Auth)</span>
                <span className="text-[10px] text-slate-500">n8n Credential</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="e.g. admin or rayudulaharika"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Admin Password / Secret Key</span>
                <span className="text-[10px] text-slate-500">Basic Auth Secret</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter n8n webhook password"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Target URL Banner */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="truncate mr-2">Target: {webhookConfig.adminLoginUrl}</span>
              <span className="text-emerald-400 flex items-center flex-shrink-0">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Live n8n
              </span>
            </div>

            {loginError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 space-y-2">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Authentication Failed</span>
                    <span>{loginError}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 pt-2 border-t border-rose-500/20">
                  Tip: The n8n workflow owner configured private Basic Auth credentials. If you are exploring the UI, click <strong>"Access Sandbox / Demo Admin Console"</strong> below to evaluate the complete dashboard.
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-medium text-xs text-white bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 transition shadow-lg shadow-cyan-600/25 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying via n8n Cloud...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Authenticate against n8n Webhook</span>
                </>
              )}
            </button>
          </form>

          {/* Sandbox Explorer Bypass */}
          <div className="pt-4 border-t border-slate-800 text-center space-y-3">
            <p className="text-xs text-slate-400">
              Need instant access to evaluate the administrative tools?
            </p>
            <button
              type="button"
              onClick={handleSandboxLogin}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-cyan-300 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 transition flex items-center justify-center space-x-2"
            >
              <Unlock className="w-4 h-4 text-cyan-400" />
              <span>Access Sandbox / Demo Admin Console</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Enterprise Dashboard
  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white">Security Command & Operations</h1>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  authState.mode === 'live_n8n'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                {authState.mode === 'live_n8n' ? 'Live n8n Authenticated' : 'Admin Sandbox Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Active Operator: <span className="text-slate-200 font-mono font-semibold">{authState.user}</span> •
              Login: {new Date(authState.loginTime || Date.now()).toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white flex items-center space-x-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 uppercase font-semibold flex items-center justify-between">
            <span>Threat Detection Agent</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono">ONLINE / ACTIVE</div>
          <div className="text-[11px] text-slate-500 font-mono">Endpoint: /blockshield-detect</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 uppercase font-semibold flex items-center justify-between">
            <span>Response Agent</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-xl font-bold text-cyan-400 font-mono">AUTONOMOUS</div>
          <div className="text-[11px] text-slate-500 font-mono">Mean Response: 1.2s</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Security Rules Active</div>
          <div className="text-xl font-bold text-white font-mono">{rules.filter((r) => r.enabled).length} Active</div>
          <div className="text-[11px] text-slate-500 font-mono">Firewall & Bytecode Filters</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Triage Queue</div>
          <div className="text-xl font-bold text-amber-400 font-mono">{incidents.length} Records</div>
          <div className="text-[11px] text-slate-500 font-mono">Anchored Immutability</div>
        </div>
      </div>

      {/* Security Firewall & Rules Engine */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center">
              <Sliders className="w-4 h-4 text-cyan-400 mr-2" />
              Automated Mitigation Policies & Rule Engine
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Rules executed by the Response Agent upon threat threshold breach
            </p>
          </div>
        </div>

        {/* Existing Rules List */}
        <div className="space-y-2.5">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                rule.enabled ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-950/30 border-slate-900 opacity-60'
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] px-2 py-0.2 rounded font-bold uppercase ${
                      rule.type === 'AUTOPAUSE'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {rule.type}
                  </span>
                  <span className="text-xs font-semibold text-white">{rule.name}</span>
                </div>
                <div className="text-xs text-slate-400 font-mono break-all">
                  Target: <span className="text-cyan-400">{rule.target}</span> • Action: {rule.action}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => toggleRule(rule.id)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                    rule.enabled
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {rule.enabled ? 'Enabled' : 'Disabled'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteRule(rule.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Rule Form */}
        <form onSubmit={handleAddRule} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="text-xs font-semibold text-slate-300 flex items-center">
            <Plus className="w-3.5 h-3.5 text-cyan-400 mr-1.5" />
            Add Threat Prevention Rule
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Rule description (e.g. Blacklist drainer)"
              value={newRuleName}
              onChange={(e) => setNewRuleName(e.target.value)}
              required
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <input
              type="text"
              placeholder="Target address, domain, or regex"
              value={newRuleTarget}
              onChange={(e) => setNewRuleTarget(e.target.value)}
              required
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex space-x-2">
              <select
                value={newRuleType}
                onChange={(e) => setNewRuleType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="BLACKLIST">BLACKLIST</option>
                <option value="AUTOPAUSE">AUTOPAUSE POOL</option>
                <option value="RATE_LIMIT">RATE LIMIT</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow transition flex-shrink-0"
              >
                Deploy Rule
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Incident Triage Operations Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center">
              <ShieldAlert className="w-4 h-4 text-cyan-400 mr-2" />
              Live Incident Triage & Resolution Stream
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review and resolve incident flags generated by the n8n Threat Detection Agent
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3 rounded-l-lg">Incident ID</th>
                <th className="p-3">User / Target</th>
                <th className="p-3">Risk Level</th>
                <th className="p-3">Response Plan</th>
                <th className="p-3">Blockchain State</th>
                <th className="p-3 rounded-r-lg text-right">Status Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {incidents.map((inc) => (
                <tr key={inc.incident_id || inc.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-3 font-mono font-bold text-cyan-400">{inc.incident_id || `BS-${inc.id}`}</td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-200">{inc.user_id || 'unknown'}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate max-w-[160px]">
                      {inc.target || inc.report?.auditHash?.slice(0, 16) + '...'}
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inc.risk_level === 'HIGH' || inc.risk_level === 'CRITICAL'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {inc.risk_level} ({inc.risk_score})
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-slate-300">
                    {inc.report?.responsePlan?.action || 'CONTINUE_MONITORING'}
                  </td>
                  <td className="p-3 font-mono text-[10px] text-slate-400">
                    {inc.blockchain_status || 'NOT_ANCHORED'}
                  </td>
                  <td className="p-3 text-right">
                    <select
                      value={inc.report?.status || 'REPORT_GENERATED'}
                      onChange={(e) => onUpdateIncidentStatus(inc.incident_id, e.target.value)}
                      className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-[11px] text-slate-200 focus:outline-none"
                    >
                      <option value="REPORT_GENERATED">OPEN</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="MITIGATED">MITIGATED</option>
                      <option value="RESOLVED">RESOLVED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
