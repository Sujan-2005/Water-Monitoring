import React from 'react';
import { useApp } from '../context/AppContext';
import { FlaskConical, Play, CheckCircle, Info, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';

const TestScenarios = () => {
  const { simulatorStatus, setScenario } = useApp();

  const SCENARIOS = [
    {
      id: 'normal',
      name: 'Scenario 1: Normal Water',
      description: 'Generates standard healthy water quality telemetry. All five parameters drift randomly inside safe bounds.',
      expected: 'Status shows GOOD. Active alert count is 0. Main cards remain green.',
      severity: 'safe'
    },
    {
      id: 'high_ph',
      name: 'Scenario 2: High pH Event',
      description: 'Simulates chemical/alkaline run-off. pH rises gradually past warning threshold (8.5) and critical threshold (9.0).',
      expected: 'Status changes from GOOD to WARNING, then CRITICAL. Alerts generated and marked on charts.',
      severity: 'critical'
    },
    {
      id: 'low_ph',
      name: 'Scenario 3: Low pH Event',
      description: 'Simulates acid rain/acidic run-off. pH gradually drops below warning (6.5) and critical (6.0) limits.',
      expected: 'Status triggers WARNING then CRITICAL. Active alerts logs logged.',
      severity: 'critical'
    },
    {
      id: 'high_turbidity',
      name: 'Scenario 4: High Turbidity',
      description: 'Simulates heavy rainfall, sediment stir-up, or mud ingress. Turbidity rises from ~1.5 up to ~12 NTU.',
      expected: 'Status breaches limits. High Turbidity warning and critical alarms trigger.',
      severity: 'critical'
    },
    {
      id: 'high_tds',
      name: 'Scenario 5: High TDS Event',
      description: 'Simulates heavy mineral dissolution or chemical spill. TDS counts rise gradually to ~920 ppm.',
      expected: 'Breaches warning limits (500 ppm) and critical limit (800 ppm). TDS alert is logged.',
      severity: 'critical'
    },
    {
      id: 'low_do',
      name: 'Scenario 6: Low Dissolved Oxygen',
      description: 'Simulates high thermal load or eutrophication. Dissolved Oxygen drops gradually from ~7.5 down to ~3.0 mg/L.',
      expected: 'Water safety drops. Warning triggers below 5.5 mg/L, Critical triggers below 4.0 mg/L.',
      severity: 'critical'
    },
    {
      id: 'high_temperature',
      name: 'Scenario 7: High Temperature',
      description: 'Simulates industrial cooling outflow or extreme sun exposure. Temperature rises from ~25°C to ~38°C.',
      expected: 'Breaches warning limit (30°C) and critical limit (35°C). Thermal alarm logged.',
      severity: 'critical'
    },
    {
      id: 'multiple_failure',
      name: 'Scenario 8: Multi-Parameter Failure',
      description: 'Simulates severe structural water pollution. pH, Turbidity, TDS, and DO spike out-of-range simultaneously.',
      expected: 'Status becomes CRITICAL. Multiple alerts stack in notification dropdown.',
      severity: 'critical'
    },
    {
      id: 'sensor_failure',
      name: 'Scenario 9: Sensor Failure',
      description: 'Simulates physical hardware failure (e.g. disconnected sensor wire). pH sensor output drops to invalid (null).',
      expected: 'Dashboard pH card displays ERROR. Sensor Health status indicates ERROR. Labeled as "bad sensor" not "bad water".',
      severity: 'warning'
    },
    {
      id: 'offline',
      name: 'Scenario 10: Device Offline',
      description: 'Simulates ESP32 Wi-Fi disconnect or battery exhaustion. Stops emitting telemetry packets from Node WQM-001.',
      expected: 'Connection status becomes OFFLINE. Last seen timer starts counting. Offline alarm generated after configured timeout.',
      severity: 'critical'
    },
    {
      id: 'recovery',
      name: 'Scenario 11: Gradual Recovery',
      description: 'Simulates water remediation, filtration, or calibration. Automatically brings all parameters back to baselines.',
      expected: 'Parameters return to range. Recovery notifications generated. Overall status returns to GOOD.',
      severity: 'safe'
    },
    {
      id: 'random',
      name: 'Scenario 12: Random Fluctuations',
      description: 'A continuous long-running monitoring simulation with minor anomalies and noise. Perfect for loop demonstrations.',
      expected: 'Diurnal patterns remain active. Occasional random spikes trigger warning, then recover.',
      severity: 'safe'
    }
  ];

  const getSeverityStyle = (sev) => {
    if (sev === 'critical') return 'border-red-500/20 bg-red-500/5 text-red-500';
    if (sev === 'warning') return 'border-amber-500/20 bg-amber-500/5 text-amber-500';
    return 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500';
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-navy-100 dark:border-navy-850 pb-4">
        <div>
          <h2 className="text-xl font-bold text-navy-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-aqua-400" />
            Simulation Test Bed
          </h2>
          <p className="text-xs text-navy-450 dark:text-navy-550 mt-0.5">
            Test on-site alerting models, database pipelines, and dashboards without physical sensor hardware.
          </p>
        </div>
      </div>

      {/* Intro info box */}
      <div className="glass-card p-5 border border-aqua-500/10 bg-aqua-500/5 flex gap-3 items-start">
        <Info className="w-5 h-5 text-aqua-400 flex-shrink-0 mt-0.5 animate-pulse" />
        <div className="text-xs space-y-1.5 leading-relaxed text-navy-600 dark:text-navy-300">
          <p>
            <strong>Evaluator Notice:</strong> Since the physical ESP32/sensors are not connected, this simulation test bed allows testing the full software stack. Each scenario triggers specific chemical transitions, alert logs, and recovery events.
          </p>
          <p>
            You can trigger any profile below, then navigate back to the <strong>Dashboard</strong> or <strong>Live Monitoring</strong> to watch the values adjust gradually over time.
          </p>
        </div>
      </div>

      {/* Grid of Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {SCENARIOS.map((sc) => {
          const isActive = simulatorStatus.currentScenario === sc.id;

          return (
            <div
              key={sc.id}
              className={`glass-card p-5 flex flex-col justify-between min-h-[220px] transition-all relative overflow-hidden border ${
                isActive
                  ? 'border-aqua-500 dark:border-aqua-400 shadow-lg shadow-aqua-500/5 ring-1 ring-aqua-500'
                  : 'border-navy-100/50 dark:border-navy-800/40 hover:border-navy-200 dark:hover:border-navy-700'
              }`}
            >
              {/* Header */}
              <div>
                <div className="flex justify-between items-start gap-3">
                  <h3 className="font-bold text-xs text-navy-800 dark:text-white uppercase tracking-wide leading-normal">
                    {sc.name}
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase ${getSeverityStyle(sc.severity)}`}>
                    {sc.severity}
                  </span>
                </div>
                
                <p className="text-xs text-navy-600 dark:text-navy-400 mt-3 leading-relaxed">
                  {sc.description}
                </p>
              </div>

              {/* Outputs */}
              <div className="mt-4 pt-3.5 border-t border-navy-100/40 dark:border-navy-850/40 text-[10px] space-y-1">
                <span className="font-bold text-navy-450 dark:text-navy-500 uppercase">Expected System Response:</span>
                <p className="text-navy-700 dark:text-navy-300 leading-normal font-medium">{sc.expected}</p>
              </div>

              {/* Trigger button */}
              <button
                onClick={() => setScenario(sc.id)}
                disabled={isActive}
                className={`w-full mt-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                  isActive
                    ? 'bg-aqua-500 text-navy-950 font-bold border border-aqua-500'
                    : 'bg-white hover:bg-navy-100 dark:bg-navy-900 dark:hover:bg-navy-800 border border-navy-200 dark:border-navy-700 text-navy-750 dark:text-navy-200'
                }`}
              >
                {isActive ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 stroke-[3]" />
                    Scenario Active
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Activate Scenario
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default TestScenarios;
