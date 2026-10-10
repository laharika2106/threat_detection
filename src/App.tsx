/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DetectionScanner } from './components/DetectionScanner';
import { IncidentHistory } from './components/IncidentHistory';
import { AdminPortal } from './components/AdminPortal';
import { WebhookPlayground } from './components/WebhookPlayground';
import { Footer } from './components/Footer';
import {
  IncidentRecord,
  AdminAuthState,
  WebhookConfig,
} from './types/blockshield';
import {
  getStoredIncidents,
  clearStoredIncidents,
  updateStoredIncident,
  getWebhookConfig,
  saveWebhookConfig,
  resetWebhookConfig,
} from './services/n8nService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'detect' | 'incidents' | 'admin' | 'playground'>('detect');
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [activeIncident, setActiveIncident] = useState<IncidentRecord | null>(null);
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>(getWebhookConfig());
  const [authState, setAuthState] = useState<AdminAuthState>({
    isAuthenticated: false,
    user: null,
    mode: 'live_n8n',
    loginTime: null,
  });

  // Initialize data on mount
  useEffect(() => {
    const stored = getStoredIncidents();
    setIncidents(stored);
    if (stored.length > 0) {
      setActiveIncident(stored[0]);
    }
  }, []);

  const handleScanComplete = (newIncident: IncidentRecord) => {
    setIncidents((prev) => {
      const filtered = prev.filter((i) => i.incident_id !== newIncident.incident_id);
      return [newIncident, ...filtered];
    });
    setActiveIncident(newIncident);
  };

  const handleSelectIncidentFromFeed = (incident: IncidentRecord) => {
    setActiveIncident(incident);
    setActiveTab('detect');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearHistory = () => {
    clearStoredIncidents();
    setIncidents([]);
    setActiveIncident(null);
  };

  const handleUpdateIncidentStatus = (incidentId: string, newStatus: string) => {
    setIncidents((prev) =>
      prev.map((item) => {
        if (item.incident_id === incidentId) {
          const updated = {
            ...item,
            report: {
              ...item.report,
              status: newStatus,
            },
          };
          updateStoredIncident(updated);
          if (activeIncident?.incident_id === incidentId) {
            setActiveIncident(updated);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleUpdateConfig = (newConfig: WebhookConfig) => {
    saveWebhookConfig(newConfig);
    setWebhookConfig(newConfig);
  };

  const handleResetConfig = () => {
    const defaults = resetWebhookConfig();
    setWebhookConfig(defaults);
    return defaults;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-emerald-500/4 rounded-full blur-[160px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          webhookConfig={webhookConfig}
          onUpdateConfig={handleUpdateConfig}
          onResetConfig={handleResetConfig}
          totalIncidents={incidents.length}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'detect' && (
            <DetectionScanner
              onScanComplete={handleScanComplete}
              activeIncident={activeIncident}
              setActiveIncident={setActiveIncident}
            />
          )}

          {activeTab === 'incidents' && (
            <IncidentHistory
              incidents={incidents}
              onSelectIncident={handleSelectIncidentFromFeed}
              onClearHistory={handleClearHistory}
            />
          )}

          {activeTab === 'admin' && (
            <AdminPortal
              authState={authState}
              setAuthState={setAuthState}
              incidents={incidents}
              onUpdateIncidentStatus={handleUpdateIncidentStatus}
              webhookConfig={webhookConfig}
            />
          )}

          {activeTab === 'playground' && (
            <WebhookPlayground webhookConfig={webhookConfig} />
          )}
        </main>

        {/* Footer */}
        <Footer webhookConfig={webhookConfig} />
      </div>
    </div>
  );
}
