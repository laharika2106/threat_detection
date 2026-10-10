import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  Search,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Copy,
  Download,
  Terminal,
  Activity,
  Layers,
  FileText,
  Clock,
  Sparkles,
  Link,
  Code2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { IncidentRecord, RiskLevel, ScanRequest } from '../types/blockshield';
import { runBlockshieldDetect } from '../services/n8nService';

interface DetectionScannerProps {
  onScanComplete: (incident: IncidentRecord) => void;
  activeIncident: IncidentRecord | null;
  setActiveIncident: (incident: IncidentRecord | null) => void;
}

const PRESET_SCENARIOS = [
  {
    id: 'drainer',
    title: 'Flashloan Reentrancy Drainer',
    category: 'Smart Contract',
    type: 'contract' as const,
    user: 'attacker_99',
    query: '0x3a4b9c1d8820f17e34928bcf9a410b392a8e771c',
    network: 'Ethereum Mainnet',
    activity: 'Suspicious flashloan reentrancy drainer detected on liquidity vault with unauthorized withdrawal attempt',
    reasons: ['Unauthorized withdrawal pattern', 'Recursive reentrancy hook', 'Flashloan exploitation vector'],
    badge: 'High Threat',
    badgeColor: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
  },
  {
    id: 'phishing',
    title: 'Uniswap Permit Phishing Signature',
    category: 'Phishing URL',
    type: 'url' as const,
    user: 'victim_signer',
    query: 'https://claim-uniswap-v4-airdrop.xyz/connect',
    network: 'Multi-Chain',
    activity: 'Off-chain ERC-2612 permit signature harvesting malicious spender approvals on fake Uniswap domain',
    reasons: ['Typosquatting phishing domain', 'Unbounded Permit spender approval', 'Known drainer contract address'],
    badge: 'Phishing Drainer',
    badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
  },
  {
    id: 'mixer',
    title: 'Sanctioned Mixer Fund Flow',
    category: 'Wallet Address',
    type: 'wallet' as const,
    user: '0x8576acc5369688',
    query: '0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc',
    network: 'Ethereum',
    activity: 'Tornado Cash relayer deposits linked to OFAC sanctioned address with rapid multichain bridge swaps',
    reasons: ['Tornado Cash relayer cluster', 'Sanction list match', 'Layering through cross-chain bridge'],
    badge: 'Compliance Risk',
    badgeColor: 'border-orange-500/30 text-orange-400 bg-orange-500/10',
  },
  {
    id: 'safe',
    title: 'Verified ERC-20 Staking Contract',
    category: 'Smart Contract',
    type: 'contract' as const,
    user: 'analyst_01',
    query: '0xbb9bc244d798123fde783fcc1c72d3bb8c189413',
    network: 'Ethereum',
    activity: 'Regular staking rewards distribution with multi-sig governance timelock confirmation',
    reasons: [],
    badge: 'Safe Baseline',
    badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
  },
];

