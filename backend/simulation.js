const DB = require('./db');
const ThresholdEngine = require('./thresholdEngine');
const AlertEngine = require('./alertEngine');

// Global simulation state
let status = 'running'; // 'running', 'paused', 'stopped'
let currentScenario = 'random'; // default scenario
let updateInterval = 3000; // default 3 seconds
let timerRef = null;
let tickCount = 0;
let broadcastCallback = null;

// Baseline values for the three devices
const BASELINES = {
  'WQM-001': { ph: 7.24, temp: 25.4, turb: 1.4, tds: 312, do: 7.2 },
  'WQM-002': { ph: 7.42, temp: 26.2, turb: 1.8, tds: 355, do: 6.9 },
  'WQM-003': { ph: 7.15, temp: 24.8, turb: 1.2, tds: 295, do: 7.5 }
};

// Current in-memory values for each device
const deviceValues = {
  'WQM-001': { ...BASELINES['WQM-001'] },
  'WQM-002': { ...BASELINES['WQM-002'] },
  'WQM-003': { ...BASELINES['WQM-003'] }
};

// Error tracking for sensor health page
const sensorErrorCounts = {
  'WQM-001': { ph: 0, temp: 0, turb: 0, tds: 0, do: 0 },
  'WQM-002': { ph: 0, temp: 0, turb: 0, tds: 0, do: 0 },
  'WQM-003': { ph: 0, temp: 0, turb: 0, tds: 0, do: 0 }
};

const sensorTotalCounts = {
  'WQM-001': { ph: 100, temp: 100, turb: 100, tds: 100, do: 100 },
  'WQM-002': { ph: 100, temp: 100, turb: 100, tds: 100, do: 100 },
  'WQM-003': { ph: 100, temp: 100, turb: 100, tds: 100, do: 100 }
};

/**
 * Reset values to baselines
 */
function resetDeviceValues() {
  Object.keys(deviceValues).forEach(devId => {
    deviceValues[devId] = { ...BASELINES[devId] };
  });
  tickCount = 0;
}

/**
 * Generate a tick of simulated data
 */
function runSimulationTick() {
  if (status !== 'running') return;

  tickCount++;
  
  // WQM-002 and WQM-003 always run standard random fluctuations
  simulateDeviceStandard('WQM-002');
  simulateDeviceStandard('WQM-003');

  // WQM-001 changes based on the selected scenario
  if (currentScenario === 'offline') {
    // Simulate offline: do NOT emit WQM-001 telemetry, check offline status
    const dev = DB.getDevice('WQM-001');
    const lastSeenTime = new Date(dev.lastSeen).getTime();
    const elapsedSec = (Date.now() - lastSeenTime) / 1000;
    
    // If it has been offline for long enough, set status to offline and trigger alert
    if (dev.status === 'ONLINE' && elapsedSec > 8) {
      DB.updateDeviceStatus('WQM-001', 'OFFLINE');
      const alert = AlertEngine.handleDeviceOffline('WQM-001');
      if (alert && broadcastCallback) {
        broadcastCallback({ type: 'alert', data: alert });
      }
      if (broadcastCallback) {
        broadcastCallback({ type: 'device_update', data: DB.getDevice('WQM-001') });
      }
    }
  } else {
    // Ensure WQM-001 is online
    const dev = DB.getDevice('WQM-001');
    if (dev && dev.status === 'OFFLINE') {
      DB.updateDeviceStatus('WQM-001', 'ONLINE');
      const recoveryAlert = AlertEngine.handleDeviceOnline('WQM-001');
      if (recoveryAlert && broadcastCallback) {
        broadcastCallback({ type: 'alert', data: recoveryAlert });
      }
      if (broadcastCallback) {
        broadcastCallback({ type: 'device_update', data: DB.getDevice('WQM-001') });
      }
    }

    // Run active scenario logic on WQM-001
    simulateWQM01Scenario();
  }

  // Send updates for all active devices
  const devices = ['WQM-001', 'WQM-002', 'WQM-003'];
  devices.forEach(devId => {
    if (devId === 'WQM-001' && currentScenario === 'offline') return; // Skip offline device
    
    const reading = {
      deviceId: devId,
      ph: deviceValues[devId].ph,
      temperature: deviceValues[devId].temp,
      turbidity: deviceValues[devId].turb,
      tds: deviceValues[devId].tds,
      dissolvedOxygen: deviceValues[devId].do
    };

    processTelemetryPipeline(reading);
  });
}

/**
 * Standard slow fluctuations for background devices
 */
