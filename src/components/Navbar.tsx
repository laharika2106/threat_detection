import React, { useState } from 'react';
import { Shield, ShieldAlert, Cpu, Terminal, Lock, Settings, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { WebhookConfig } from '../types/blockshield';

interface NavbarProps {
  activeTab: 'detect' | 'incidents' | 'admin' | 'playground';
  setActiveTab: (tab: 'detect' | 'incidents' | 'admin' | 'playground') => void;
  webhookConfig: WebhookConfig;
  onUpdateConfig: (config: WebhookConfig) => void;
  onResetConfig: () => WebhookConfig;
  totalIncidents: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  webhookConfig,
  onUpdateConfig,
  onResetConfig,
  totalIncidents,
}) => {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempDetectUrl, setTempDetectUrl] = useState(webhookConfig.detectUrl);
  const [tempAdminUrl, setTempAdminUrl] = useState(webhookConfig.adminLoginUrl);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      detectUrl: tempDetectUrl.trim(),
      adminLoginUrl: tempAdminUrl.trim(),
    });
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      setShowConfigModal(false);
    }, 900);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('detect')}>
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-cyan-500 to-emerald-400 p-[1px] shadow-lg shadow-cyan-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold tracking-tight text-white">BlockShield</span>
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    AI AGENT
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>n8n Cloud Autonomous Engine</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/60">
              <button
                onClick={() => setActiveTab('detect')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'detect'
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Threat Detection</span>
              </button>

              <button
                onClick={() => setActiveTab('incidents')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'incidents'
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Incident Feed</span>
                {totalIncidents > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-cyan-300 font-mono">
                    {totalIncidents}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
              </button>

              <button
                onClick={() => setActiveTab('playground')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'playground'
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>n8n Webhooks & API</span>
              </button>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2">
              <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-mono text-slate-400">laharika.app.n8n.cloud</span>
              </div>

              <button
                onClick={() => setShowConfigModal(true)}
                title="Configure Webhook Endpoints"
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-900 bg-slate-950 px-2">
          <button
            onClick={() => setActiveTab('detect')}
            className={`flex flex-col items-center py-1 px-2 rounded text-[11px] ${
              activeTab === 'detect' ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Cpu className="w-4 h-4 mb-0.5" />
            Detect
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
            className={`flex flex-col items-center py-1 px-2 rounded text-[11px] ${
              activeTab === 'incidents' ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            <ShieldAlert className="w-4 h-4 mb-0.5" />
            Incidents
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center py-1 px-2 rounded text-[11px] ${
              activeTab === 'admin' ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Lock className="w-4 h-4 mb-0.5" />
            Admin
          </button>
          <button
            onClick={() => setActiveTab('playground')}
            className={`flex flex-col items-center py-1 px-2 rounded text-[11px] ${
              activeTab === 'playground' ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Terminal className="w-4 h-4 mb-0.5" />
            Webhooks
          </button>
        </div>
      </header>

      {/* Webhook Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">n8n Webhook Endpoints</h3>
                  <p className="text-xs text-slate-400">Configure or verify the active BlockShield n8n cloud triggers</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>1. BlockShield Detect Webhook</span>
                  <span className="text-[10px] text-emerald-400 font-mono">POST / JSON</span>
                </label>
                <input
                  type="url"
                  value={tempDetectUrl}
                  onChange={(e) => setTempDetectUrl(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>2. BlockShield Admin Login Webhook</span>
                  <span className="text-[10px] text-amber-400 font-mono">POST / Basic Auth</span>
                </label>
                <input
                  type="url"
                  value={tempAdminUrl}
                  onChange={(e) => setTempAdminUrl(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center text-slate-300 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
                  Live Cloudflare & n8n Cloud Webhook Routing
                </div>
                <p>
                  Both endpoints are hosted on <span className="text-cyan-400 font-mono">laharika.app.n8n.cloud</span>. All detection requests and admin credentials execute directly through these production webhooks.
                </p>
              </div>

              {savedNotice && (
                <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Configuration saved successfully!
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const defaults = onResetConfig();
                    setTempDetectUrl(defaults.detectUrl);
                    setTempAdminUrl(defaults.adminLoginUrl);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 underline"
                >
                  Reset Defaults
                </button>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-3 py-1.5 text-xs rounded-lg text-slate-400 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30"
                  >
                    Save Endpoints
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
