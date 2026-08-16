import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Sun, Moon, Wifi, WifiOff, Settings, AlertTriangle, CheckCircle2 } from 'lucide-react';

const TopHeader = () => {
  const {
    theme,
    toggleTheme,
    selectedDevice,
    setSelectedDevice,
    devices,
    activeAlerts,
    notifications,
    telemetryLogs,
    systemStatus,
    acknowledgeAlert
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Find current device details
  const currentDevice = devices.find(d => d.deviceId === selectedDevice);
  
  // Find latest telemetry timestamp for relative timer
  const latestReadings = telemetryLogs.filter(t => selectedDevice === 'ALL' || t.deviceId === selectedDevice);
  const latestTimestamp = latestReadings.length > 0 ? latestReadings[0].timestamp : null;

  useEffect(() => {
    setSecondsAgo(0);
  }, [latestTimestamp, selectedDevice]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format relative last-seen string
  const getLastSeenText = () => {
    if (systemStatus.backend === 'OFFLINE') return 'N/A';
    if (!latestTimestamp) return 'No data';
    if (secondsAgo <= 2) return 'Just now';
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    const mins = Math.floor(secondsAgo / 60);
    return `${mins}m ago`;
  };

  // Determine data source string
  const getDataSourceText = () => {
    if (selectedDevice === 'ALL') return 'MIXED';
    if (!currentDevice) return 'SIMULATION';
    return currentDevice.deviceId.startsWith('WQM') && currentDevice.location.includes('Demo')
      ? 'SIMULATION'
      : 'ESP32 / API';
  };

  return (
    <header className="min-h-[4rem] h-auto border-b border-navy-100 dark:border-navy-800 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md px-6 py-3 sm:py-0 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
      
      {/* Title & Info */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-sm font-semibold tracking-wide text-navy-800 dark:text-white uppercase hidden md:block">
            Water Quality Assessment Platform
          </h1>
          <p className="text-[10px] text-navy-400 dark:text-navy-500 font-medium hidden md:block">
            ON-SITE WATER MONITORING PROTOCOL
          </p>
        </div>
        
        <div className="h-6 w-[1px] bg-navy-100 dark:bg-navy-800 hidden md:block" />

        {/* Connection status banner */}
        <div className="flex items-center gap-2">
          {systemStatus.backend === 'ONLINE' ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-900/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              SYSTEM ONLINE
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200/40 dark:border-red-900/20">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
              OFFLINE
            </span>
          )}

          {/* <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-navy-50 dark:bg-navy-850 text-navy-600 dark:text-navy-300 border border-navy-200/40 dark:border-navy-800/30">
            SOURCE: {getDataSourceText()}
          </span> */}
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-[#0f172a] text-[#cbd5e1] border border-[#334155]">
  SOURCE: {getDataSourceText()}
</span>
        </div>
      </div>

      {/* Selectors & Actions */}
      <div className="flex items-center gap-4">
        
        {/* Device selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-navy-400 dark:text-navy-500 font-medium hidden sm:inline">Station:</span>
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="text-xs bg-navy-50 dark:bg-navy-800/80 border border-navy-200/50 dark:border-navy-700/50 rounded-xl px-3 py-1.5 font-medium text-navy-800 dark:text-navy-100 focus:outline-none focus:ring-1 focus:ring-aqua-500 select-none cursor-pointer"
          >
            <option value="ALL">All Stations</option>
            {devices.map(d => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.deviceId} - {d.location}
              </option>
            ))}
          </select>
        </div>

        {/* Sync Text */}
        {selectedDevice !== 'ALL' && (
          <span className="text-[11px] font-mono text-navy-400 dark:text-navy-500 hidden lg:inline-block">
            Last Reading: {getLastSeenText()}
          </span>
        )}

        <div className="h-6 w-[1px] bg-navy-100 dark:bg-navy-800" />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-navy-50 hover:bg-navy-100 dark:bg-navy-800/50 dark:hover:bg-navy-800/80 text-navy-500 dark:text-navy-400 transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-navy-600" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-xl bg-navy-50 hover:bg-navy-100 dark:bg-navy-800/50 dark:hover:bg-navy-800/80 text-navy-500 dark:text-navy-400 transition-all ${
              activeAlerts.length > 0 ? 'text-critical' : ''
            }`}
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {activeAlerts.length > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-critical text-white text-[9px] font-bold flex items-center justify-center border border-white dark:border-navy-900 animate-bounce">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 max-h-[420px] overflow-y-auto bg-white dark:bg-navy-900 border border-navy-100 dark:border-navy-800 shadow-xl rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-navy-100 dark:border-navy-850">
                <h3 className="font-semibold text-xs text-navy-800 dark:text-white uppercase tracking-wider">Active Alerts</h3>
                <span className="text-[10px] text-navy-400 font-mono">({activeAlerts.length} alerts)</span>
              </div>

              {activeAlerts.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                  <p className="text-xs font-semibold text-navy-800 dark:text-white">All systems normal</p>
                  <p className="text-[10px] text-navy-400 dark:text-navy-550 mt-0.5">No anomalies detected in selected devices.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeAlerts.slice(0, 10).map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-xl border flex flex-col gap-1.5 transition-colors ${
                        alert.severity === 'critical'
                          ? 'bg-red-500/5 border-red-500/20 text-red-800 dark:text-red-300'
                          : alert.severity === 'warning'
                          ? 'bg-amber-500/5 border-amber-500/20 text-amber-800 dark:text-amber-300'
                          : 'bg-navy-500/5 border-navy-500/20 text-navy-700 dark:text-navy-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 font-mono">
                          <AlertTriangle className="w-3 h-3" />
                          {alert.severity} ({alert.parameter})
                        </span>
                        <span className="text-[9px] font-mono text-navy-450 dark:text-navy-500">
                          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed font-medium">{alert.message}</p>
                      <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-navy-200/30 dark:border-navy-800/30">
                        <span className="text-[9px] font-semibold font-mono text-navy-400">Node: {alert.deviceId}</span>
                        {alert.status === 'active' && (
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            // className="px-2 py-0.5 rounded bg-white hover:bg-navy-100 dark:bg-navy-850 dark:hover:bg-navy-800 border border-navy-200 dark:border-navy-700 text-[9px] font-bold transition-all text-navy-700 dark:text-navy-200 shadow-sm"
                            className="px-2 py-0.5 rounded bg-[#0f172a] hover:bg-[#1e293b] border border-[#334155] text-[9px] font-bold transition-all text-white shadow-sm"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {activeAlerts.length > 5 && (
                    <p className="text-center text-[10px] text-navy-400 dark:text-navy-500 pt-1">
                      Showing top 5 alerts. Check History for all logs.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default TopHeader;
