import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BellRing, AlertTriangle, CheckCircle, Info, Calendar, Filter, UserCheck } from 'lucide-react';

const Alerts = () => {
  const { notifications, activeAlerts, acknowledgeAlert, devices } = useApp();
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'active', 'acknowledged', 'resolved'
  const [filterDevice, setFilterDevice] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  // Filter alerts from notifications list
  const filteredAlerts = notifications.filter(alert => {
    // Tab filter
    if (activeTab === 'active' && alert.status !== 'active') return false;
    if (activeTab === 'acknowledged' && alert.status !== 'acknowledged') return false;
    if (activeTab === 'resolved' && alert.status !== 'resolved') return false;
    
    // Device filter
    if (filterDevice !== 'ALL' && alert.deviceId !== filterDevice) return false;
    
    // Severity filter
    if (filterSeverity !== 'ALL' && alert.severity !== filterSeverity) return false;

    return true;
  });

  const getSeverityBadge = (severity) => {
    if (severity === 'critical') return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (severity === 'warning') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    if (severity === 'normal') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'; // recovery event
    return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  const getStatusBadge = (status) => {
    if (status === 'active') return 'bg-red-500/10 text-red-500 border-red-500/25';
    if (status === 'acknowledged') return 'bg-blue-500/10 text-blue-500 border-blue-500/25';
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'; // resolved
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-navy-100 dark:border-navy-850 pb-4">
        <div>
          <h2 className="text-xl font-bold text-navy-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <BellRing className="w-5 h-5 text-aqua-400" />
            Alert Management
          </h2>
          <p className="text-xs text-navy-450 dark:text-navy-550 mt-0.5">
            Log history of environmental anomalies, offline events, and sensor failures.
          </p>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="glass-card p-5 space-y-4">
        
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-navy-100 dark:border-navy-850 pb-4">
          
          {/* Tabs */}
          <div className="flex bg-navy-50 dark:bg-navy-850 p-1 rounded-xl border border-navy-150 dark:border-navy-800">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'active', label: `Active (${activeAlerts.length})` },
              { id: 'acknowledged', label: 'Acknowledged' },
              { id: 'resolved', label: 'Resolved' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-aqua-500 text-navy-950 shadow-sm'
                    : 'text-navy-450 dark:text-navy-500 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-navy-400">Node:</span>
              <select
                value={filterDevice}
                onChange={(e) => setFilterDevice(e.target.value)}
                className="bg-navy-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700/50 rounded-xl px-2.5 py-1.5 text-navy-800 dark:text-navy-200 cursor-pointer"
              >
                <option value="ALL">All Stations</option>
                {devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.deviceId}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-navy-400">Severity:</span>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-navy-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700/50 rounded-xl px-2.5 py-1.5 text-navy-800 dark:text-navy-200 cursor-pointer"
              >
                <option value="ALL">All Levels</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="normal">Normal (Recovery)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-navy-450 dark:text-navy-500 uppercase tracking-widest font-bold border-b border-navy-100 dark:border-navy-850 pb-2">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">Parameter</th>
                <th className="py-3 px-4">Alarm Message</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100 dark:divide-navy-850">
              {filteredAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-navy-50/50 dark:hover:bg-navy-850/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-navy-450 dark:text-navy-500">
                    {new Date(alert.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-navy-800 dark:text-white">
                    {alert.deviceId}
                  </td>
                  <td className="py-3.5 px-4 font-semibold uppercase text-[10px] text-aqua-400 font-mono">
                    {alert.parameter}
                  </td>
                  <td className="py-3.5 px-4 text-navy-700 dark:text-navy-200 leading-relaxed font-medium">
                    {alert.message}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${getSeverityBadge(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${getStatusBadge(alert.status)}`}>
                      {alert.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {alert.status === 'active' ? (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="px-2.5 py-1 rounded-xl bg-white hover:bg-navy-100 dark:bg-navy-900 dark:hover:bg-navy-800 border border-navy-200 dark:border-navy-700 text-[9px] font-bold text-navy-750 dark:text-navy-200 transition-colors shadow-sm"
                      >
                        Acknowledge
                      </button>
                    ) : alert.status === 'acknowledged' ? (
                      <span className="text-[10px] text-navy-400 flex items-center justify-end gap-1 font-semibold">
                        <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                        Acked
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-500 flex items-center justify-end gap-1 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Resolved
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAlerts.length === 0 && (
            <div className="py-12 text-center text-navy-400 flex flex-col items-center justify-center">
              <Info className="w-8 h-8 text-navy-300 dark:text-navy-700 mb-2" />
              <p className="text-xs font-semibold text-navy-800 dark:text-white">No matching alerts found</p>
              <p className="text-[10px] text-navy-450 dark:text-navy-550 mt-0.5">Adjust filters or tabs to display historical incidents.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Alerts;
