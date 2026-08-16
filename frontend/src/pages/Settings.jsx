import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings as SettingsIcon, Database, Code, Lock, Sun, Moon, Palette, Check } from 'lucide-react';

// Emerald Environmental color swatches
const EMERALD_SWATCHES = [
  { color: '#10B981', label: 'Emerald' },
  { color: '#84CC16', label: 'Lime' },
  { color: '#14B8A6', label: 'Teal' },
  { color: '#F59E0B', label: 'Amber' },
  { color: '#F43F5E', label: 'Rose' },
];

const Settings = () => {
  const {
    theme,
    toggleTheme,
    colorTheme,
    setColorTheme,
    resetSimulation,
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

      {/* ─── APPEARANCE CARD ─── */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-xs text-navy-855 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
          <Palette className="w-4 h-4 text-aqua-400" />
          Appearance &amp; Color Theme
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* ── Appearance (Light / Dark) ── */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-navy-400 dark:text-navy-500 uppercase tracking-widest">
              Appearance
            </p>
            <div className="flex gap-2">
              {/* Light button */}
              <button
                id="appearance-light-btn"
                onClick={() => { if (theme === 'dark') toggleTheme(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                  theme === 'light'
                    ? 'border-aqua-500 bg-aqua-500/10 text-aqua-600 dark:text-aqua-400 shadow-sm shadow-aqua-500/20 ring-1 ring-aqua-500/40'
                    : 'border-navy-200 dark:border-navy-700 text-navy-500 dark:text-navy-400 bg-white dark:bg-navy-850 hover:border-navy-300 dark:hover:border-navy-600 hover:bg-navy-50 dark:hover:bg-navy-800'
                }`}
                aria-pressed={theme === 'light'}
              >
                <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500' : 'text-navy-400 dark:text-navy-500'}`} />
                Light
                {theme === 'light' && <Check className="w-3 h-3 ml-auto opacity-70" />}
              </button>

              {/* Dark button */}
              <button
                id="appearance-dark-btn"
                onClick={() => { if (theme === 'light') toggleTheme(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                  theme === 'dark'
                    ? 'border-aqua-500 bg-aqua-500/10 text-aqua-600 dark:text-aqua-400 shadow-sm shadow-aqua-500/20 ring-1 ring-aqua-500/40'
                    : 'border-navy-200 dark:border-navy-700 text-navy-500 dark:text-navy-400 bg-white dark:bg-navy-850 hover:border-navy-300 dark:hover:border-navy-600 hover:bg-navy-50 dark:hover:bg-navy-800'
                }`}
                aria-pressed={theme === 'dark'}
              >
                <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-indigo-400' : 'text-navy-400 dark:text-navy-500'}`} />
                Dark
                {theme === 'dark' && <Check className="w-3 h-3 ml-auto opacity-70" />}
              </button>
            </div>
            <p className="text-[9px] text-navy-400 dark:text-navy-600 leading-relaxed">
              Controls the overall brightness of the interface. Independent from the color theme below.
            </p>
          </div>

          {/* ── Color Theme ── */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-navy-400 dark:text-navy-500 uppercase tracking-widest">
              Color Theme
            </p>
            <div className="flex flex-col gap-2">

              {/* Default theme option */}
              <button
                id="color-theme-default-btn"
                onClick={() => setColorTheme('default')}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                  colorTheme === 'default'
                    ? 'border-aqua-500 bg-aqua-500/10 text-aqua-600 dark:text-aqua-400 shadow-sm shadow-aqua-500/20 ring-1 ring-aqua-500/40'
                    : 'border-navy-200 dark:border-navy-700 text-navy-500 dark:text-navy-400 bg-white dark:bg-navy-850 hover:border-navy-300 dark:hover:border-navy-600 hover:bg-navy-50 dark:hover:bg-navy-800'
                }`}
                aria-pressed={colorTheme === 'default'}
              >
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-aqua-400 to-aqua-600 flex-shrink-0 shadow-sm" />
                <span className="flex-1 text-left">Default</span>
                {colorTheme === 'default' && (
                  <span className="ml-auto flex items-center gap-1 text-[9px] font-bold text-aqua-500 uppercase tracking-wider">
                    <Check className="w-3 h-3" /> Active
                  </span>
                )}
              </button>

              {/* Emerald Environmental option */}
              <button
                id="color-theme-emerald-btn"
                onClick={() => setColorTheme('emerald')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                  colorTheme === 'emerald'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm shadow-emerald-500/20 ring-1 ring-emerald-500/40'
                    : 'border-navy-200 dark:border-navy-700 text-navy-500 dark:text-navy-400 bg-white dark:bg-navy-850 hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20'
                }`}
                aria-pressed={colorTheme === 'emerald'}
              >
                {/* Leaf icon */}
                <span className="text-base leading-none flex-shrink-0" aria-hidden="true">🌿</span>

                <div className="flex-1 text-left">
                  <div className="font-bold text-xs">Emerald Environmental</div>

                  {/* Color swatches */}
                  <div className="flex gap-1 mt-1.5">
                    {EMERALD_SWATCHES.map(({ color, label }) => (
                      <span
                        key={label}
                        title={label}
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm border border-white/30"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {colorTheme === 'emerald' ? (
                  <span className="ml-auto flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex-shrink-0">
                    <Check className="w-3 h-3" /> Active
                  </span>
                ) : (
                  <span className="ml-auto text-[9px] text-navy-400 dark:text-navy-600 flex-shrink-0">Select</span>
                )}
              </button>
            </div>
            <p className="text-[9px] text-navy-400 dark:text-navy-600 leading-relaxed">
              Applies an environmental green palette across the entire interface. Works with both Light and Dark modes.
            </p>
          </div>
        </div>

        {/* Active combination indicator */}
        <div className="mt-5 pt-4 border-t border-navy-100 dark:border-navy-850">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-bold text-navy-400 dark:text-navy-600 uppercase tracking-widest">Active combination:</span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                colorTheme === 'emerald'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40'
                  : 'bg-aqua-50 dark:bg-aqua-950/30 text-aqua-700 dark:text-aqua-400 border-aqua-200 dark:border-aqua-900/40'
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: colorTheme === 'emerald' ? '#10B981' : '#3fa6c0' }}
              />
              {colorTheme === 'emerald' ? '🌿 Emerald Environmental' : 'Default'} + {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── EXISTING SETTINGS GRID ─── */}
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
              Reset Database &amp; Telemetry Seeds
            </button>
          </div>
        </div>

        {/* Right column: ESP32 configurations */}
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

