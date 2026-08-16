import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';
import {
  Thermometer,
  Droplets,
  Zap,
  Activity,
  AlertTriangle,
  Compass,
  ArrowUp,
  ArrowDown,
  Play,
  Pause,
  MapPin,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

const Dashboard = () => {
  const {
    selectedDevice,
    devices,
    telemetryLogs,
    activeAlerts,
    thresholds,
    acknowledgeAlert,
    systemStatus,
    simulatorStatus
  } = useApp();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ph'); // Active parameter on large live chart
  const [chartTimeframe, setChartTimeframe] = useState(15); // limit points: 15, 30, 60
  const [isLivePaused, setIsLivePaused] = useState(false);

  // Filter telemetry logs for selected device
  const deviceLogs = telemetryLogs
    .filter(t => selectedDevice === 'ALL' || t.deviceId === selectedDevice)
    .slice()
    .reverse(); // Reverse to chronologically show left-to-right

  // Static/latest reading
  const latestReadings = telemetryLogs.filter(t => selectedDevice === 'ALL' || t.deviceId === selectedDevice);
  const latestReading = latestReadings.length > 0 ? latestReadings[0] : null;
  const previousReading = latestReadings.length > 1 ? latestReadings[1] : null;

  // Selected device info
  const currentDevice = devices.find(d => d.deviceId === selectedDevice);
  const isOffline = selectedDevice !== 'ALL' && currentDevice?.status === 'OFFLINE';

  // --- DEMO QUALITY SCORE ALGORITHM ---
  const calculateQualityScore = () => {
    if (isOffline) return { score: 0, label: 'OFFLINE', color: 'text-gray-400 bg-gray-500/10 border-gray-500/25' };
    
    // Evaluate for selected device (or WQM-001 if ALL is selected)
    const targetDevId = selectedDevice === 'ALL' ? 'WQM-001' : selectedDevice;
    const targetReadings = telemetryLogs.filter(t => t.deviceId === targetDevId);
    
    if (targetReadings.length === 0) {
      return { score: 100, label: 'GOOD', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/25' };
    }
    
    const latest = targetReadings[0];
    let score = 100;
    let criticals = 0;
    let warnings = 0;
    let errors = 0;

    const params = ['ph', 'temperature', 'turbidity', 'tds', 'dissolvedOxygen'];
    params.forEach(p => {
      const val = latest[p === 'temperature' ? 'temperature' : p === 'dissolvedOxygen' ? 'dissolvedOxygen' : p];
      if (val === null || val === undefined || isNaN(val)) {
        score -= 15;
        errors++;
        return;
      }

      const thresh = thresholds[p];
      if (!thresh) return;

      if (val <= thresh.criticalLow || val >= thresh.criticalHigh) {
        score -= 20;
        criticals++;
      } else if (val <= thresh.warningLow || val >= thresh.warningHigh) {
        score -= 8;
        warnings++;
      }
    });

    score = Math.max(0, score);
    
    let label = 'EXCELLENT';
    let color = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/25';
    if (criticals > 0 || score < 60) {
      label = 'CRITICAL';
      color = 'text-red-500 bg-red-500/10 border-red-500/25 border';
    } else if (warnings > 0 || score < 85) {
      label = 'WARNING';
      color = 'text-amber-500 bg-amber-500/10 border-amber-500/25 border';
    } else if (score >= 90) {
      label = 'GOOD';
      color = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/25 border';
    }

    return { score, label, color, criticals, warnings, errors };
  };

  const qualityInfo = calculateQualityScore();

  // Parameter Configuration
  const PARAMETER_METRIC_CONFIG = {
    ph: {
      name: 'pH',
      field: 'ph',
      unit: 'pH',
      icon: Droplets,
      color: '#3fa6c0',
      description: 'Acidity / Alkalinity level'
    },
    temperature: {
      name: 'Temperature',
      field: 'temperature',
      unit: '°C',
      icon: Thermometer,
      color: '#ef4444',
      description: 'Thermal state of water'
    },
    turbidity: {
      name: 'Turbidity',
      field: 'turbidity',
      unit: 'NTU',
      icon: Activity,
      color: '#f59e0b',
      description: 'Water clarity / Cloudiness'
    },
    tds: {
      name: 'TDS',
      field: 'tds',
      unit: 'ppm',
      icon: Zap,
      color: '#8b5cf6',
      description: 'Total Dissolved Solids'
    },
    dissolvedOxygen: {
      name: 'Dissolved Oxygen',
      field: 'dissolvedOxygen',
      unit: 'mg/L',
      icon: Compass,
      color: '#10b981',
      description: 'Oxygen dissolved in water'
    }
  };

  // Sparkline data generation
  const getSparklineData = (paramField) => {
    return telemetryLogs
      .filter(t => selectedDevice === 'ALL' || t.deviceId === selectedDevice)
      .slice(0, 10)
      .reverse()
      .map((t, idx) => ({ id: idx, val: t[paramField] }));
  };

  // Trend calculation
  const getTrend = (paramField) => {
    if (!latestReading || !previousReading) return 'flat';
    const curr = latestReading[paramField];
    const prev = previousReading[paramField];
    if (curr === null || prev === null) return 'flat';
    if (curr > prev) return 'up';
    if (curr < prev) return 'down';
    return 'flat';
  };

  // Render metric card
  const renderMetricCard = (key) => {
    const config = PARAMETER_METRIC_CONFIG[key];
    const thresh = thresholds[key];
    
    let currentValue = isOffline ? 'N/A' : (latestReading ? latestReading[config.field] : null);
    const hasError = currentValue === null || currentValue === undefined || isNaN(currentValue);
    
    // Evaluate status color
    let statusLabel = 'NORMAL';
    let statusClass = 'status-badge-normal';
    
    if (isOffline) {
      statusLabel = 'OFFLINE';
      statusClass = 'status-badge-offline';
    } else if (hasError) {
      statusLabel = 'ERROR';
      statusClass = 'status-badge-critical animate-pulse';
    } else if (thresh) {
      if (currentValue <= thresh.criticalLow || currentValue >= thresh.criticalHigh) {
        statusLabel = 'CRITICAL';
        statusClass = 'status-badge-critical';
      } else if (currentValue <= thresh.warningLow || currentValue >= thresh.warningHigh) {
        statusLabel = 'WARNING';
        statusClass = 'status-badge-warning';
      }
    }

    const sparkData = isOffline || hasError ? [] : getSparklineData(config.field);
    const trend = isOffline ? 'flat' : getTrend(config.field);

    return (
      <div
        key={key}
        onClick={() => navigate(`/parameter/${config.field}`)}
        className="glass-card glass-card-hover p-5 cursor-pointer relative overflow-hidden group select-none flex flex-col justify-between h-48"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className="p-2 rounded-xl text-white flex-shrink-0"
              style={{ backgroundColor: `${config.color}20`, color: config.color }}
            >
              <config.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-navy-400 dark:text-navy-500 uppercase tracking-wider">{config.name}</h3>
              <p className="text-[9px] text-navy-450 dark:text-navy-500 font-medium">{config.description}</p>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-wide ${statusClass}`}>
            {statusLabel}
          </span>
        </div>

        {/* Value */}
        <div className="my-2.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight text-navy-800 dark:text-white">
            {hasError ? (isOffline ? 'OFFLINE' : 'ERR') : currentValue}
          </span>
          {!hasError && <span className="text-xs font-semibold text-navy-400 dark:text-navy-500">{config.unit}</span>}
          
          {trend === 'up' && <ArrowUp className="w-4 h-4 text-emerald-500 ml-1.5" />}
          {trend === 'down' && <ArrowDown className="w-4 h-4 text-red-500 ml-1.5" />}
        </div>

        {/* Mini sparkline */}
        <div className="h-10 w-full mb-1">
          {sparkData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line
                  type="monotone"
                  dataKey="val"
                  stroke={config.color}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center border border-dashed border-navy-200 dark:border-navy-800 rounded-lg text-[9px] text-navy-400">
              {isOffline ? 'Station Offline' : 'Awaiting data...'}
            </div>
          )}
        </div>

        {/* Footer ranges */}
        {thresh && !isOffline && (
          <div className="flex justify-between text-[9px] text-navy-450 dark:text-navy-500 font-mono border-t border-navy-100/50 dark:border-navy-850 pt-1.5">
            <span>Range: {thresh.warningLow} - {thresh.warningHigh} {config.unit}</span>
            <span>Ref: {thresh.criticalLow}/{thresh.criticalHigh}</span>
          </div>
        )}
      </div>
    );
  };

  // Prepare chart data
  const chartData = isLivePaused ? [] : deviceLogs.slice(-chartTimeframe);
  const selectedConfig = PARAMETER_METRIC_CONFIG[activeTab];
  const selectedThresh = thresholds[activeTab];

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: Welcome & Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quality Score Banner */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-3 text-center sm:text-left">
            <div>
              <span className="text-[10px] font-bold text-aqua-400 uppercase tracking-widest">
                Integrated Safety Index
              </span>
              <h2 className="text-xl font-bold text-navy-800 dark:text-white mt-1">
                Demo Water Quality Status
              </h2>
            </div>
            <p className="text-xs text-navy-500 dark:text-navy-400 max-w-sm">
              An aggregate rating of the selected station. WARNING and CRITICAL parameters decrease the baseline score.
            </p>
            
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 pt-1">
              <span className="text-[10px] bg-navy-50 dark:bg-navy-800/80 border border-navy-200/50 dark:border-navy-700/50 px-2 py-1 rounded-lg text-navy-500 dark:text-navy-300 font-medium">
                {selectedDevice === 'ALL' ? 'All Stations Average' : `Station: ${selectedDevice}`}
              </span>
              
              {!isOffline && qualityInfo.warnings > 0 && (
                <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-1 rounded-lg font-semibold">
                  {qualityInfo.warnings} Warning{qualityInfo.warnings > 1 ? 's' : ''}
                </span>
              )}

              {!isOffline && qualityInfo.criticals > 0 && (
                <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 rounded-lg font-semibold">
                  {qualityInfo.criticals} Critical{qualityInfo.criticals > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-center">
              <span className="text-[10px] font-bold text-navy-400 uppercase">Demo Score</span>
              <div className="text-4xl font-extrabold tracking-tight text-navy-800 dark:text-white mt-0.5">
                {isOffline ? '--' : qualityInfo.score}
                <span className="text-sm font-semibold text-navy-400">/100</span>
              </div>
            </div>
            
            <div className={`px-4 py-2.5 rounded-2xl text-center font-extrabold text-sm tracking-wide ${qualityInfo.color}`}>
              {qualityInfo.label}
            </div>
          </div>
        </div>

        {/* Compact System Health Checklist */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-xs text-navy-800 dark:text-white uppercase tracking-wider">System State</h3>
            <span className="text-[9px] text-navy-400 dark:text-navy-500 font-mono">200 OK</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-navy-50 dark:bg-navy-850 flex flex-col gap-0.5 border border-navy-100/30 dark:border-navy-800/30">
              <span className="text-[9px] text-navy-400 font-semibold uppercase">API Gateway</span>
              <span className="font-bold text-emerald-500 font-mono">ONLINE</span>
            </div>
            <div className="p-2.5 rounded-xl bg-navy-50 dark:bg-navy-850 flex flex-col gap-0.5 border border-navy-100/30 dark:border-navy-800/30">
              <span className="text-[9px] text-navy-400 font-semibold uppercase">Telemetry Stream</span>
              <span className="font-bold text-emerald-500 font-mono">RECEIVING</span>
            </div>
            <div className="p-2.5 rounded-xl bg-navy-50 dark:bg-navy-850 flex flex-col gap-0.5 border border-navy-100/30 dark:border-navy-800/30">
              <span className="text-[9px] text-navy-400 font-semibold uppercase">Engine Loop</span>
              <span className="font-bold text-emerald-500 font-mono uppercase">{simulatorStatus.status}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-navy-50 dark:bg-navy-850 flex flex-col gap-0.5 border border-navy-100/30 dark:border-navy-800/30">
              <span className="text-[9px] text-navy-400 font-semibold uppercase">Alert Rules</span>
              <span className="font-bold text-emerald-500 font-mono">ACTIVE</span>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 2: 5 Parameter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {Object.keys(PARAMETER_METRIC_CONFIG).map(renderMetricCard)}
      </div>

      {/* SECTION 3: Large Live Chart & Map Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Large Time Series Chart */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between min-h-[420px]">
          {/* Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-navy-100 dark:border-navy-850 pb-4">
            <div>
              <h3 className="font-bold text-sm text-navy-850 dark:text-white uppercase tracking-wider">
                Live Sensor Telemetry Visualizer
              </h3>
              <p className="text-[10px] text-navy-450 dark:text-navy-550 mt-0.5">
                Real-time charting for selected parameter {selectedDevice !== 'ALL' && `at Node ${selectedDevice}`}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Parameter picker tabs */}
              <div className="flex bg-navy-550 dark:bg-navy-850 p-1 rounded-xl border border-navy-150 dark:border-navy-800">
                {Object.keys(PARAMETER_METRIC_CONFIG).map(key => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === key
                        ? 'bg-aqua-500 text-navy-950 shadow-sm'
                        : 'text-navy-400 dark:text-navy-500 hover:text-white'
                    }`}
                  >
                    {PARAMETER_METRIC_CONFIG[key].name}
                  </button>
                ))}
              </div>

              {/* Toggles */}
              <button
                onClick={() => setIsLivePaused(!isLivePaused)}
                className={`p-2 rounded-xl transition-colors ${
                  isLivePaused
                    ? 'bg-emerald-500 text-navy-950 hover:bg-emerald-600'
                    : 'bg-navy-50 dark:bg-navy-805 text-navy-500 hover:bg-navy-100 dark:hover:bg-navy-800'
                }`}
                title={isLivePaused ? 'Resume live updates' : 'Pause chart rendering'}
              >
                {isLivePaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-72 w-full">
            {isOffline ? (
              <div className="h-full flex items-center justify-center text-xs text-navy-400 font-semibold bg-navy-50/50 dark:bg-navy-950/20 rounded-2xl border border-dashed border-navy-200 dark:border-navy-800">
                Station offline. No live telemetry available.
              </div>
            ) : isLivePaused ? (
              <div className="h-full flex items-center justify-center text-xs text-navy-400 font-semibold bg-navy-50/50 dark:bg-navy-950/20 rounded-2xl border border-dashed border-navy-200 dark:border-navy-800">
                Chart rendering is paused. Click Play above to resume streaming.
              </div>
            ) : chartData.length > 0 && selectedThresh ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={selectedConfig.color} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={selectedConfig.color} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b20" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(tick) => new Date(tick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
                    stroke="#1e293b20"
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fill: '#64748b', fontSize: 9 }}
                    stroke="#1e293b20"
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '10px', fontFamily: 'monospace' }}
                    itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}
                    labelFormatter={(label) => new Date(label).toLocaleString()}
                  />
                  <ReferenceLine y={selectedThresh.warningHigh} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Warning High', fill: '#f59e0b', fontSize: 8, position: 'top' }} />
                  <ReferenceLine y={selectedThresh.warningLow} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Warning Low', fill: '#f59e0b', fontSize: 8, position: 'bottom' }} />
                  <ReferenceLine y={selectedThresh.criticalHigh} stroke="#ef4444" strokeWidth={1.5} label={{ value: 'Critical High', fill: '#ef4444', fontSize: 8, position: 'top' }} />
                  <ReferenceLine y={selectedThresh.criticalLow} stroke="#ef4444" strokeWidth={1.5} label={{ value: 'Critical Low', fill: '#ef4444', fontSize: 8, position: 'bottom' }} />
                  
                  <Area
                    type="monotone"
                    dataKey={selectedConfig.field}
                    name={selectedConfig.name}
                    stroke={selectedConfig.color}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#chartGradient)"
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-navy-450 font-semibold bg-navy-50/50 dark:bg-navy-950/20 rounded-2xl border border-dashed border-navy-200 dark:border-navy-800">
                Awaiting telemetry ticks. Ensure simulator is running.
              </div>
            )}
          </div>
        </div>

        {/* Stylized Station Location Map */}
        <div className="glass-card p-6 flex flex-col justify-between min-h-[420px]">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-semibold text-xs text-navy-850 dark:text-white uppercase tracking-wider">Station Deployment Map</h3>
              <span className="text-[10px] text-navy-400 flex items-center gap-1 font-semibold">
                <MapPin className="w-3.5 h-3.5" />
                Bengaluru, IN
              </span>
            </div>
            <p className="text-[10px] text-navy-450 dark:text-navy-500 mb-4">
              Geographic telemetry node mapping. Coordinates are ready for actual GPS hardware integration.
            </p>
          </div>

          {/* Visual Canvas Map */}
          <div className="h-60 rounded-2xl bg-navy-900/10 dark:bg-navy-950/40 border border-navy-200/50 dark:border-navy-850/80 relative flex items-center justify-center overflow-hidden">
            {/* Grid overlay */}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-10">
              {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} className="border border-navy-300 dark:border-navy-400"></div>
              ))}
            </div>

            {/* Stylized river/water overlay */}
            <svg className="absolute w-full h-full opacity-20 dark:opacity-10 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M-10,30 Q30,60 50,40 T110,50 L110,110 L-10,110 Z" fill="#0ea5e9" />
            </svg>

            {/* Render device markers */}
            {devices.map((d, idx) => {
              const leftOffset = 25 + idx * 25 + (Math.sin(idx) * 5);
              const topOffset = 30 + idx * 20;
              
              let markerColor = 'bg-emerald-500';
              if (d.status === 'OFFLINE') markerColor = 'bg-gray-500';
              else if (d.status === 'WARNING') markerColor = 'bg-amber-500';
              else if (d.status === 'CRITICAL' || d.status === 'sensor_error') markerColor = 'bg-red-500';

              const isSelected = selectedDevice === d.deviceId;

              return (
                <div
                  key={d.deviceId}
                  className={`absolute group cursor-pointer transition-all duration-300 ${
                    isSelected ? 'scale-125 z-10' : 'hover:scale-110 z-5'
                  }`}
                  style={{ left: `${leftOffset}%`, top: `${topOffset}%` }}
                  onClick={() => setSelectedDevice(d.deviceId)}
                >
                  <span className="flex h-4 w-4 relative">
                    {d.status !== 'OFFLINE' && (
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${markerColor}`}></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-4 w-4 border-2 border-white dark:border-navy-900 shadow-md ${markerColor}`}></span>
                  </span>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-navy-950 text-white border border-navy-800 text-[9px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                    {d.deviceId}: {d.location} ({d.status})
                  </div>
                </div>
              );
            })}
          </div>

          {/* Coordinates readouts */}
          <div className="space-y-1.5 text-[10px] font-mono text-navy-450 dark:text-navy-500 mt-4 border-t border-navy-100/50 dark:border-navy-850 pt-3">
            {devices.map(d => (
              <div key={d.deviceId} className="flex justify-between items-center">
                <span>{d.deviceId} ({d.location.slice(0, 12)}...)</span>
                <span>Lat: {d.latitude.toFixed(4)}, Lon: {d.longitude.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* SECTION 4: Active Alerts Panel (Dashboard bottom list) */}
      <div className="bg-white dark:bg-navy-900 border border-navy-100 dark:border-navy-800 rounded-2xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-navy-100 dark:border-navy-850">
          <h3 className="font-semibold text-xs text-navy-850 dark:text-white uppercase tracking-wider">
            Critical Station Alerts Log
          </h3>
          <span className="text-[10px] text-navy-400 dark:text-navy-500 font-mono">
            {activeAlerts.length} unresolved alerts
          </span>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <CheckCircle className="w-10 h-10 text-emerald-500 mb-2.5" />
            <p className="text-xs font-semibold text-navy-800 dark:text-white">All systems normal</p>
            <p className="text-[10px] text-navy-450 dark:text-navy-550 mt-0.5">
              No alert thresholds are currently breached on any deployed stations.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border flex flex-col gap-2 relative overflow-hidden transition-all ${
                  alert.severity === 'critical'
                    ? 'bg-red-500/5 border-red-500/20 text-red-800 dark:text-red-300'
                    : 'bg-amber-500/5 border-amber-500/20 text-amber-800 dark:text-amber-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase font-bold tracking-wider flex items-center gap-1.5 font-mono">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    {alert.severity} ({alert.parameter})
                  </span>
                  <span className="text-[9px] font-mono text-navy-400">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs font-medium leading-relaxed">{alert.message}</p>
                <div className="flex items-center justify-between border-t border-navy-200/25 dark:border-navy-800/25 pt-2 mt-1">
                  <div className="text-[9px] text-navy-450 dark:text-navy-500 font-mono">
                    Node: {alert.deviceId}
                  </div>
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="px-2.5 py-1 rounded bg-white hover:bg-navy-150 dark:bg-navy-850 dark:hover:bg-navy-800 border border-navy-200 dark:border-navy-700 text-[9.5px] font-bold transition-all text-navy-700 dark:text-navy-200 shadow-sm"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