function simulateDeviceStandard(devId) {
  const base = BASELINES[devId];
  const current = deviceValues[devId];
  
  // Slowly steer back to baseline with noise
  current.ph = parseFloat((current.ph + (base.ph - current.ph) * 0.1 + (Math.random() - 0.5) * 0.05).toFixed(2));
  current.temp = parseFloat((current.temp + (base.temp - current.temp) * 0.1 + (Math.random() - 0.5) * 0.2).toFixed(1));
  current.turb = parseFloat(Math.max(0.1, current.turb + (base.turb - current.turb) * 0.1 + (Math.random() - 0.5) * 0.1).toFixed(2));
  current.tds = Math.max(10, Math.floor(current.tds + (base.tds - current.tds) * 0.1 + (Math.random() - 0.5) * 4));
  current.do = parseFloat(Math.max(0.1, current.do + (base.do - current.do) * 0.1 + (Math.random() - 0.5) * 0.15).toFixed(1));
}

/**
 * WQM-001 Scenario Generators
 */
function simulateWQM01Scenario() {
  const current = deviceValues['WQM-001'];
  const base = BASELINES['WQM-001'];

  switch (currentScenario) {
    case 'normal':
      simulateDeviceStandard('WQM-001');
      break;

    case 'high_ph':
      // Gradually rise pH to 9.5
      current.ph = parseFloat(Math.min(9.6, current.ph + 0.18 + (Math.random() - 0.5) * 0.03).toFixed(2));
      // Keep others standard
      simulateDeviceStandardExcept('WQM-001', ['ph']);
      break;

    case 'low_ph':
      // Gradually decrease pH to 5.2
      current.ph = parseFloat(Math.max(4.8, current.ph - 0.18 + (Math.random() - 0.5) * 0.03).toFixed(2));
      simulateDeviceStandardExcept('WQM-001', ['ph']);
      break;

    case 'high_turbidity':
      // Gradually rise Turbidity to 11.5 NTU
      current.turb = parseFloat(Math.min(15.0, current.turb + 0.9 + Math.random() * 0.3).toFixed(2));
      simulateDeviceStandardExcept('WQM-001', ['turb']);
      break;

    case 'high_tds':
      // Gradually rise TDS to 920 ppm
      current.tds = Math.min(1100, Math.floor(current.tds + 65 + (Math.random() - 0.5) * 8));
      simulateDeviceStandardExcept('WQM-001', ['tds']);
      break;

    case 'low_do':
      // Gradually fall DO to 3.2 mg/L
      current.do = parseFloat(Math.max(2.2, current.do - 0.38 + (Math.random() - 0.5) * 0.05).toFixed(1));
      simulateDeviceStandardExcept('WQM-001', ['do']);
      break;

    case 'high_temperature':
      // Gradually rise temp to 37.5 °C
      current.temp = parseFloat(Math.min(41.0, current.temp + 1.1 + (Math.random() - 0.5) * 0.1).toFixed(1));
      simulateDeviceStandardExcept('WQM-001', ['temp']);
      break;

    case 'multiple_failure':
      // Fail everything!
      current.ph = parseFloat(Math.min(9.4, current.ph + 0.18).toFixed(2));
      current.turb = parseFloat(Math.min(10.5, current.turb + 0.8).toFixed(2));
      current.tds = Math.min(880, current.tds + 60);
      current.do = parseFloat(Math.max(3.2, current.do - 0.35).toFixed(1));
      current.temp = parseFloat(Math.min(34.0, current.temp + 0.6).toFixed(1));
      break;

    case 'sensor_failure':
      // pH sensor stops sending data (null)
      current.ph = null;
      simulateDeviceStandardExcept('WQM-001', ['ph']);
      break;

    case 'recovery':
      // Gradually return everything back to baseline
      let allRecovered = true;
      
      if (Math.abs(current.ph - base.ph) > 0.05 && current.ph !== null) {
        const dir = current.ph > base.ph ? -1 : 1;
        current.ph = parseFloat((current.ph + dir * 0.15).toFixed(2));
        allRecovered = false;
      } else if (current.ph === null) {
        current.ph = base.ph; // recover sensor reading
        allRecovered = false;
      }
      
      if (Math.abs(current.temp - base.temp) > 0.3) {
        const dir = current.temp > base.temp ? -1 : 1;
        current.temp = parseFloat((current.temp + dir * 0.8).toFixed(1));
        allRecovered = false;
      }
      
      if (Math.abs(current.turb - base.turb) > 0.1) {
        const dir = current.turb > base.turb ? -1 : 1;
        current.turb = parseFloat(Math.max(0.1, current.turb + dir * 0.6).toFixed(2));
        allRecovered = false;
      }
      
      if (Math.abs(current.tds - base.tds) > 10) {
        const dir = current.tds > base.tds ? -1 : 1;
        current.tds = Math.max(10, Math.floor(current.tds + dir * 50));
        allRecovered = false;
      }
      
      if (Math.abs(current.do - base.do) > 0.2) {
        const dir = current.do > base.do ? -1 : 1;
        current.do = parseFloat(Math.max(0.1, current.do + dir * 0.35).toFixed(1));
        allRecovered = false;
      }

      if (allRecovered) {
        // Automatically switch back to random/normal monitoring once recovered
        currentScenario = 'random';
      }
      break;

    case 'random':
    default:
      simulateDeviceStandard('WQM-001');
      // Add occasional random noise/spikes for visual interest
      if (tickCount % 20 === 0) {
        // random pH dip
        current.ph = parseFloat((current.ph - 0.4).toFixed(2));
      }
      if (tickCount % 35 === 0) {
        // random turbidity spike
        current.turb = parseFloat((current.turb + 2.5).toFixed(2));
      }
      break;
  }
}

