import React from 'react';
import { Shield, Lock, Terminal, Cpu, CheckCircle2, Heart } from 'lucide-react';
import { WebhookConfig } from '../types/blockshield';

interface FooterProps {
  webhookConfig: WebhookConfig;
}

export const Footer: React.FC<FooterProps> = ({ webhookConfig }) => {
  return (
    <footer className="mt-20 border-t border-slate-800/80 bg-slate-950/80 py-10 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-900">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white tracking-tight">BlockShield AI</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                Autonomous Security
              </span>
            </div>
            <p className="text-slate-500 text-[11px] max-w-md">
              Enterprise incident detection, smart contract threat containment, and cryptographic ledger verification powered by n8n cloud workflows.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-[11px] font-mono text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Detect: /blockshield-detect</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Admin: /blockshield-admin-login</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} BlockShield Threat Intelligence. Deterministic canonical audit verification.
          </div>

          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-1" />
              Cloudflare Edge SSL
            </span>
            <span className="flex items-center">
              <Cpu className="w-3.5 h-3.5 text-cyan-400 mr-1" />
              n8n Cloud Engine
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
