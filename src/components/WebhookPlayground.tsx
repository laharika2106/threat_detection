import React, { useState } from 'react';
import {
  Terminal,
  Cpu,
  Lock,
  Play,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  RefreshCw,
  Zap,
  Globe,
  Layers,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { WebhookConfig } from '../types/blockshield';
import { runBlockshieldDetect, executeAdminLogin } from '../services/n8nService';

interface WebhookPlaygroundProps {
  webhookConfig: WebhookConfig;
}

export const WebhookPlayground: React.FC<WebhookPlaygroundProps> = ({ webhookConfig }) => {
  const [activeEndpoint, setActiveEndpoint] = useState<'detect' | 'admin'>('detect');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Detect Ping State
  const [detectTesting, setDetectTesting] = useState(false);
  const [detectResult, setDetectResult] = useState<{ status: number; latency: number; payload: string } | null>(null);

  // Admin Ping State
  const [adminTesting, setAdminTesting] = useState(false);
  const [adminResult, setAdminResult] = useState<{ status: number; latency: number; payload: string } | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const testDetectEndpoint = async () => {
    setDetectTesting(true);
    setDetectResult(null);
    try {
      const res = await runBlockshieldDetect({
        user: 'ping_test_agent',
        query: '0xbb9bc244d798123fde783fcc1c72d3bb8c189413',
        type: 'contract',
      });
      setDetectResult({
        status: res.status || (res.success ? 200 : 500),
        latency: res.latencyMs,
        payload: JSON.stringify(res.data || { error: res.error }, null, 2),
      });
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : 'Error';
      setDetectResult({ status: 500, latency: 0, payload: err });
    } finally {
      setDetectTesting(false);
    }
  };

  const testAdminEndpoint = async () => {
    setAdminTesting(true);
    setAdminResult(null);
    try {
      const res = await executeAdminLogin('probe_agent', 'probe_secret', webhookConfig.adminLoginUrl);
      setAdminResult({
        status: res.status,
        latency: res.latencyMs,
        payload: typeof res.data === 'string' ? res.data : JSON.stringify(res.data || { error: res.error }, null, 2),
      });
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : 'Error';
      setAdminResult({ status: 500, latency: 0, payload: err });
    } finally {
      setAdminTesting(false);
    }
  };

  const detectCurlSnippet = `curl -X POST "${webhookConfig.detectUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "user": "sec_analyst_01",
    "query": "0x3a4b9c1d8820f17e34928bcf9a410b392a8e771c",
    "type": "contract",
    "network": "Ethereum Mainnet",
    "activity": "Reentrancy pattern detected during flashloan execution"
  }'`;

  const adminCurlSnippet = `curl -X POST "${webhookConfig.adminLoginUrl}" \\
  -u "admin:YOUR_N8N_PASSWORD" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "login",
    "username": "admin"
  }'`;

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold">
              <Terminal className="w-3.5 h-3.5" />
              <span>Integration Blueprint & Webhook Specifications</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">n8n Cloud Webhook Playground</h1>
            <p className="text-sm text-slate-400">
              Interactive test bench and architectural documentation for the two BlockShield n8n endpoints.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono">
              <Globe className="w-3.5 h-3.5 text-cyan-400 mr-2" />
              laharika.app.n8n.cloud
            </span>
          </div>
        </div>

        {/* Multi-Agent Architecture Diagram */}
        <div className="mt-4 p-5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-4">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
            <Layers className="w-4 h-4 text-cyan-400 mr-2" />
            n8n Autonomous Multi-Agent Pipeline Workflow
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-[10px] text-cyan-400 font-mono font-bold">STAGE 1: INGESTION</div>
              <div className="font-semibold text-white">Webhook Trigger</div>
              <div className="text-slate-400 text-[11px]">
                Validates JSON body & Basic Auth headers on Cloudflare edge.
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-[10px] text-amber-400 font-mono font-bold">STAGE 2: EVALUATION</div>
              <div className="font-semibold text-white">Threat Detection Agent</div>
              <div className="text-slate-400 text-[11px]">
                Correlates bytecode, sender telemetry, & calculates risk score (0-100).
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-[10px] text-emerald-400 font-mono font-bold">STAGE 3: SYNTHESIS</div>
              <div className="font-semibold text-white">Response Agent</div>
              <div className="text-slate-400 text-[11px]">
                Synthesizes AI investigation, mitigation plan, & admin dispatch flags.
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-[10px] text-purple-400 font-mono font-bold">STAGE 4: ATTESTATION</div>
              <div className="font-semibold text-white">Audit Hash Anchor</div>
              <div className="text-slate-400 text-[11px]">
                Produces deterministic canonical record & SHA-256 ledger digest.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Detect Webhook vs Admin Webhook */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveEndpoint('detect')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeEndpoint === 'detect'
              ? 'bg-cyan-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>1. BlockShield Detect Webhook</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveEndpoint('admin')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeEndpoint === 'admin'
              ? 'bg-cyan-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>2. BlockShield Admin Login Webhook</span>
        </button>
      </div>

      {/* Endpoint 1: Detect */}
      {activeEndpoint === 'detect' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs">
                      POST
                    </span>
                    <span className="text-xs font-mono text-cyan-400 break-all">{webhookConfig.detectUrl}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Autonomous threat detection, analysis, and report generation</p>
                </div>
              </div>

              {/* cURL Snippet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                  <span>cURL Command Snippet</span>
                  <button
                    onClick={() => copyToClipboard(detectCurlSnippet, 'curl_detect')}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedKey === 'curl_detect' ? 'Copied!' : 'Copy cURL'}</span>
                  </button>
                </div>
                <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
                  {detectCurlSnippet}
                </pre>
              </div>

              {/* Supported JSON Body Schema */}
              <div className="space-y-2">
                <div className="text-xs text-slate-300 font-semibold">JSON Request Body Schema</div>
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1.5">
                  <div>
                    <span className="text-cyan-400 font-bold">user</span> / <span className="text-cyan-400 font-bold">user_id</span>:{' '}
                    <span className="text-slate-400">string (e.g. &quot;attacker_99&quot;, &quot;analyst_01&quot;)</span>
                  </div>
                  <div>
                    <span className="text-cyan-400 font-bold">query</span> / <span className="text-cyan-400 font-bold">input</span>:{' '}
                    <span className="text-slate-400">string (Contract, Wallet, Transaction, URL)</span>
                  </div>
                  <div>
                    <span className="text-cyan-400 font-bold">type</span>:{' '}
                    <span className="text-slate-400">&quot;contract&quot; | &quot;wallet&quot; | &quot;transaction&quot; | &quot;url&quot; | &quot;activity&quot;</span>
                  </div>
                  <div>
                    <span className="text-cyan-400 font-bold">network</span>:{' '}
                    <span className="text-slate-400">string (e.g. &quot;Ethereum Mainnet&quot;, &quot;Solana&quot;)</span>
                  </div>
                  <div>
                    <span className="text-cyan-400 font-bold">activity</span> / <span className="text-cyan-400 font-bold">reasons</span>:{' '}
                    <span className="text-slate-400">string or array of threat indicators</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Live Runner Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="text-sm font-bold text-white flex items-center">
                  <Play className="w-4 h-4 text-cyan-400 mr-2" />
                  Live Webhook Ping Tester
                </div>
                <button
                  type="button"
                  onClick={testDetectEndpoint}
                  disabled={detectTesting}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {detectTesting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Pinging...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Execute Live Test</span>
                    </>
                  )}
                </button>
              </div>

              {detectResult ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">HTTP Status:</span>
                      <span className={`font-bold ${detectResult.status === 200 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {detectResult.status} OK
                      </span>
                    </div>
                    <div className="text-cyan-400">⚡ {detectResult.latency}ms</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] text-slate-400 font-semibold">Response Payload:</div>
                    <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 max-h-72 overflow-y-auto">
                      {detectResult.payload}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl bg-slate-950 border border-dashed border-slate-800 text-xs text-slate-500 space-y-2">
                  <Cpu className="w-6 h-6 mx-auto text-slate-600" />
                  <p>Click &quot;Execute Live Test&quot; above to dispatch a test payload directly to the n8n detect webhook.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Endpoint 2: Admin Login */}
      {activeEndpoint === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono font-bold text-xs">
                      POST
                    </span>
                    <span className="text-xs font-mono text-cyan-400 break-all">{webhookConfig.adminLoginUrl}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Admin authentication and enterprise policy control gateway</p>
                </div>
              </div>

              {/* cURL Snippet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                  <span>cURL Command Snippet (with Basic Auth)</span>
                  <button
                    onClick={() => copyToClipboard(adminCurlSnippet, 'curl_admin')}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedKey === 'curl_admin' ? 'Copied!' : 'Copy cURL'}</span>
                  </button>
                </div>
                <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-amber-400 overflow-x-auto">
                  {adminCurlSnippet}
                </pre>
              </div>

              {/* Auth Details */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
                <div className="font-semibold text-white flex items-center">
                  <Lock className="w-3.5 h-3.5 text-amber-400 mr-2" />
                  Authentication Mechanism: HTTP Basic Auth
                </div>
                <p className="text-slate-400 leading-relaxed">
                  The n8n webhook node is configured with Basic Auth verification. It expects an HTTP header:
                </p>
                <div className="p-2.5 rounded bg-slate-900 font-mono text-cyan-400 text-[11px]">
                  Authorization: Basic base64(username:password)
                </div>
                <p className="text-slate-500 text-[11px]">
                  If credentials do not match, n8n responds with <span className="font-mono text-rose-400">403 &quot;Authorization data is wrong!&quot;</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Test Live Admin Runner Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="text-sm font-bold text-white flex items-center">
                  <Play className="w-4 h-4 text-cyan-400 mr-2" />
                  Admin Webhook Probe Tester
                </div>
                <button
                  type="button"
                  onClick={testAdminEndpoint}
                  disabled={adminTesting}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {adminTesting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Probing...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Probe Endpoint</span>
                    </>
                  )}
                </button>
              </div>

              {adminResult ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">HTTP Status:</span>
                      <span className={`font-bold ${adminResult.status === 200 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {adminResult.status} {adminResult.status === 403 ? 'FORBIDDEN (Auth Required)' : ''}
                      </span>
                    </div>
                    <div className="text-cyan-400">⚡ {adminResult.latency}ms</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] text-slate-400 font-semibold">Response Content:</div>
                    <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-amber-300 max-h-72 overflow-y-auto">
                      {adminResult.payload}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl bg-slate-950 border border-dashed border-slate-800 text-xs text-slate-500 space-y-2">
                  <Lock className="w-6 h-6 mx-auto text-slate-600" />
                  <p>Click &quot;Probe Endpoint&quot; to test network reachability and verify Cloudflare & Basic Auth response behavior.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
