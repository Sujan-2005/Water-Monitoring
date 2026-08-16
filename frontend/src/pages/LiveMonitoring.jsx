import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Play, Pause, Activity, Sliders, AlertTriangle } from 'lucide-react';

const LiveMonitoring = () => {
  const { selectedDevice, telemetryLogs, thresholds, systemStatus } = useApp();
  const [isPaused, setIsPaused] = useState(false);

  // Filter telemetry logs for selected device
  const deviceLogs = telemetryLogs
    .filter(t => selectedDevice === 'ALL' || t.deviceId === selectedDevice)
    .slice(0, 20)
    .reverse(); // Chronological for chart display

  const latestReading = deviceLogs.length > 0 ? deviceLogs[deviceLogs.length - 1] : null;

  const PARAM_CARDS = [
    { key: 'ph', name: 'pH Level', field: 'ph', unit: 'pH', color: '#3fa6c0', minDomain: 4, maxDomain: 10 },
    { key: 'temperature', name: 'Temperature', field: 'temperature', unit: '°C', color: '#ef4444', minDomain: 10, maxDomain: 45 },
    { key: 'turbidity', name: 'Turbidity', field: 'turbidity', unit: 'NTU', color: '#f59e0b', minDomain: 0, maxDomain: 15 },
    { key: 'tds', name: 'TDS', field: 'tds', unit: 'ppm', color: '#8b5cf6', minDomain: 100, maxDomain: 1000 },
    { key: 'dissolvedOxygen', name: 'Dissolved Oxygen', field: 'dissolvedOxygen', unit: 'mg/L', color: '#10b981', minDomain: 2, maxDomain: 12 }
  ];

  const getStatusBadge = (key, val) => {
    const thresh = thresholds[key];
    if (val === null || val === undefined || isNaN(val)) {
      return <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-red-500/10 text-red-500 animate-pulse">ERROR</span>;
    }
    if (!thresh) return <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500">NORMAL</span>;

    if (val <= thresh.criticalLow || val >= thresh.criticalHigh) {
      return <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-red-500/10 text-red-500">CRITICAL</span>;
    }
    if (val <= thresh.warningLow || val >= thresh.warningHigh) {
      return <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-500">WARNING</span>;
    }
    return <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500">NORMAL</span>;
  };

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="flex justify-between items-center border-b border-navy-100 dark:border-navy-850 pb-4">
        <div>
          <h2 className="text-xl font-bold text-navy-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-5 h-5 text-aqua-400 animate-pulse" />
            Live Multi-Parameter Streaming
          </h2>
          <p className="text-xs text-navy-450 dark:text-navy-550 mt-0.5">
            Simultaneous real-time oscilloscope view of all active water quality parameters.
          </p>
        </div>

        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all ${
            isPaused
              ? 'bg-emerald-500 text-navy-950 hover:bg-emerald-600'
              : 'bg-white hover:bg-navy-100 dark:bg-navy-900 dark:hover:bg-navy-800 border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200'
          }`}
        >
          {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
          {isPaused ? 'Resume Streaming' : 'Pause Streaming'}
        </button>
      </div>

      {/* Grid of 5 live graphs */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {PARAM_CARDS.map(card => {
          const thresh = thresholds[card.key];
          const currValue = latestReading ? latestReading[card.field] : null;
          const hasError = currValue === null || currValue === undefined || isNaN(currValue);
          
          return (
            <div key={card.key} className="glass-card p-5 flex flex-col justify-between min-h-[260px]">
              
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xs font-bold text-navy-400 dark:text-navy-500 uppercase tracking-widest">{card.name}</h3>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="text-xl font-bold tracking-tight text-navy-850 dark:text-white">
                      {hasError ? 'ERR' : currValue}
                    </span>
                    {!hasError && <span className="text-xs font-semibold text-navy-450 dark:text-navy-550">{card.unit}</span>}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(card.key, currValue)}
                  {thresh && (
                    <span className="text-[10px] font-mono bg-navy-50 dark:bg-navy-850 px-2 py-0.5 rounded border border-navy-100/30 dark:border-navy-800/30 text-navy-450 dark:text-navy-500">
                      Normal: {thresh.warningLow}-{thresh.warningHigh}
                    </span>
                  )}
                </div>
              </div>

              {/* Chart Grid */}
              <div className="h-40 w-full">
                {isPaused ? (
                  <div className="h-full flex items-center justify-center text-xs text-navy-400 border border-dashed border-navy-200 dark:border-navy-850 rounded-2xl">
                    Streaming paused
                  </div>
                ) : deviceLogs.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={deviceLogs} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id={`grad-${card.key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={card.color} stopOpacity={0.25}/>
                          <stop offset="95%" stopColor={card.color} stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b15" />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(tick) => new Date(tick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        tick={{ fill: '#64748b', fontSize: 8, fontFamily: 'monospace' }}
                        stroke="#1e293b15"
                      />
                      <YAxis
                        domain={[card.minDomain, card.maxDomain]}
                        tick={{ fill: '#64748b', fontSize: 8 }}
                        stroke="#1e293b15"
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', padding: '6px' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '8px', fontFamily: 'monospace' }}
                        itemStyle={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold' }}
                        labelFormatter={(lbl) => new Date(lbl).toLocaleTimeString()}
                      />
                      <Area
                        type="monotone"
                        dataKey={card.field}
                        stroke={card.color}
                        strokeWidth={2}
                        fill={`url(#grad-${card.key})`}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-navy-400">
                    Awaiting telemetry ticks...
                  </div>
                )}
              </div>

            </div>
          );
        })}

        {/* Technical spec card */}
        <div className="glass-card p-5 flex flex-col justify-between min-h-[260px]">
          <div>
            <h3 className="text-xs font-bold text-navy-400 dark:text-navy-500 uppercase tracking-widest mb-3">
              Calibration & Calibration Parameters
            </h3>
            <p className="text-xs text-navy-450 dark:text-navy-550 leading-relaxed mb-4">
              All telemetry signals are validated in real-time. Signals that remain flat, fall out of physical limits, or drop completely will trigger a Sensor Diagnostics warning (Sensor Error).
            </p>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center py-1.5 border-b border-navy-100/50 dark:border-navy-850">
              <span className="text-navy-400">pH Formula</span>
              <span className="text-navy-800 dark:text-navy-300">pH = m × ADC + b</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-navy-100/50 dark:border-navy-850">
              <span className="text-navy-400">TDS Formula</span>
              <span className="text-navy-800 dark:text-navy-300">TDS = k × EC</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-navy-400">DO Temperature Compensation</span>
              <span className="text-emerald-500 font-semibold">ENABLED</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default LiveMonitoring;