export const DetectionScanner: React.FC<DetectionScannerProps> = ({
  onScanComplete,
  activeIncident,
  setActiveIncident,
}) => {
  const [targetQuery, setTargetQuery] = useState('0x3a4b9c1d8820f17e34928bcf9a410b392a8e771c');
  const [targetType, setTargetType] = useState<'contract' | 'wallet' | 'transaction' | 'url' | 'activity' | 'custom'>('contract');
  const [network, setNetwork] = useState('Ethereum Mainnet');
  const [userId, setUserId] = useState('attacker_99');
  const [activityNotes, setActivityNotes] = useState('Suspicious flashloan reentrancy drainer detected on liquidity vault with unauthorized withdrawal attempt');
  const [isRawJsonMode, setIsRawJsonMode] = useState(false);
  const [rawJsonPayload, setRawJsonPayload] = useState(
    JSON.stringify(
      {
        user: 'attacker_99',
        query: '0x3a4b9c1d8820f17e34928bcf9a410b392a8e771c',
        type: 'contract',
        network: 'Ethereum Mainnet',
        activity: 'Suspicious flashloan reentrancy drainer detected on liquidity vault with unauthorized withdrawal attempt',
        reasons: ['Unauthorized withdrawal pattern', 'Recursive reentrancy hook', 'Flashloan exploitation vector'],
      },
      null,
      2
    )
  );

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [scanLatency, setScanLatency] = useState<number | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [activeTab, setActiveReportTab] = useState<'ai' | 'response' | 'ledger' | 'raw'>('ai');
  const [isAnchoredLocal, setIsAnchoredLocal] = useState(false);

  // Apply a preset scenario
  const applyPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setTargetQuery(preset.query);
    setTargetType(preset.type);
    setNetwork(preset.network);
    setUserId(preset.user);
    setActivityNotes(preset.activity);

    const payloadObj = {
      user: preset.user,
      query: preset.query,
      type: preset.type,
      network: preset.network,
      activity: preset.activity,
      reasons: preset.reasons,
    };
    setRawJsonPayload(JSON.stringify(payloadObj, null, 2));
  };

  // Trigger the detection scan against n8n webhook
  const handleTriggerScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorNotice(null);
    setIsAnchoredLocal(false);

    // Step 1: Dispatching
    setLoadingStep('Dispatching payload to n8n Threat Detection Webhook...');
    await new Promise((r) => setTimeout(r, 450));

    // Step 2: Agent analysis
    setLoadingStep('Threat Detection Agent parsing telemetry & calculating risk score...');

    try {
      let requestPayload: ScanRequest;

      if (isRawJsonMode) {
        try {
          requestPayload = JSON.parse(rawJsonPayload);
        } catch {
          setErrorNotice('Invalid JSON payload in custom editor. Please fix syntax errors.');
          setIsLoading(false);
          return;
        }
      } else {
        requestPayload = {
          user: userId.trim() || 'unknown',
          user_id: userId.trim() || 'unknown',
          query: targetQuery.trim(),
          input: targetQuery.trim(),
          type: targetType,
          network,
          activity: activityNotes.trim(),
          reasons: activityNotes.trim() ? [activityNotes.trim()] : [],
        };
      }

      const result = await runBlockshieldDetect(requestPayload);
      setScanLatency(result.latencyMs);

      if (result.success && result.data) {
        setLoadingStep('Response Agent synthesizing incident report & audit hash...');
        await new Promise((r) => setTimeout(r, 400));

        setActiveIncident(result.data);
        onScanComplete(result.data);
        if (result.data.blockchain_status && result.data.blockchain_status.includes('ANCHOR')) {
          setIsAnchoredLocal(true);
        }
      } else {
        setErrorNotice(result.error || 'Failed to receive analysis from BlockShield Detect');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorNotice(msg);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const downloadIncidentJson = () => {
    if (!activeIncident) return;
    const blob = new Blob([JSON.stringify(activeIncident, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeIncident.incident_id || 'incident'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const simulateBlockchainAnchor = () => {
    setIsAnchoredLocal(true);
  };

  // Helper for risk badge colors
  const getRiskColor = (risk: RiskLevel | string) => {
    const r = (risk || 'LOW').toUpperCase();
    if (r === 'CRITICAL') return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', fill: 'bg-rose-500' };
    if (r === 'HIGH') return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', fill: 'bg-amber-500' };
    if (r === 'MEDIUM') return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', fill: 'bg-yellow-500' };
    return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', fill: 'bg-emerald-500' };
  };

  return (
    <div className="space-y-8">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 p-6 md:p-8">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium">
              <Zap className="w-3.5 h-3.5" />
              <span>BlockShield Live Autonomous Agent Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Web3 & Cloud Threat Detection Console
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Auditing contracts, crypto wallets, phishing vectors, and anomalous telemetry via the BlockShield n8n intelligence agent pipeline.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
              <div className="flex items-center space-x-2 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-slate-300">Endpoint:</span>
                <span className="text-cyan-400">/webhook/blockshield-detect</span>
              </div>
              <div className="text-[11px] text-slate-500">Method: POST • SSL / Cloudflare Edge</div>
            </div>
          </div>
        </div>

        {/* Preset Scenarios selector */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
              Quick Threat Scenarios
            </span>
            <span className="text-[11px] text-slate-500">Click to pre-fill scan parameters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {PRESET_SCENARIOS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className="text-left p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white group-hover:text-cyan-400 transition truncate">
                    {preset.title}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${preset.badgeColor}`}>
                    {preset.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate font-mono">{preset.query}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Input Form (Left) & Live Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Scan Configuration & Trigger */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Search className="w-4 h-4" />
                </div>
                <h2 className="text-base font-semibold text-white">Scan Parameters</h2>
              </div>

              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setIsRawJsonMode(false)}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    !isRawJsonMode ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Standard Form
                </button>
                <button
                  type="button"
                  onClick={() => setIsRawJsonMode(true)}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    isRawJsonMode ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Raw JSON
                </button>
              </div>
            </div>

            <form onSubmit={handleTriggerScan} className="space-y-4">
              {!isRawJsonMode ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Target Query (Address / URL / Tx)</span>
                      <span className="text-[10px] text-cyan-400 font-mono">Required</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={targetQuery}
                        onChange={(e) => setTargetQuery(e.target.value)}
                        placeholder="0x... contract address or malicious domain"
                        required
                        className="w-full pl-3.5 pr-8 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Target Category</label>
                      <select
                        value={targetType}
                        onChange={(e) => setTargetType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="contract">Smart Contract</option>
                        <option value="wallet">Crypto Wallet</option>
                        <option value="transaction">Transaction Hash</option>
                        <option value="url">Phishing / Scam URL</option>
                        <option value="activity">Identity / Telemetry</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Blockchain / Network</label>
                      <select
                        value={network}
                        onChange={(e) => setNetwork(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Ethereum Mainnet">Ethereum Mainnet</option>
                        <option value="Arbitrum One">Arbitrum One</option>
                        <option value="Optimism">Optimism</option>
                        <option value="Base">Base</option>
                        <option value="Solana">Solana</option>
                        <option value="Binance Smart Chain">BNB Smart Chain</option>
                        <option value="Polygon">Polygon POS</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center justify-between">
                      <span>User / Initiator ID</span>
                      <span className="text-[10px] text-slate-500">Passed to Threat Agent</span>
                    </label>
                    <input
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      placeholder="e.g. attacker_99 or sec_analyst"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Threat Context / Telemetry Notes
                    </label>
                    <textarea
                      rows={3}
                      value={activityNotes}
                      onChange={(e) => setActivityNotes(e.target.value)}
                      placeholder="Detailed observed behaviors, anomalous function calls, or drainer signatures..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">Raw JSON Webhook Body</label>
                    <button
                      type="button"
                      onClick={() =>
                        setRawJsonPayload(
                          JSON.stringify(
                            {
                              user: userId || 'unknown',
                              query: targetQuery,
                              type: targetType,
                              network,
                              activity: activityNotes,
                              reasons: activityNotes ? [activityNotes] : [],
                            },
                            null,
                            2
                          )
                        )
                      }
                      className="text-[10px] text-cyan-400 hover:underline flex items-center"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Sync from form
                    </button>
                  </div>
                  <textarea
                    rows={12}
                    value={rawJsonPayload}
                    onChange={(e) => setRawJsonPayload(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              {errorNotice && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Scan Error: </span>
                    <span>{errorNotice}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-medium text-xs text-white bg-gradient-to-r from-cyan-600 via-cyan-500 to-emerald-500 hover:from-cyan-500 hover:to-emerald-400 transition shadow-lg shadow-cyan-600/25 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Analyzing via n8n Agent...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Initiate BlockShield Scan</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Webhook Execution Pipeline Status Indicator */}
          {isLoading && (
            <div className="p-4 bg-slate-900 border border-cyan-500/40 rounded-xl shadow-lg space-y-3 animate-pulse">
              <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold">
                <Activity className="w-4 h-4 animate-spin" />
                <span>Autonomous Threat Agent In-Flight</span>
              </div>
              <p className="text-xs text-slate-300 font-mono">{loadingStep}</p>
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-1.5 rounded-full w-2/3 animate-pulse" />
              </div>
            </div>
          )}

          {/* Endpoint Live Card */}
          <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl text-xs space-y-2 text-slate-400">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <span className="flex items-center">
                <Lock className="w-3.5 h-3.5 text-cyan-400 mr-1.5" />
                Cryptographic Anchor Pipeline
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                SHA-256 Immutability
              </span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Every analyzed incident produces a deterministic canonical record and cryptographic audit hash verifiable on-chain.
            </p>
          </div>
        </div>

        {/* Right Column: Deep Incident Inspector */}
        <div className="lg:col-span-7">
          {activeIncident ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              {/* Header Card */}
              <div className="p-6 border-b border-slate-800 bg-gradient-to-b from-slate-800/40 to-slate-900/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono text-cyan-400 font-bold">
                        {activeIncident.incident_id || `BS-${activeIncident.id}`}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        Agent: {activeIncident.report?.agent || 'BlockShield Response Agent'}
                      </span>
                      {scanLatency !== null && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          ⚡ {scanLatency}ms
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {activeIncident.report?.title || 'Security Incident Assessment'}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center space-x-3">
                      <span>User ID: <strong className="text-slate-200 font-mono">{activeIncident.user_id || 'unknown'}</strong></span>
                      <span>•</span>
                      <span>Created: {new Date(activeIncident.created_at || Date.now()).toLocaleTimeString()}</span>
                    </p>
                  </div>

                  {/* Risk Gauge Pill */}
                  <div className="flex items-center space-x-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Risk Score
                      </div>
                      <div className="text-xl font-extrabold text-white font-mono">
                        {activeIncident.risk_score}
                        <span className="text-xs text-slate-500 font-normal">/100</span>
                      </div>
                    </div>

                    <div
                      className={`px-3 py-1.5 rounded-lg border font-bold text-xs uppercase tracking-wider ${
                        getRiskColor(activeIncident.risk_level).bg
                      } ${getRiskColor(activeIncident.risk_level).text} ${
                        getRiskColor(activeIncident.risk_level).border
                      }`}
                    >
                      {activeIncident.risk_level || 'LOW'}
                    </div>
                  </div>
                </div>

                {/* Risk Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-700 ${
                        getRiskColor(activeIncident.risk_level).fill
                      }`}
                      style={{ width: `${Math.max(activeIncident.risk_score, 8)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Inspector Tabs */}
              <div className="flex border-b border-slate-800 bg-slate-950/60 px-6">
                <button
                  type="button"
                  onClick={() => setActiveReportTab('ai')}
                  className={`flex items-center space-x-2 py-3 px-3 text-xs font-semibold border-b-2 transition ${
                    activeTab === 'ai'
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>AI Investigation</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveReportTab('response')}
                  className={`flex items-center space-x-2 py-3 px-3 text-xs font-semibold border-b-2 transition ${
                    activeTab === 'response'
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Response Plan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveReportTab('ledger')}
                  className={`flex items-center space-x-2 py-3 px-3 text-xs font-semibold border-b-2 transition ${
                    activeTab === 'ledger'
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Link className="w-3.5 h-3.5" />
                  <span>Blockchain & Audit Hash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveReportTab('raw')}
                  className={`flex items-center space-x-2 py-3 px-3 text-xs font-semibold border-b-2 transition ${
                    activeTab === 'raw'
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Canonical JSON</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-6 space-y-6">
                {/* 1. AI Investigation */}
                {activeTab === 'ai' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center font-medium text-slate-300">
                        <Sparkles className="w-4 h-4 text-cyan-400 mr-1.5" />
                        Autonomous AI Reasoning
                      </span>
                      <button
                        onClick={() => copyToClipboard(activeIncident.report?.aiInvestigation || '', 'ai_report')}
                        className="hover:text-white flex items-center space-x-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copySuccess === 'ai_report' ? 'Copied!' : 'Copy Analysis'}</span>
                      </button>
                    </div>

                    <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {activeIncident.report?.aiInvestigation || 'No detailed AI investigation notes generated.'}
                    </div>

                    {/* Reasons & Recommended actions pills */}
                    {activeIncident.report?.recommendedActions && activeIncident.report.recommendedActions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-slate-300">Recommended Mitigations:</h4>
                        <div className="flex flex-wrap gap-2">
                          {activeIncident.report.recommendedActions.map((action, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs flex items-center"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1.5 text-cyan-400" />
                              {action}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Response Plan */}
                {activeTab === 'response' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[11px] text-slate-400 mb-1">Response Action</div>
                        <div className="text-sm font-bold text-white font-mono truncate">
                          {activeIncident.report?.responsePlan?.action || 'CONTINUE_MONITORING'}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[11px] text-slate-400 mb-1">Priority Level</div>
                        <div className="text-sm font-bold text-amber-400 font-mono">
                          {activeIncident.report?.responsePlan?.priority || 'LOW'}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[11px] text-slate-400 mb-1">Admin Notification</div>
                        <div className="text-sm font-bold font-mono">
                          {activeIncident.report?.responsePlan?.notifyAdmin ? (
                            <span className="text-rose-400">DISPATCHED</span>
                          ) : (
                            <span className="text-emerald-400">STANDBY</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Execution Mode</span>
                        <span className="font-mono text-cyan-400">
                          {activeIncident.report?.executionMode || 'SIMULATION'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Response Status</span>
                        <span className="font-mono text-emerald-400">
                          {activeIncident.report?.responseStatus || 'PLAN_GENERATED'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Human Approval Required</span>
                        <span className="font-mono text-slate-300">
                          {activeIncident.report?.requiresHumanApproval ? 'YES (High Impact)' : 'NO (Autonomous)'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Blockchain & Audit Hash */}
                {activeTab === 'ledger' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300">Cryptographic Audit Hash</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(activeIncident.audit_hash || '', 'hash')}
                          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copySuccess === 'hash' ? 'Copied!' : 'Copy SHA-256'}</span>
                        </button>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 break-all select-all">
                        {activeIncident.audit_hash || 'None generated'}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Blockchain Ledger State</div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              isAnchoredLocal ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                          />
                          <span className="text-xs font-mono font-bold text-white">
                            {isAnchoredLocal ? 'ANCHORED_ETHEREUM_L2' : activeIncident.blockchain_status || 'NOT_ANCHORED'}
                          </span>
                        </div>
                      </div>

                      {!isAnchoredLocal ? (
                        <button
                          type="button"
                          onClick={simulateBlockchainAnchor}
                          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow flex items-center justify-center space-x-2"
                        >
                          <Link className="w-3.5 h-3.5" />
                          <span>Anchor Incident on Chain</span>
                        </button>
                      ) : (
                        <div className="text-xs text-emerald-400 font-mono flex items-center">
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          <span>Block 21,940,318 Verified</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Canonical JSON */}
                {activeTab === 'raw' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Deterministic Canonical Payload</span>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(activeIncident, null, 2), 'raw')}
                        className="hover:text-white flex items-center space-x-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copySuccess === 'raw' ? 'Copied!' : 'Copy JSON'}</span>
                      </button>
                    </div>

                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-96">
                      {JSON.stringify(activeIncident, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Bottom Footer Actions */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">
                  Origin: <strong className="text-slate-400 font-semibold">BlockShield n8n Cloud</strong>
                </span>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={downloadIncidentJson}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center space-x-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[420px] rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-cyan-400">
                <Shield className="w-10 h-10 animate-pulse text-cyan-400" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-base font-bold text-white">No Active Scan Triggered</h3>
                <p className="text-xs text-slate-400">
                  Select a preset threat scenario or input an address on the left to invoke the BlockShield n8n detection engine.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
