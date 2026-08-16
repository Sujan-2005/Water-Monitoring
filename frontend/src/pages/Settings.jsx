import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings as SettingsIcon, ShieldCheck, Database, RefreshCw, Cpu, Code, Lock } from 'lucide-react';

const Settings = () => {
  const {
    resetSimulation,
    systemStatus,
    simulatorStatus,
    setUpdateInterval
  } = useApp();

  const [projectTitle, setProjectTitle] = useState('HydroMonitor IoT Platform');
  const [timezone, setTimezone] = useState('Asia/Kolkata (GMT+5:30)');
  const [intervalSecs, setIntervalSecs] = useState(simulatorStatus.updateInterval);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    setUpdateInterval(intervalSecs);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleResetData = async () => {
    if (window.confirm('Are you sure you want to clear all telemetry histories and reset limits? This seeds default data.')) {
      await resetSimulation();
      alert('Database restored to default seeds.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-navy-100 dark:border-navy-850 pb-4">
        <div>
          <h2 className="text-xl font-bold text-navy-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-aqua-400" />
            System Configurations
          </h2>
          <p className="text-xs text-navy-450 dark:text-navy-550 mt-0.5">
            Manage general deployment parameters, database integrity, and hardware interfaces.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left column: general configuration */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <form onSubmit={handleSaveGeneral} className="space-y-4">
            <h3 className="font-semibold text-xs text-navy-855 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-aqua-400" />
              General Project Parameters
            </h3>

            <div className="space-y-1.5 text-xs">
              <label className="text-[10px] font-bold text-navy-400 uppercase">Academic Project Title</label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full bg-white dark:bg-navy-850 border border-navy-200 dark:border-navy-700 rounded-xl px-3 py-2 text-navy-800 dark:text-navy-150 font-medium"
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-[10px] font-bold text-navy-400 uppercase">Deployment Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-white dark:bg-navy-850 border border-navy-200 dark:border-navy-700 rounded-xl px-3 py-2 text-navy-800 dark:text-navy-150 font-mono text-[11px]"
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-[10px] font-bold text-navy-400 uppercase">Local Refreshes (seconds)</label>
              <select
                value={intervalSecs}
                onChange={(e) => setIntervalSecs(parseInt(e.target.value))}
                className="w-full bg-white dark:bg-navy-850 border border-navy-200 dark:border-navy-700 rounded-xl px-3 py-2 text-navy-800 dark:text-navy-150 font-medium cursor-pointer"
              >
                <option value="1">1 second (High Frequency)</option>
                <option value="2">2 seconds</option>
                <option value="3">3 seconds</option>
                <option value="5">5 seconds</option>
                <option value="10">10 seconds</option>
              </select>
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                saveSuccess
                  ? 'bg-emerald-500 text-navy-950 font-extrabold'
                  : 'bg-aqua-500 hover:bg-aqua-600 text-navy-950 font-bold'
              }`}
            >
              {saveSuccess ? 'General Parameters Applied!' : 'Apply Parameters'}
            </button>
          </form>

          {/* Database management */}
          <div className="border-t border-navy-100 dark:border-navy-850 pt-5 mt-6 space-y-3.5">
            <h3 className="font-semibold text-xs text-navy-855 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-aqua-400" />
              Database Management
            </h3>
            <p className="text-[10px] text-navy-450 dark:text-navy-500 leading-normal">
              Force simulation loops to reset, clearing alarm thresholds, diagnostics status registries, and resetting historical readings back to seed baselines.
            </p>
            <button
              onClick={handleResetData}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all shadow-sm"
            >
              Reset Database & Telemetry Seeds
            </button>
          </div>
        </div>

        {/* Right column: future ESP32 configurations instructions */}
        <div className="glass-card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-xs text-navy-855 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Code className="w-4 h-4 text-aqua-400" />
              ESP32 Telemetry REST Protocol Specification
            </h3>
            <p className="text-[10px] text-navy-450 dark:text-navy-500 leading-relaxed">
              To connect a physical ESP32 and transmit sensor metrics to this dashboard, configure the ESP32 Wi-Fi client to perform HTTP POST operations.
            </p>

            {/* Spec block */}
            <div className="p-3 rounded-2xl bg-navy-900 text-white font-mono text-[9px] space-y-1.5 border border-navy-800">
              <span className="text-aqua-300 font-bold">METHOD:</span> POST
              <br />
              <span className="text-aqua-300 font-bold">ENDPOINT:</span> http://[server_ip]:5000/api/telemetry
              <br />
              <span className="text-aqua-300 font-bold">PAYLOAD FORMAT:</span>
              <pre className="text-navy-200 mt-1 pl-2">
{`{
  "deviceId": "WQM-001",
  "ph": 7.24,
  "temperature": 26.4,
  "turbidity": 1.8,
  "tds": 312,
  "dissolvedOxygen": 7.1
}`}
              </pre>
            </div>

            {/* C++ IDE snippet */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-navy-400 uppercase tracking-widest block">Arduino C++ HTTP Client Skeleton</span>
              <pre className="p-3 rounded-2xl bg-navy-900 text-navy-350 font-mono text-[8px] leading-relaxed max-h-36 overflow-y-auto border border-navy-800">
{`#include <WiFi.h>
#include <HTTPClient.h>

void sendTelemetry() {
  HTTPClient http;
  http.begin("http://[SERVER_IP]:5000/api/telemetry");
  http.addHeader("Content-Type", "application/json");

  String json = "{\\"deviceId\\":\\"WQM-001\\",\\"ph\\":7.2,\\"temperature\\":26.5,\\"turbidity\\":1.8,\\"tds\\":310,\\"dissolvedOxygen\\":7.1}";
  
  int httpResponseCode = http.POST(json);
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println(response);
  }
  http.end();
}`}
              </pre>
            </div>
          </div>

          <div className="bg-navy-50 dark:bg-navy-900/60 p-3.5 rounded-xl border border-navy-100/50 dark:border-navy-800/40 text-[9px] text-navy-400 flex gap-1.5 items-start mt-4">
            <Lock className="w-3.5 h-3.5 text-aqua-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Hardware ready:</strong> The backend pipeline parses REST uploads using the same calibration engines as the simulation mode.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Settings;
