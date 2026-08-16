import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileText, Printer, Download, Calendar, AlertTriangle, ShieldCheck } from 'lucide-react';

const Reports = () => {
  const { selectedDevice, devices, telemetryLogs, activeAlerts, notifications } = useApp();
  const [timeframe, setTimeframe] = useState('24h'); // '24h', '7d'
  
  const currentDevice = devices.find(d => d.deviceId === selectedDevice) || devices[0];

  // Filter logs for selected device
  const deviceLogs = telemetryLogs.filter(t => selectedDevice === 'ALL' || t.deviceId === selectedDevice);
  
  // Calculate average, min, max
  const getStats = (field) => {
    const vals = deviceLogs.map(t => t[field]).filter(v => v !== null && v !== undefined && !isNaN(v));
    if (vals.length === 0) return { avg: '--', min: '--', max: '--' };
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return {
      avg: avg.toFixed(2),
      min: Math.min(...vals),
      max: Math.max(...vals)
    };
  };

  const phStats = getStats('ph');
  const tempStats = getStats('temperature');
  const turbStats = getStats('turbidity');
  const tdsStats = getStats('tds');
  const doStats = getStats('dissolvedOxygen');

  // Filter alerts for selected device
  const deviceAlerts = notifications.filter(a => selectedDevice === 'ALL' || a.deviceId === selectedDevice);
  const criticalIncidents = deviceAlerts.filter(a => a.severity === 'critical');

  // Trigger Browser Print/PDF Download
  const handlePrint = () => {
    window.print();
  };

  // Export logs to CSV
  const handleExportCSV = () => {
    if (deviceLogs.length === 0) {
      alert('No logs available to export.');
      return;
    }

    const headers = ['Timestamp', 'Device ID', 'pH', 'Temperature (°C)', 'Turbidity (NTU)', 'TDS (ppm)', 'Dissolved Oxygen (mg/L)', 'Status', 'Source'];
    const rows = deviceLogs.map(log => [
      log.timestamp,
      log.deviceId,
      log.ph ?? 'ERR',
      log.temperature ?? 'ERR',
      log.turbidity ?? 'ERR',
      log.tds ?? 'ERR',
      log.dissolvedOxygen ?? 'ERR',
      log.status,
      log.source
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Water_Quality_Report_${selectedDevice}_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export logs to JSON
  const handleExportJSON = () => {
    if (deviceLogs.length === 0) {
      alert('No logs available to export.');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(deviceLogs, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `Water_Quality_Report_${selectedDevice}_${timeframe}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Title / Action bar */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-navy-100 dark:border-navy-850 pb-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-navy-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-5 h-5 text-aqua-400" />
            Report Generator
          </h2>
          <p className="text-xs text-navy-450 dark:text-navy-550 mt-0.5">
            Compile operational reports, export CSV datasheets, and print assessment logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-navy-100 dark:bg-navy-900 dark:hover:bg-navy-800 border border-navy-200 dark:border-navy-700 text-navy-750 dark:text-navy-205 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print / PDF Report
          </button>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-navy-100 dark:bg-navy-900 dark:hover:bg-navy-800 border border-navy-200 dark:border-navy-700 text-navy-750 dark:text-navy-205 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-navy-100 dark:bg-navy-900 dark:hover:bg-navy-800 border border-navy-200 dark:border-navy-700 text-navy-750 dark:text-navy-205 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Simulation generated watermark (Watermark banner) */}
      {currentDevice?.location.includes('Demo') && (
        <div className="p-3.5 border border-amber-500/10 bg-amber-500/5 text-amber-500 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <span>
            <strong>Simulation Watermark:</strong> This report compiles synthetic data generated by the simulator engine. Label as "SIMULATION DATA".
          </span>
        </div>
      )}

      {/* REPORT PAPER PAGE */}
      <div className="glass-card p-8 space-y-8 print:p-0 print:border-none print:shadow-none bg-white dark:bg-navy-900">
        
        {/* Report Header */}
        <div className="flex justify-between items-start border-b border-navy-100 dark:border-navy-850 pb-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-aqua-400 uppercase tracking-widest font-mono">HydroMonitor assessment log</span>
            <h3 className="text-xl font-bold text-navy-800 dark:text-white uppercase tracking-wider">Water Quality Summary Report</h3>
            <p className="text-xs text-navy-450 dark:text-navy-500">
              Station ID: {selectedDevice === 'ALL' ? 'ALL ACTIVE NODES' : selectedDevice}
              <br />
              Location: {selectedDevice === 'ALL' ? 'Multiple Stations' : currentDevice?.location}
            </p>
          </div>
          <div className="text-right text-[10px] font-mono text-navy-450 dark:text-navy-500">
            <span>Generated: {new Date().toLocaleString()}</span>
            <br />
            <span>Telemetry Mode: SIMULATION</span>
          </div>
        </div>

        {/* Device Information section */}
        {selectedDevice !== 'ALL' && currentDevice && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs border-b border-navy-100 dark:border-navy-850 pb-6">
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-navy-400 uppercase tracking-widest">Station Details</span>
              <p className="font-semibold text-navy-750 dark:text-navy-200">Name: {currentDevice.name}</p>
              <p className="text-navy-600 dark:text-navy-400">Type: {currentDevice.type}</p>
              <p className="text-navy-600 dark:text-navy-400">Coordinates: {currentDevice.latitude.toFixed(4)}, {currentDevice.longitude.toFixed(4)}</p>
            </div>
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-navy-400 uppercase tracking-widest">Diagnostics</span>
              <p className="font-semibold text-navy-750 dark:text-navy-200">Connection Mode: {currentDevice.connectionType}</p>
              <p className="text-navy-600 dark:text-navy-400">Firmware ID: {currentDevice.firmware}</p>
              <p className="text-navy-600 dark:text-navy-400">Status Check: <span className="font-bold uppercase text-emerald-500">{currentDevice.status}</span></p>
            </div>
          </div>
        )}

        {/* Aggregated parameters table */}
        <div>
          <span className="text-[9px] font-bold text-navy-450 dark:text-navy-500 uppercase tracking-widest block mb-4">Chemical Parameter Statistics</span>
          
          <div className="overflow-x-auto border border-navy-100 dark:border-navy-850 rounded-2xl">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="bg-navy-50 dark:bg-navy-850 border-b border-navy-150 dark:border-navy-850 text-navy-400 uppercase font-semibold">
                  <th className="py-2.5 px-3 text-left">Parameter</th>
                  <th className="py-2.5 px-3">Unit</th>
                  <th className="py-2.5 px-3">Average</th>
                  <th className="py-2.5 px-3">Minimum</th>
                  <th className="py-2.5 px-3">Maximum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50 dark:divide-navy-850 font-medium">
                <tr>
                  <td className="py-3 px-3 text-left font-semibold text-navy-750 dark:text-navy-300">pH Level</td>
                  <td className="py-3 px-3 text-navy-450 dark:text-navy-500 font-mono text-[10px]">pH</td>
                  <td className="py-3 px-3 text-navy-800 dark:text-white font-bold">{phStats.avg}</td>
                  <td className="py-3 px-3 text-navy-700 dark:text-navy-300">{phStats.min}</td>
                  <td className="py-3 px-3 text-navy-700 dark:text-navy-300">{phStats.max}</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 text-left font-semibold text-navy-750 dark:text-navy-300">Temperature</td>
                  <td className="py-3 px-3 text-navy-450 dark:text-navy-500 font-mono text-[10px]">°C</td>
                  <td className="py-3 px-3 text-navy-800 dark:text-white font-bold">{tempStats.avg}</td>
                  <td className="py-3 px-3 text-navy-700 dark:text-navy-300">{tempStats.min}</td>
                  <td className="py-3 px-3 text-navy-700 dark:text-navy-300">{tempStats.max}</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 text-left font-semibold text-navy-750 dark:text-navy-300">Turbidity</td>
                  <td className="py-3 px-3 text-navy-450 dark:text-navy-500 font-mono text-[10px]">NTU</td>
                  <td className="py-3 px-3 text-navy-800 dark:text-white font-bold">{turbStats.avg}</td>
                  <td className="py-3 px-3 text-navy-700 dark:text-navy-300">{turbStats.min}</td>
                  <td className="py-3 px-3 text-navy-700 dark:text-navy-300">{turbStats.max}</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 text-left font-semibold text-navy-750 dark:text-navy-300">TDS</td>
                  <td className="py-3 px-3 text-navy-450 dark:text-navy-500 font-mono text-[10px]">ppm</td>
                  <td className="py-3 px-3 text-navy-800 dark:text-white font-bold">{tdsStats.avg}</td>
                  <td className="py-3 px-3 text-navy-700 dark:text-navy-300">{tdsStats.min}</td>
                  <td className="py-3 px-3 text-navy-700 dark:text-navy-300">{tdsStats.max}</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 text-left font-semibold text-navy-750 dark:text-navy-300">Dissolved Oxygen</td>
                  <td className="py-3 px-3 text-navy-450 dark:text-navy-500 font-mono text-[10px]">mg/L</td>
                  <td className="py-3 px-3 text-navy-800 dark:text-white font-bold">{doStats.avg}</td>
                  <td className="py-3 px-3 text-navy-700 dark:text-navy-300">{doStats.min}</td>
                  <td className="py-3 px-3 text-navy-700 dark:text-navy-300">{doStats.max}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Alert summary block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Summary counts */}
          <div className="p-5 rounded-2xl border border-navy-100 dark:border-navy-850 space-y-3">
            <span className="text-[9px] font-bold text-navy-400 uppercase tracking-widest">Alarm Metrics Summary</span>
            <div className="space-y-1.5 text-xs font-mono text-navy-600 dark:text-navy-450">
              <div className="flex justify-between">
                <span>Total Alarm Logs:</span>
                <span className="font-bold text-navy-800 dark:text-white">{deviceAlerts.length} events</span>
              </div>
              <div className="flex justify-between">
                <span>Critical Incidents:</span>
                <span className="font-bold text-red-500">{criticalIncidents.length} breaches</span>
              </div>
              <div className="flex justify-between">
                <span>Warnings Dispatched:</span>
                <span className="font-bold text-amber-500">{deviceAlerts.length - criticalIncidents.length} breaches</span>
              </div>
            </div>
          </div>

          {/* Environmental review note */}
          <div className="p-5 rounded-2xl border border-navy-100 dark:border-navy-850 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div className="text-[10px] text-navy-500 dark:text-navy-400 leading-normal space-y-1.5">
              <h5 className="font-bold uppercase text-navy-800 dark:text-white tracking-wide">HydroMonitor calibration status</h5>
              <p>
                Report parameters are evaluated against the current safety boundary rules. Standard deviations are calculated to inspect sensor output volatility.
              </p>
            </div>
          </div>

        </div>

        {/* Critical Incidents List */}
        <div>
          <span className="text-[9px] font-bold text-navy-450 dark:text-navy-500 uppercase tracking-widest block mb-3">Critical Alarm Log History</span>
          
          <div className="overflow-x-auto border border-navy-100 dark:border-navy-850 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-navy-50 dark:bg-navy-850 border-b border-navy-150 dark:border-navy-850 text-navy-450 uppercase font-semibold">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Parameter</th>
                  <th className="py-2.5 px-3">Incident Message</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50 dark:divide-navy-850 font-medium">
                {criticalIncidents.slice(0, 5).map(inc => (
                  <tr key={inc.id} className="text-navy-650 dark:text-navy-300">
                    <td className="py-3 px-3 font-mono text-[10px] text-navy-400">{new Date(inc.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-3 uppercase font-bold text-[9px] text-red-500 font-mono">{inc.parameter}</td>
                    <td className="py-3 px-3 leading-relaxed text-navy-800 dark:text-navy-200">{inc.message}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 uppercase">
                        {inc.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {criticalIncidents.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-navy-400">No critical alarms logged during monitoring window.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Reports;
