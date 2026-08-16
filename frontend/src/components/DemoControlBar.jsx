import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Play, Pause, RotateCcw, Zap, ChevronUp, ChevronDown, Check, Sliders, AlertTriangle } from 'lucide-react';

const DemoControlBar = () => {
  const {
    selectedDevice,
    simulatorStatus,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    setScenario,
    setUpdateInterval,
    injectValue
  } = useApp();

  const [isMinimized, setIsMinimized] = useState(true); // Minimized by default to keep layout neat
  const [injectParam, setInjectParam] = useState('ph');
  const [injectVal, setInjectVal] = useState('8.8');
  const [injectionSuccess, setInjectionSuccess] = useState(false);

  const SCENARIOS = [
    { value: 'random', label: 'Random Fluctuation' },
    { value: 'normal', label: 'Healthy Baseline' },
    { value: 'high_ph', label: 'High pH Event' },
    { value: 'low_ph', label: 'Low pH Event' },
    { value: 'high_turbidity', label: 'High Turbidity Event' },
    { value: 'high_tds', label: 'High TDS Event' },
    { value: 'low_do', label: 'Low Dissolved Oxygen' },
    { value: 'high_temperature', label: 'High Temperature' },
    { value: 'multiple_failure', label: 'Multi-Parameter Spike' },
    { value: 'sensor_failure', label: 'Sensor Failure (pH)' },
    { value: 'offline', label: 'Device Offline' },
    { value: 'recovery', label: 'Gradual Recovery' }
  ];

  const handleInject = async (e) => {
    e.preventDefault();
    if (selectedDevice === 'ALL') {
      alert('Please select a specific device station to inject anomalies.');
      return;
    }
    const val = parseFloat(injectVal);
    if (isNaN(val)) {
      alert('Please input a valid numeric value.');
      return;
    }
    await injectValue(selectedDevice, injectParam, val);
    setInjectionSuccess(true);
    setTimeout(() => setInjectionSuccess(false), 2000);
  };

  const getScenarioLabel = (val) => {
    const sc = SCENARIOS.find(s => s.value === val);
    return sc ? sc.label : val;
  };

  return (
    <div
      className={`fixed bottom-0 right-0 z-45 bg-navy-900/95 dark:bg-navy-950/98 border-t border-navy-800 text-white transition-all duration-300 w-full md:w-[720px] shadow-2xl rounded-t-3xl ${
        isMinimized ? 'h-11 overflow-hidden' : 'h-auto py-5 px-6'
      } no-print`}
      style={{ right: '0px' }}
    >
      {/* Title / Minimize Bar */}
      <div
        onClick={() => setIsMinimized(!isMinimized)}
        className="h-11 flex items-center justify-between cursor-pointer border-b border-navy-800/40 px-6 -mx-6 -mt-5 md:px-0 md:mx-0 md:mt-0 pb-1 font-sans select-none"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aqua-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-aqua-400"></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-aqua-400">
            DEMO PANEL: SIMULATION CONTROL CENTER
          </span>
          <span className="text-[10px] bg-navy-800 text-navy-300 px-2 py-0.5 rounded-full font-mono font-medium ml-2">
            Scenario: {getScenarioLabel(simulatorStatus.currentScenario)}
          </span>
        </div>
        <button className="text-navy-400 hover:text-white transition-colors">
          {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {!isMinimized && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
          {/* Section 1: Playback Controls & Speed */}
          <div className="flex flex-col gap-4">
            <div>
              <h4 className="text-[10px] font-bold text-navy-450 uppercase tracking-widest mb-2.5">
                Simulator Loop Control
              </h4>
              <div className="flex items-center gap-2">
                {simulatorStatus.status === 'running' ? (
                  <button
                    onClick={pauseSimulation}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-navy-950 font-semibold text-xs transition-colors"
                  >
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    Pause Loop
                  </button>
                ) : (
                  <button
                    onClick={startSimulation}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-navy-950 font-semibold text-xs transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Start Loop
                  </button>
                )}

                <button
                  onClick={resetSimulation}
                  className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-navy-300 hover:text-white font-semibold text-xs border border-navy-750 transition-colors"
                  title="Clear readings & Reset DB to default"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Database
                </button>
              </div>
            </div>

            {/* Scenario Dropdown */}
            <div>
              <h4 className="text-[10px] font-bold text-navy-450 uppercase tracking-widest mb-2">
                Trigger Telemetry Profile
              </h4>
              <select
                value={simulatorStatus.currentScenario}
                onChange={(e) => setScenario(e.target.value)}
                className="w-full text-xs bg-navy-800 border border-navy-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-aqua-500 text-white cursor-pointer select-none font-medium"
              >
                {SCENARIOS.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Interval Timer */}
            <div>
              <h4 className="text-[10px] font-bold text-navy-450 uppercase tracking-widest mb-2">
                Update Frequency
              </h4>
              <div className="flex gap-1 bg-navy-850 p-1 rounded-xl border border-navy-750">
                {[1, 2, 3, 5, 10].map(s => (
                  <button
                    key={s}
                    onClick={() => setUpdateInterval(s)}
                    className={`flex-1 text-center py-1 rounded-lg text-xs font-semibold font-mono transition-all ${
                      simulatorStatus.updateInterval === s
                        ? 'bg-aqua-500 text-navy-950 shadow-sm'
                        : 'text-navy-400 hover:text-white'
                    }`}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Event Injection */}
          <div className="flex flex-col justify-between">
            <form onSubmit={handleInject} className="flex flex-col gap-3">
              <div>
                <h4 className="text-[10px] font-bold text-navy-450 uppercase tracking-widest mb-1">
                  Manual Value Injection
                </h4>
                <p className="text-[9px] text-navy-400 mb-2.5">
                  Directly override the sensor outputs for the selected device (<span className="text-aqua-300 font-bold">{selectedDevice}</span>).
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-navy-400 uppercase">Parameter</label>
                  {/* <select
                    value={injectParam}
                    onChange={(e) => setInjectParam(e.target.value)}
                    className="w-full text-xs bg-navy-850 border border-navy-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-aqua-500 text-white cursor-pointer select-none"
                  >
                    <option value="ph">pH</option>
                    <option value="temp">Temperature</option>
                    <option value="turb">Turbidity</option>
                    <option value="tds">TDS</option>
                    <option value="do">Dissolved Oxygen</option>
                  </select> */}
                  <select
  value={injectParam}
  onChange={(e) => setInjectParam(e.target.value)}
  className="w-full text-xs bg-[#0f172a] border border-[#334155] rounded-lg px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
>
  <option value="ph">pH</option>
  <option value="temp">Temperature</option>
  <option value="turb">Turbidity</option>
  <option value="tds">TDS</option>
  <option value="do">Dissolved Oxygen</option>
</select>
                </div>

                {/* <div>
                  <label className="text-[9px] font-semibold text-navy-400 uppercase">Value to Force</label>
                  <input
                    type="number"
                    step="0.01"
                    value={injectVal}
                    onChange={(e) => setInjectVal(e.target.value)}
                    className="w-full text-xs bg-navy-850 border border-navy-700 rounded-lg px-2 py-1.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-aqua-500"
                  />
                </div> */}
                <div>
  <label className="text-[9px] font-semibold text-navy-400 uppercase">
    Value to Force
  </label>

  <input
    type="number"
    step="0.01"
    value={injectVal}
    onChange={(e) => setInjectVal(e.target.value)}
    className="w-full text-xs bg-[#0f172a] border border-[#334155] rounded-lg px-2 py-1.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
  />
</div>
              </div>

              <button
                type="submit"
                disabled={selectedDevice === 'ALL'}
                className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  selectedDevice === 'ALL'
                    ? 'bg-navy-800 text-navy-500 cursor-not-allowed border border-navy-750'
                    : injectionSuccess
                    ? 'bg-emerald-500 text-navy-950 font-bold'
                    : 'bg-aqua-500 hover:bg-aqua-600 text-navy-950 font-bold'
                }`}
              >
                {injectionSuccess ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    Injected Successfully!
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    Inject Value into {selectedDevice}
                  </>
                )}
              </button>
            </form>

            <div className="bg-navy-850 p-2.5 rounded-xl border border-navy-750 text-[9px] text-navy-400 mt-2 flex gap-1.5 items-start">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5 animate-pulse" />
              <span>
                <strong>Note:</strong> Telemetry status calculations are executed instantly in the backend pipeline and propagated back here.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoControlBar;