/**
 * Fluctuate non-target parameters normally
 */
function simulateDeviceStandardExcept(devId, excludeList) {
  const base = BASELINES[devId];
  const current = deviceValues[devId];

  if (!excludeList.includes('ph')) {
    current.ph = parseFloat((current.ph + (base.ph - current.ph) * 0.1 + (Math.random() - 0.5) * 0.03).toFixed(2));
  }
  if (!excludeList.includes('temp')) {
    current.temp = parseFloat((current.temp + (base.temp - current.temp) * 0.1 + (Math.random() - 0.5) * 0.1).toFixed(1));
  }
  if (!excludeList.includes('turb')) {
    current.turb = parseFloat(Math.max(0.1, current.turb + (base.turb - current.turb) * 0.1 + (Math.random() - 0.5) * 0.05).toFixed(2));
  }
  if (!excludeList.includes('tds')) {
    current.tds = Math.floor(current.tds + (base.tds - current.tds) * 0.1 + (Math.random() - 0.5) * 2);
  }
  if (!excludeList.includes('do')) {
    current.do = parseFloat(Math.max(0.1, current.do + (base.do - current.do) * 0.1 + (Math.random() - 0.5) * 0.08).toFixed(1));
  }
}

/**
 * Processes a single telemetry packet through validation, threshold checks,
 * alert triggers, database storage, and client broadcast.
 * This is the SAME pipeline used for simulated ticks AND ESP32 REST uploads!
 */
function processTelemetryPipeline(reading) {
  const devId = reading.deviceId;
  
  // 1. Validation & Sensor Quality Statistics Tracking
  const params = ['ph', 'temperature', 'turbidity', 'tds', 'dissolvedOxygen'];
  const mappedParams = { ph: 'ph', temperature: 'temp', turbidity: 'turb', tds: 'tds', dissolvedOxygen: 'do' };
  
  const sensorsUpdate = [];
  
  params.forEach(paramName => {
    sensorTotalCounts[devId][mappedParams[paramName]]++;
    
    const val = reading[paramName];
    const isError = (val === null || val === undefined || isNaN(val));
    
    if (isError) {
      sensorErrorCounts[devId][mappedParams[paramName]]++;
    }
    
    const total = sensorTotalCounts[devId][mappedParams[paramName]];
    const errors = sensorErrorCounts[devId][mappedParams[paramName]];
    const quality = parseFloat((((total - errors) / total) * 100).toFixed(1));
    
    sensorsUpdate.push({
      name: paramName === 'dissolvedOxygen' ? 'Dissolved Oxygen' : paramName.charAt(0).toUpperCase() + paramName.slice(1),
      status: isError ? 'ERROR' : 'OK',
      quality: quality
    });
  });

  DB.updateDeviceSensors(devId, sensorsUpdate);

  // 2. Threshold evaluation
  const evaluation = ThresholdEngine.evaluateTelemetry(reading);
  
  // Set overall status on the reading
  reading.status = evaluation.overallStatus;
  reading.source = reading.source || 'simulation';
  
  // 3. Save to database
  const savedTelemetry = DB.addTelemetry(reading);
  
  // Update device status in database
  DB.updateDeviceDetails(devId, { status: evaluation.overallStatus === 'sensor_error' ? 'WARNING' : 'ONLINE' });

  // 4. Process alerts
  const generatedAlerts = AlertEngine.processAlerts(evaluation, reading);

  // 5. Broadcast to connected clients
  if (broadcastCallback) {
    // Broadcast latest telemetry
    broadcastCallback({
      type: 'telemetry',
      data: savedTelemetry
    });

    // Broadcast system/device update
    broadcastCallback({
      type: 'device_update',
      data: DB.getDevice(devId)
    });

    // Broadcast alerts generated in this pipeline run
    generatedAlerts.forEach(alert => {
      broadcastCallback({
        type: 'alert',
        data: alert
      });
    });
  }
}

