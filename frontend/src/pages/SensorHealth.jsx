import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import { HeartPulse, CheckCircle2, AlertTriangle, ShieldCheck, Cpu, RefreshCw } from 'lucide-react';

const SensorHealth = () => {
  const { selectedDevice, systemStatus } = useApp();
  const [sensorsHealth, setSensorsHealth] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    const d = new Date(timeStr);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleTimeString();
  };

  const fetchSensorHealth = async () => {
    setLoading(true);
    try {
      const devId = selectedDevice === 'ALL' ? 'WQM-001' : selectedDevice;
      const res = await axios.get(`/api/sensor/health/${devId}`);
      if (res.data && Array.isArray(res.data)) {
        setSensorsHealth(res.data);
      } else {
        setSensorsHealth([]);
      }
    } catch (e) {
      console.error(e);
      setSensorsHealth([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensorHealth();
  }, [selectedDevice]);

  const getStatusBadge = (status) => {
    if (status === 'OK') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (status === 'WARNING') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    return 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse'; // ERROR
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-navy-100 dark:border-navy-850 pb-4">
        <div>
          <h2 className="text-xl font-bold text-navy-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-aqua-400" />
            Sensor Cluster Diagnostics
          </h2>
          <p className="text-xs text-navy-450 dark:text-navy-550 mt-0.5">
            Real-time status diagnostics of physical sensor electrodes, data quality metrics, and error rates.
          </p>
        </div>
      </div>

      {/* Bad Water vs Bad Sensor visual guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="glass-card p-5 border border-emerald-500/10 bg-emerald-500/5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
            <h4 className="font-bold text-xs uppercase tracking-wide">Anomaly Code A: "Bad Water"</h4>
          </div>
          <p className="text-xs text-navy-600 dark:text-navy-300 leading-relaxed">
            Occurs when a sensor electrode is operating correctly (100% data quality index, status OK) but registers chemical readings that breach configured limits.
            <br />
            <span className="font-semibold text-navy-800 dark:text-white mt-1 block">Expected output: Dashboard overall quality becomes WARNING/CRITICAL; sensor diagnostics show OK.</span>
          </p>
        </div>

        <div className="glass-card p-5 border border-red-500/10 bg-red-500/5 space-y-2">
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="w-5 h-5" />
            <h4 className="font-bold text-xs uppercase tracking-wide">Anomaly Code B: "Bad Sensor"</h4>
          </div>
          <p className="text-xs text-navy-600 dark:text-navy-300 leading-relaxed">
            Occurs when a physical sensor electrode is faulty, disconnected, or calibration fails (analog feedback is missing or null).
            <br />
            <span className="font-semibold text-navy-800 dark:text-white mt-1 block">Expected output: Dashboard parameter card displays ERROR (No valid reading received); sensor diagnostics status flags ERROR.</span>
          </p>
        </div>

      </div>

      {/* Main split logs layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sensors list */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-navy-100 dark:border-navy-850">
            <h3 className="font-semibold text-xs text-navy-855 dark:text-white uppercase tracking-wider">
              Selected Node Sensor Health Array ({selectedDevice === 'ALL' ? 'WQM-001' : selectedDevice})
            </h3>
            
            <button
              onClick={fetchSensorHealth}
              className="p-1.5 rounded-lg hover:bg-navy-50 dark:hover:bg-navy-800 text-navy-450 hover:text-white transition-colors"
              title="Refresh diagnostic status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <p className="text-xs text-navy-450 py-8 text-center animate-pulse">Running loop-back diagnostic checks...</p>
          ) : (
            <div className="space-y-4">
              {Array.isArray(sensorsHealth) && sensorsHealth.map(s => {
                const isError = s.status === 'ERROR';
                return (
                  <div
                    key={s.name}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-colors ${
                      isError
                        ? 'border-red-500/25 bg-red-500/5'
                        : 'border-navy-100/50 dark:border-navy-850 bg-transparent'
                    }`}
                  >
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-navy-855 dark:text-white uppercase tracking-wide">{s.name} Electrode</h4>
                      <p className="text-[10px] text-navy-450 dark:text-navy-500 font-mono">Last update: {formatTime(s.lastUpdate)}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="block text-[8px] font-bold uppercase text-navy-400">Quality Index</span>
                        <span className={`font-bold ${s.quality >= 95 ? 'text-emerald-500' : 'text-amber-500'}`}>{s.quality}%</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-bold uppercase text-navy-400">Total Ticks</span>
                        <span className="font-semibold text-navy-650 dark:text-navy-300">{s.totalCount}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-bold uppercase text-navy-400">Errors logged</span>
                        <span className={`font-bold ${s.errorCount > 0 ? 'text-red-500' : 'text-navy-400'}`}>{s.errorCount}</span>
                      </div>
                      
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${getStatusBadge(s.status)}`}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Diagnostic footnotes */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-semibold text-xs text-navy-855 dark:text-white uppercase tracking-wider mb-2">
              Electrode Physical Calibration
            </h3>
            <p className="text-xs text-navy-450 dark:text-navy-550 leading-relaxed">
              Standard environments require regular sensor calibration to compensate for drift caused by mineral scale accumulation.
            </p>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-navy-50/50 dark:bg-navy-950/20 border border-navy-100/30">
                <span className="font-bold text-navy-800 dark:text-white text-[11px] uppercase tracking-wide block">pH Buffer Calibration</span>
                <p className="text-navy-500 dark:text-navy-450 text-[10px] mt-0.5 leading-relaxed">
                  Calibrate pH sensors using standard reference buffer solutions (pH 4.01, 7.00, and 10.01) to compute accurate slope metrics.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-navy-50/50 dark:bg-navy-950/20 border border-navy-100/30">
                <span className="font-bold text-navy-800 dark:text-white text-[11px] uppercase tracking-wide block">TDS Electrical Conductivity</span>
                <p className="text-navy-500 dark:text-navy-450 text-[10px] mt-0.5 leading-relaxed">
                  TDS electrodes measure electrical conductivity (EC). Compensate for temperature drift (2% per °C) to keep readings reliable.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-navy-50 dark:bg-navy-900/60 p-3.5 rounded-xl border border-navy-100/50 dark:border-navy-800/40 text-[9px] text-navy-400 flex gap-1.5 items-start mt-4">
            <Cpu className="w-3.5 h-3.5 text-aqua-400 flex-shrink-0 mt-0.5" />
            <span>
              ESP32 nodes run local low-pass filtering on raw analog values prior to REST API dispatch.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default SensorHealth;
