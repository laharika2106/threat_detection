import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Trash2,
  ExternalLink,
  ChevronRight,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Hash,
} from 'lucide-react';
import { IncidentRecord, RiskLevel } from '../types/blockshield';

interface IncidentHistoryProps {
  incidents: IncidentRecord[];
  onSelectIncident: (incident: IncidentRecord) => void;
  onClearHistory: () => void;
}

export const IncidentHistory: React.FC<IncidentHistoryProps> = ({
  incidents,
  onSelectIncident,
  onClearHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      (inc.incident_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.user_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.target || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.audit_hash || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk = riskFilter === 'ALL' || (inc.risk_level || 'LOW').toUpperCase() === riskFilter;

    return matchesSearch && matchesRisk;
  });

  const getRiskColor = (risk: RiskLevel | string) => {
    const r = (risk || 'LOW').toUpperCase();
    if (r === 'CRITICAL' || r === 'HIGH') return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    if (r === 'MEDIUM') return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  };

  const handleExportAll = () => {
    const blob = new Blob([JSON.stringify(incidents, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blockshield-incidents-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white">Incident Feed & Threat Ledger</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
              {incidents.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically logged security evaluations from the BlockShield n8n intelligence pipeline.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportAll}
            disabled={incidents.length === 0}
            className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white flex items-center space-x-1.5 transition disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Feed (JSON)</span>
          </button>

          <button
            onClick={onClearHistory}
            disabled={incidents.length === 0}
            className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/30 text-xs font-semibold text-slate-400 hover:text-rose-300 flex items-center space-x-1.5 transition disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search incident ID, user, hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setRiskFilter(lvl)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                riskFilter === lvl
                  ? 'bg-cyan-600 text-white shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Cards / Table */}
      {filteredIncidents.length > 0 ? (
        <div className="space-y-3">
          {filteredIncidents.map((incident) => (
            <div
              key={incident.incident_id || incident.id}
              onClick={() => onSelectIncident(incident)}
              className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition shadow-lg group space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 group-hover:border-cyan-500/30 transition">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-white font-mono group-hover:text-cyan-400 transition">
                        {incident.incident_id || `BS-${incident.id}`}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded border font-bold uppercase tracking-wider ${getRiskColor(
                          incident.risk_level
                        )}`}
                      >
                        {incident.risk_level} ({incident.risk_score}/100)
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">
                      Target: <span className="font-mono text-slate-200">{incident.target || 'General Telemetry'}</span> • User:{' '}
                      <span className="font-mono text-slate-300">{incident.user_id || 'unknown'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 self-end sm:self-center">
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-slate-500 font-mono">
                      {new Date(incident.created_at || Date.now()).toLocaleString()}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-400">
                      {incident.blockchain_status || 'NOT_ANCHORED'}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Snippet from AI Investigation or Response Action */}
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
                <div className="truncate max-w-xl">
                  <strong className="text-slate-300">Action:</strong>{' '}
                  <span className="font-mono text-cyan-300">
                    {incident.report?.responsePlan?.action || 'CONTINUE_MONITORING'}
                  </span>
                  {incident.report?.reasons && incident.report.reasons.length > 0 && (
                    <span className="ml-2 text-slate-400 truncate">
                      • {incident.report.reasons.join(', ')}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate flex items-center">
                  <Hash className="w-3 h-3 mr-1 text-slate-600" />
                  {incident.audit_hash?.slice(0, 24)}...
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 space-y-3">
          <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No Incidents Found</h3>
          <p className="text-xs text-slate-500">
            {searchTerm || riskFilter !== 'ALL'
              ? 'Try modifying your search or risk filter criteria.'
              : 'Trigger a scan in the Threat Detection tab to populate the feed.'}
          </p>
        </div>
      )}
    </div>
  );
};