/**
 * Initialize timer
 */
function initTimer() {
  if (timerRef) clearInterval(timerRef);
  
  timerRef = setInterval(() => {
    try {
      runSimulationTick();
    } catch (e) {
      console.error('Simulation loop error:', e);
    }
  }, updateInterval);
}

const SimulationEngine = {
  init: (callback) => {
    broadcastCallback = callback;
    initTimer();
  },

  getStatus: () => ({
    status,
    currentScenario,
    updateInterval: updateInterval / 1000,
    tickCount
  }),

  start: () => {
    status = 'running';
    DB.updateSystemStatus('simulator', 'RUNNING');
    if (broadcastCallback) {
      broadcastCallback({ type: 'system_status', data: DB.getSystemStatus() });
      broadcastCallback({ type: 'simulator_status', data: SimulationEngine.getStatus() });
    }
    return SimulationEngine.getStatus();
  },

  pause: () => {
    status = 'paused';
    DB.updateSystemStatus('simulator', 'PAUSED');
    if (broadcastCallback) {
      broadcastCallback({ type: 'system_status', data: DB.getSystemStatus() });
      broadcastCallback({ type: 'simulator_status', data: SimulationEngine.getStatus() });
    }
    return SimulationEngine.getStatus();
  },

  stop: () => {
    status = 'stopped';
    DB.updateSystemStatus('simulator', 'STOPPED');
    if (broadcastCallback) {
      broadcastCallback({ type: 'system_status', data: DB.getSystemStatus() });
      broadcastCallback({ type: 'simulator_status', data: SimulationEngine.getStatus() });
    }
    return SimulationEngine.getStatus();
  },

  reset: () => {
    resetDeviceValues();
    DB.clearData();
    if (broadcastCallback) {
      broadcastCallback({ type: 'reset', data: 'data cleared' });
      broadcastCallback({ type: 'simulator_status', data: SimulationEngine.getStatus() });
      broadcastCallback({ type: 'system_status', data: DB.getSystemStatus() });
    }
    return SimulationEngine.getStatus();
  },

  setScenario: (scenario) => {
    currentScenario = scenario;
    if (scenario === 'recovery') {
      // Resolve any existing offline alerts immediately if we move to recovery
      const alert = AlertEngine.handleDeviceOnline('WQM-001');
      if (alert && broadcastCallback) {
        broadcastCallback({ type: 'alert', data: alert });
      }
    }
    if (broadcastCallback) {
      broadcastCallback({ type: 'simulator_status', data: SimulationEngine.getStatus() });
    }
    return SimulationEngine.getStatus();
  },

  setUpdateInterval: (seconds) => {
    updateInterval = seconds * 1000;
    initTimer();
    if (broadcastCallback) {
      broadcastCallback({ type: 'simulator_status', data: SimulationEngine.getStatus() });
    }
    return SimulationEngine.getStatus();
  },

  injectEvent: (deviceId, parameter, value) => {
    if (deviceValues[deviceId] && deviceValues[deviceId][parameter] !== undefined) {
      deviceValues[deviceId][parameter] = value;
      // Immediately run the pipeline to reflect the injection
      const reading = {
        deviceId,
        ph: deviceValues[deviceId].ph,
        temperature: deviceValues[deviceId].temp,
        turbidity: deviceValues[deviceId].turb,
        tds: deviceValues[deviceId].tds,
        dissolvedOxygen: deviceValues[deviceId].do,
        source: 'manual_injection'
      };
      processTelemetryPipeline(reading);
      return { success: true, reading };
    }
    return { success: false, error: 'Invalid device or parameter' };
  },

  // Expose raw entry point for external ESP32 REST POST uploads
  receiveExternalTelemetry: (reading) => {
    reading.source = 'hardware_api';
    processTelemetryPipeline(reading);
    return { success: true, timestamp: new Date().toISOString() };
  },

  getSensorHealth: (deviceId) => {
    const dev = DB.getDevice(deviceId);
    if (!dev) return null;
    
    return dev.sensors.map(s => {
      const paramCode = s.name === 'pH' ? 'ph' : s.name === 'Temperature' ? 'temp' : s.name === 'Turbidity' ? 'turb' : s.name === 'TDS' ? 'tds' : 'do';
      return {
        name: s.name,
        status: s.status,
        quality: s.quality,
        errorCount: sensorErrorCounts[deviceId][paramCode],
        totalCount: sensorTotalCounts[deviceId][paramCode],
        lastUpdate: dev.lastSeen
      };
    });
  }
};

module.exports = SimulationEngine;
