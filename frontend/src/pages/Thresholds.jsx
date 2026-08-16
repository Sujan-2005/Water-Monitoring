import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sliders, Check, HelpCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

const Thresholds = () => {
  const { thresholds, updateThreshold, telemetryLogs } = useApp();
  const [editingParam, setEditingParam] = useState(null);
  
  // Local state form fields
  const [warningLow, setWarningLow] = useState('');
  const [warningHigh, setWarningHigh] = useState('');
  const [criticalLow, setCriticalLow] = useState('');
  const [criticalHigh, setCriticalHigh] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const startEditing = (paramKey) => {
    const thresh = thresholds[paramKey];
    if (thresh) {
      setEditingParam(paramKey);
      setWarningLow(thresh.warningLow);
      setWarningHigh(thresh.warningHigh);
      setCriticalLow(thresh.criticalLow);
      setCriticalHigh(thresh.criticalHigh);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingParam) return;
    
    await updateThreshold(editingParam, {
      warningLow: parseFloat(warningLow),
      warningHigh: parseFloat(warningHigh),
      criticalLow: parseFloat(criticalLow),
      criticalHigh: parseFloat(criticalHigh)
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setEditingParam(null);
    }, 1500);
  };

  const getParamLabel = (key) => {
    const labels = { ph: 'pH', temperature: 'Temperature', turbidity: 'Turbidity', tds: 'TDS', dissolvedOxygen: 'DO' };
    return labels[key] || key;
  };

  const getParamUnit = (key) => {
    const units = { ph: 'pH', temperature: '°C', turbidity: 'NTU', tds: 'ppm', dissolvedOxygen: 'mg/L' };
    return units[key] || '';
  };

  const getLatestVal = (key) => {
    const fieldMap = { ph: 'ph', temperature: 'temperature', turbidity: 'turbidity', tds: 'tds', dissolvedOxygen: 'dissolvedOxygen' };
    if (telemetryLogs.length === 0) return '--';
    const latest = telemetryLogs[0];
    return latest[fieldMap[key]] ?? '--';
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-navy-100 dark:border-navy-850 pb-4">
        <div>
          <h2 className="text-xl font-bold text-navy-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-5 h-5 text-aqua-400" />
            Threshold Configuration
          </h2>
          <p className="text-xs text-navy-450 dark:text-navy-550 mt-0.5">
            Configure safety margins, warning zones, and critical limits for automatic alert dispatching.
          </p>
        </div>
      </div>

      {/* Safety Standard disclaimer */}
      <div className="glass-card p-5 border border-amber-500/10 bg-amber-500/5 flex gap-3.5 items-start">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5 animate-pulse" />
        <div className="text-xs space-y-1.5 leading-normal text-navy-600 dark:text-navy-300">
          <h4 className="font-bold text-navy-800 dark:text-white uppercase tracking-wide">Prototype Calibration Notice</h4>
          <p>
            Threshold values shown in simulation mode are configurable demonstration values and should be replaced/validated against the intended application, sensor calibration, and applicable water-quality standards before real deployment.
          </p>
        </div>
      </div>

      {/* Grid listing thresholds */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Parameters list */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-xs text-navy-850 dark:text-white uppercase tracking-wider mb-2">
            Active Parameters Limit Registers
          </h3>

          <div className="space-y-3">
            {Object.keys(thresholds).map((paramKey) => {
              const thresh = thresholds[paramKey];
              const isEditing = editingParam === paramKey;

              return (
                <div
                  key={paramKey}
                  className={`p-4 rounded-2xl border transition-all ${
                    isEditing
                      ? 'border-aqua-500 dark:border-aqua-400 bg-navy-50/50 dark:bg-navy-950/20'
                      : 'border-navy-100/50 dark:border-navy-855/50 hover:bg-navy-50/40 dark:hover:bg-navy-900/10'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-bold text-xs text-navy-800 dark:text-white uppercase tracking-wide">
                        {getParamLabel(paramKey)} ({getParamUnit(paramKey)})
                      </h4>
                      <p className="text-[10px] text-navy-450 dark:text-navy-550 mt-1 font-mono">
                        Current: {getLatestVal(paramKey)} {getParamUnit(paramKey)}
                      </p>
                    </div>

                    {!isEditing && (
                      <button
                        onClick={() => startEditing(paramKey)}
                        className="px-2.5 py-1 rounded-xl bg-white hover:bg-navy-100 dark:bg-navy-900 dark:hover:bg-navy-800 border border-navy-200 dark:border-navy-700 text-[10px] font-bold text-navy-700 dark:text-navy-200 transition-colors shadow-sm"
                      >
                        Adjust Range
                      </button>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono text-navy-450 dark:text-navy-500 mt-4 border-t border-navy-100/30 dark:border-navy-850/45 pt-3">
                      <div>
                        <span className="block text-[8px] font-semibold text-red-500 uppercase">Crit Low</span>
                        <span className="font-bold text-navy-750 dark:text-navy-300">{thresh.criticalLow}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-semibold text-amber-500 uppercase">Warn Low</span>
                        <span className="font-bold text-navy-750 dark:text-navy-300">{thresh.warningLow}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-semibold text-amber-500 uppercase">Warn High</span>
                        <span className="font-bold text-navy-750 dark:text-navy-300">{thresh.warningHigh}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-semibold text-red-500 uppercase">Crit High</span>
                        <span className="font-bold text-navy-750 dark:text-navy-300">{thresh.criticalHigh}</span>
                      </div>
                    </div>
                  )}

                  {/* Editing form */}
                  {isEditing && (
                    <form onSubmit={handleSave} className="mt-4 border-t border-navy-200 dark:border-navy-800 pt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-navy-400 uppercase">Critical Low</label>
                          <input
                            type="number"
                            step="0.01"
                            value={criticalLow}
                            onChange={(e) => setCriticalLow(e.target.value)}
                            className="w-full bg-white dark:bg-navy-850 border border-navy-200 dark:border-navy-700 rounded-lg px-2.5 py-1.5 text-navy-800 dark:text-navy-150 font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-navy-400 uppercase">Critical High</label>
                          <input
                            type="number"
                            step="0.01"
                            value={criticalHigh}
                            onChange={(e) => setCriticalHigh(e.target.value)}
                            className="w-full bg-white dark:bg-navy-850 border border-navy-200 dark:border-navy-700 rounded-lg px-2.5 py-1.5 text-navy-800 dark:text-navy-150 font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-navy-400 uppercase">Warning Low</label>
                          <input
                            type="number"
                            step="0.01"
                            value={warningLow}
                            onChange={(e) => setWarningLow(e.target.value)}
                            className="w-full bg-white dark:bg-navy-850 border border-navy-200 dark:border-navy-700 rounded-lg px-2.5 py-1.5 text-navy-800 dark:text-navy-150 font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-navy-400 uppercase">Warning High</label>
                          <input
                            type="number"
                            step="0.01"
                            value={warningHigh}
                            onChange={(e) => setWarningHigh(e.target.value)}
                            className="w-full bg-white dark:bg-navy-850 border border-navy-200 dark:border-navy-700 rounded-lg px-2.5 py-1.5 text-navy-800 dark:text-navy-150 font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                            saveSuccess ? 'bg-emerald-500 text-navy-950 font-bold' : 'bg-aqua-500 hover:bg-aqua-600 text-navy-950 font-bold'
                          }`}
                        >
                          {saveSuccess ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              Saved!
                            </>
                          ) : (
                            'Apply Changes'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingParam(null)}
                          className="px-3.5 py-1.5 rounded-lg text-xs bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-200 hover:bg-navy-200 dark:hover:bg-navy-700 font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Environmental reference guidelines */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-xs text-navy-855 dark:text-white uppercase tracking-wider mb-3">
              Standard Environmental Reference Margins
            </h3>
            <p className="text-xs text-navy-450 dark:text-navy-550 leading-relaxed mb-4">
              Water quality assessments are governed by local safety and ecological guidelines. The list below represents general academic guidelines:
            </p>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-navy-50/50 dark:bg-navy-950/20 border border-navy-100/30">
                <h5 className="font-bold text-navy-800 dark:text-white text-[11px] uppercase tracking-wide">pH standard (US-EPA)</h5>
                <p className="text-navy-500 dark:text-navy-400 text-[10px] mt-0.5 leading-normal">
                  Drinking water standard generally sits between 6.5 and 8.5. Extremes (&lt; 6.0 or &gt; 9.0) result in severe piping corrosion and environmental shock.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-navy-50/50 dark:bg-navy-950/20 border border-navy-100/30">
                <h5 className="font-bold text-navy-800 dark:text-white text-[11px] uppercase tracking-wide">TDS standard</h5>
                <p className="text-navy-500 dark:text-navy-400 text-[10px] mt-0.5 leading-normal">
                  TDS levels below 500 ppm are ideal. Levels above 500 ppm suggest chemical mineral loading, imparting salty taste, scale, and pipeline encrustations.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-navy-50/50 dark:bg-navy-950/20 border border-navy-100/30">
                <h5 className="font-bold text-navy-800 dark:text-white text-[11px] uppercase tracking-wide">Turbidity standard</h5>
                <p className="text-navy-500 dark:text-navy-400 text-[10px] mt-0.5 leading-normal">
                  WHO guidelines advise turbidity below 1.0 NTU for treatment efficiency. Values exceeding 5.0 NTU are visually cloudy and host organic sediment.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-navy-50 dark:bg-navy-900/60 p-3 rounded-xl border border-navy-105/50 dark:border-navy-800/40 text-[9px] text-navy-400 flex gap-1.5 items-start mt-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span>
              Configured threshold limits are applied automatically in the backend telemetry evaluation loop.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Thresholds;
