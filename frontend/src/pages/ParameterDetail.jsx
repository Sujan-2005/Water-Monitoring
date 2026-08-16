import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { ArrowLeft, Thermometer, Droplets, Zap, Activity, Compass, ChevronRight, AlertTriangle } from 'lucide-react';

const ParameterDetail = () => {
  const { paramCode } = useParams();
  const navigate = useNavigate();
  const { selectedDevice, telemetryLogs, thresholds } = useApp();

  // Map route param to config
  const PARAM_CONFIGS = {
    ph: { name: 'pH', unit: 'pH', icon: Droplets, color: '#3fa6c0', description: 'Acidity / Alkalinity level (hydrogen ion concentration)' },
    temperature: { name: 'Temperature', unit: '°C', icon: Thermometer, color: '#ef4444', description: 'Water thermal state (impacts biological processes)' },
    turbidity: { name: 'Turbidity', unit: 'NTU', icon: Activity, color: '#f59e0b', description: 'Water cloudiness caused by suspended particles' },
    tds: { name: 'TDS', unit: 'ppm', icon: Zap, color: '#8b5cf6', description: 'Total Dissolved Solids (dissolved mineral and salt count)' },
    dissolvedOxygen: { name: 'Dissolved Oxygen', unit: 'mg/L', icon: Compass, color: '#10b981', description: 'Amount of gaseous oxygen dissolved in water' }
  };

  const config = PARAM_CONFIGS[paramCode];
  if (!config) {
    return (
      <div className="py-12 text-center text-navy-400">
        <p>Parameter not found.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-aqua-400 hover:underline">
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Filter logs for selected device
  const deviceLogs = telemetryLogs.filter(t => selectedDevice === 'ALL' || t.deviceId === selectedDevice);
  
  // Calculate statistics from the loaded telemetry logs
  const validValues = deviceLogs
    .map(t => t[paramCode])
    .filter(v => v !== null && v !== undefined && !isNaN(v));

  const average = validValues.length > 0 ? (validValues.reduce((a, b) => a + b, 0) / validValues.length) : null;
  const min = validValues.length > 0 ? Math.min(...validValues) : null;
  const max = validValues.length > 0 ? Math.max(...validValues) : null;

  // Calculate warning/critical event frequencies
  let warningsCount = 0;
  let criticalsCount = 0;
  const thresh = thresholds[paramCode];

  if (thresh) {
    validValues.forEach(val => {
      if (val <= thresh.criticalLow || val >= thresh.criticalHigh) {
        criticalsCount++;
      } else if (val <= thresh.warningLow || val >= thresh.warningHigh) {
        warningsCount++;
      }
    });
  }

  const latestValue = deviceLogs.length > 0 ? deviceLogs[0][paramCode] : null;
  const isError = latestValue === null || latestValue === undefined || isNaN(latestValue);
  
  let statusLabel = 'NORMAL';
  let statusClass = 'status-badge-normal';
  if (isError) {
    statusLabel = 'ERROR';
    statusClass = 'status-badge-critical animate-pulse';
  } else if (thresh) {
    if (latestValue <= thresh.criticalLow || latestValue >= thresh.criticalHigh) {
      statusLabel = 'CRITICAL';
      statusClass = 'status-badge-critical';
    } else if (latestValue <= thresh.warningLow || latestValue >= thresh.warningHigh) {
      statusLabel = 'WARNING';
      statusClass = 'status-badge-warning';
    }
  }

  const chronologicalLogs = deviceLogs.slice().reverse();

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl bg-white hover:bg-navy-100 dark:bg-navy-900 dark:hover:bg-navy-800 border border-navy-200 dark:border-navy-700 text-navy-600 dark:text-navy-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5 text-xs text-navy-450 dark:text-navy-500 font-semibold font-mono">
          <span>DASHBOARD</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-aqua-400 uppercase">{config.name} DETAILS</span>
        </div>
      </div>

      {/* Main summary row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Param description card */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl text-white flex-shrink-0" style={{ backgroundColor: `${config.color}20`, color: config.color }}>
              <config.icon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-navy-800 dark:text-white uppercase tracking-wider">{config.name} Assessment</h2>
              <p className="text-xs text-navy-450 dark:text-navy-500 font-semibold font-mono uppercase tracking-widest">{config.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-navy-100/60 dark:border-navy-850/60 pt-4 mt-6 text-center">
            <div className="p-2 rounded-xl bg-navy-50/50 dark:bg-navy-950/20">
              <span className="text-[10px] text-navy-400 font-semibold uppercase">Latest Value</span>
              <p className="text-xl font-bold text-navy-850 dark:text-white mt-1">
                {isError ? 'ERR' : `${latestValue} ${config.unit}`}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-navy-50/50 dark:bg-navy-950/20">
              <span className="text-[10px] text-navy-400 font-semibold uppercase">Assessment</span>
              <p className={`text-xs font-bold uppercase mt-2.5 inline-block px-2.5 py-0.5 rounded-lg ${statusClass}`}>
                {statusLabel}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-navy-50/50 dark:bg-navy-950/20">
              <span className="text-[10px] text-navy-400 font-semibold uppercase">Safe Boundaries</span>
              <p className="text-[11px] font-semibold text-navy-800 dark:text-white mt-2 font-mono">
                {thresh ? `${thresh.warningLow} - ${thresh.warningHigh}` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Aggregated stats card */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <h3 className="font-semibold text-xs text-navy-850 dark:text-white uppercase tracking-wider mb-4 pb-2 border-b border-navy-100 dark:border-navy-850">
            Log History Analytics
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div className="flex flex-col gap-0.5 p-2 rounded-xl bg-navy-50/50 dark:bg-navy-950/20 border border-navy-100/30">
              <span className="text-[9px] text-navy-400 font-semibold uppercase">Log Mean</span>
              <span className="font-bold text-sm text-navy-800 dark:text-white">{average !== null ? `${average.toFixed(2)} ${config.unit}` : '--'}</span>
            </div>
            <div className="flex flex-col gap-0.5 p-2 rounded-xl bg-navy-50/50 dark:bg-navy-950/20 border border-navy-100/30">
              <span className="text-[9px] text-navy-400 font-semibold uppercase">Log Minimum</span>
              <span className="font-bold text-sm text-navy-800 dark:text-white">{min !== null ? `${min} ${config.unit}` : '--'}</span>
            </div>
            <div className="flex flex-col gap-0.5 p-2 rounded-xl bg-navy-50/50 dark:bg-navy-950/20 border border-navy-100/30">
              <span className="text-[9px] text-navy-400 font-semibold uppercase">Log Maximum</span>
              <span className="font-bold text-sm text-navy-800 dark:text-white">{max !== null ? `${max} ${config.unit}` : '--'}</span>
            </div>
            <div className="flex flex-col gap-0.5 p-2 rounded-xl bg-navy-50/50 dark:bg-navy-950/20 border border-navy-100/30">
              <span className="text-[9px] text-navy-400 font-semibold uppercase">Breach Counts</span>
              <span className="font-bold text-xs text-red-500">{criticalsCount} Crit / {warningsCount} Warn</span>
            </div>
          </div>
        </div>

      </div>

      {/* Historical Area Chart */}
      <div className="glass-card p-6 min-h-[360px]">
        <h3 className="font-bold text-sm text-navy-850 dark:text-white uppercase tracking-wider mb-6 pb-2 border-b border-navy-100 dark:border-navy-850">
          Historical Time-Series Trend
        </h3>
        <div className="h-72 w-full">
          {chronologicalLogs.length > 0 && thresh ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chronologicalLogs} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id={`detail-grad-${paramCode}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={config.color} stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={config.color} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b15" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(tick) => new Date(tick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
                  stroke="#1e293b15"
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fill: '#64748b', fontSize: 9 }}
                  stroke="#1e293b15"
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '9px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold' }}
                  labelFormatter={(lbl) => new Date(lbl).toLocaleString()}
                />
                <ReferenceLine y={thresh.warningHigh} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Warning High', fill: '#f59e0b', fontSize: 8, position: 'top' }} />
                <ReferenceLine y={thresh.warningLow} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Warning Low', fill: '#f59e0b', fontSize: 8, position: 'bottom' }} />
                <ReferenceLine y={thresh.criticalHigh} stroke="#ef4444" strokeWidth={1.5} label={{ value: 'Critical High', fill: '#ef4444', fontSize: 8, position: 'top' }} />
                <ReferenceLine y={thresh.criticalLow} stroke="#ef4444" strokeWidth={1.5} label={{ value: 'Critical Low', fill: '#ef4444', fontSize: 8, position: 'bottom' }} />
                
                <Area
                  type="monotone"
                  dataKey={paramCode}
                  stroke={config.color}
                  strokeWidth={2.5}
                  fill={`url(#detail-grad-${paramCode})`}
                  dot={{ r: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-navy-450">
              No historical entries available. Ensure simulation is broadcasting.
            </div>
          )}
        </div>
      </div>

      {/* Recent Readings Table */}
      <div className="glass-card p-6 overflow-hidden">
        <h3 className="font-bold text-sm text-navy-850 dark:text-white uppercase tracking-wider mb-4 pb-2 border-b border-navy-100 dark:border-navy-850">
          Recent Readings Log
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-navy-400 uppercase tracking-widest font-bold border-b border-navy-100 dark:border-navy-850">
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Device</th>
                <th className="py-3 px-4 font-semibold">Logged Value</th>
                <th className="py-3 px-4 font-semibold">Source</th>
                <th className="py-3 px-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50 dark:divide-navy-850">
              {deviceLogs.slice(0, 12).map((log, index) => {
                const val = log[paramCode];
                const valError = val === null || val === undefined || isNaN(val);
                
                let sLabel = 'NORMAL';
                let sClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                
                if (valError) {
                  sLabel = 'ERROR';
                  sClass = 'bg-red-500/10 text-red-500 border-red-500/20';
                } else if (thresh) {
                  if (val <= thresh.criticalLow || val >= thresh.criticalHigh) {
                    sLabel = 'CRITICAL';
                    sClass = 'bg-red-500/10 text-red-500 border-red-500/20';
                  } else if (val <= thresh.warningLow || val >= thresh.warningHigh) {
                    sLabel = 'WARNING';
                    sClass = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                  }
                }

                return (
                  <tr key={index} className="hover:bg-navy-50/50 dark:hover:bg-navy-850/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-navy-450 dark:text-navy-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-navy-700 dark:text-navy-200">
                      {log.deviceId}
                    </td>
                    <td className="py-3 px-4 font-bold text-navy-850 dark:text-white">
                      {valError ? 'ERR (Sensor Failure)' : `${val} ${config.unit}`}
                    </td>
                    <td className="py-3 px-4 uppercase font-bold text-[9px] font-mono text-navy-450">
                      {log.source}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${sClass}`}>
                        {sLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {deviceLogs.length === 0 && (
            <div className="py-8 text-center text-navy-400">
              No recent records found.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ParameterDetail;
