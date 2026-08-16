require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const DB = require('./db');
const SimulationEngine = require('./simulation');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

// List of connected SSE clients
let clients = [];

// Broadcast utility passed to the simulation engine
function broadcast(event) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  clients.forEach(client => {
    try {
      client.res.write(data);
    } catch (e) {
      console.error('Error writing to client stream:', e);
    }
  });
}

// Initialize the simulation engine with the broadcast callback
SimulationEngine.init(broadcast);

// --- REST API ENDPOINTS ---

// Server-Sent Events (SSE) Telemetry Stream
app.get('/api/telemetry/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Establish stream

  const clientId = Date.now();
  clients.push({ id: clientId, res });

  // Send initial simulator status and active alerts
  const initData = {
    type: 'init',
    data: {
      simulator: SimulationEngine.getStatus(),
      system: DB.getSystemStatus(),
      activeAlerts: DB.getActiveAlerts()
    }
  };
  res.write(`data: ${JSON.stringify(initData)}\n\n`);

  req.on('close', () => {
    clients = clients.filter(c => c.id !== clientId);
  });
});

// Devices Endpoints
app.get('/api/devices', (req, res) => {
  res.json(DB.getDevices());
});

app.get('/api/devices/:id', (req, res) => {
  const device = DB.getDevice(req.params.id);
  if (!device) return res.status(404).json({ error: 'Device not found' });
  res.json(device);
});

// Telemetry Endpoints
app.get('/api/telemetry/latest/:deviceId', (req, res) => {
  const latest = DB.getLatestTelemetry(req.params.deviceId);
  if (!latest) return res.status(404).json({ error: 'No telemetry found for this device' });
  res.json(latest);
});

app.get('/api/telemetry/history/:deviceId', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const history = DB.getTelemetry(req.params.deviceId, limit);
  res.json(history);
});

// ESP32 Direct REST API Upload Endpoint
app.post('/api/telemetry', (req, res) => {
  const { deviceId, ph, temperature, turbidity, tds, dissolvedOxygen } = req.body;
  
  if (!deviceId) {
    return res.status(400).json({ error: 'Missing deviceId' });
  }

  // Check if device exists, otherwise register it
  let device = DB.getDevice(deviceId);
  if (!device) {
    device = DB.updateDeviceDetails(deviceId, {
      deviceId,
      name: `ESP32 Node ${deviceId}`,
      type: 'ESP32 Water Quality Station',
      location: 'External REST Station',
      latitude: 12.9716,
      longitude: 77.5946,
      status: 'ONLINE',
      connectionType: 'Wi-Fi',
      firmware: 'v1.0.0',
      sensors: [
        { name: 'pH', status: 'OK', quality: 100 },
        { name: 'Temperature', status: 'OK', quality: 100 },
        { name: 'Turbidity', status: 'OK', quality: 100 },
        { name: 'TDS', status: 'OK', quality: 100 },
        { name: 'Dissolved Oxygen', status: 'OK', quality: 100 }
      ]
    });
  }

  const reading = {
    deviceId,
    ph: ph !== undefined ? parseFloat(ph) : null,
    temperature: temperature !== undefined ? parseFloat(temperature) : null,
    turbidity: turbidity !== undefined ? parseFloat(turbidity) : null,
    tds: tds !== undefined ? parseInt(tds) : null,
    dissolvedOxygen: dissolvedOxygen !== undefined ? parseFloat(dissolvedOxygen) : null,
    source: 'hardware_api'
  };

  try {
    const result = SimulationEngine.receiveExternalTelemetry(reading);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to process telemetry', message: err.message });
  }
});

// Alerts Endpoints
app.get('/api/alerts', (req, res) => {
  res.json(DB.getAlerts());
});

app.get('/api/alerts/active', (req, res) => {
  res.json(DB.getActiveAlerts());
});

app.post('/api/alerts/acknowledge/:id', (req, res) => {
  const { user } = req.body;
  const alert = DB.acknowledgeAlert(req.params.id, user || 'Operator');
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  
  // Broadcast update
  broadcast({ type: 'alert_updated', data: alert });
  res.json(alert);
});

// Thresholds Endpoints
app.get('/api/thresholds', (req, res) => {
  res.json(DB.getThresholds());
});

app.put('/api/thresholds/:parameter', (req, res) => {
  const { warningLow, warningHigh, criticalLow, criticalHigh } = req.body;
  const updated = DB.updateThreshold(req.params.parameter, {
    warningLow: parseFloat(warningLow),
    warningHigh: parseFloat(warningHigh),
    criticalLow: parseFloat(criticalLow),
    criticalHigh: parseFloat(criticalHigh)
  });
  
  if (!updated) return res.status(404).json({ error: 'Parameter thresholds not found' });
  
  // Broadcast threshold change to update UI cards
  broadcast({ type: 'thresholds_updated', data: DB.getThresholds() });
  res.json(updated);
});

// System Status Endpoint
app.get('/api/system/status', (req, res) => {
  res.json(DB.getSystemStatus());
});

// Sensor Health Endpoint
app.get('/api/sensor/health/:deviceId', (req, res) => {
  const health = SimulationEngine.getSensorHealth(req.params.deviceId);
  if (!health) return res.status(404).json({ error: 'Device sensors not found' });
  res.json(health);
});

// Simulation Controls
app.get('/api/simulation/status', (req, res) => {
  res.json(SimulationEngine.getStatus());
});

app.post('/api/simulation/start', (req, res) => {
  res.json(SimulationEngine.start());
});

app.post('/api/simulation/pause', (req, res) => {
  res.json(SimulationEngine.pause());
});

app.post('/api/simulation/stop', (req, res) => {
  res.json(SimulationEngine.stop());
});

app.post('/api/simulation/reset', (req, res) => {
  res.json(SimulationEngine.reset());
});

app.post('/api/simulation/scenario', (req, res) => {
  const { scenario } = req.body;
  if (!scenario) return res.status(400).json({ error: 'Missing scenario name' });
  res.json(SimulationEngine.setScenario(scenario));
});

app.post('/api/simulation/interval', (req, res) => {
  const { interval } = req.body;
  if (!interval || isNaN(interval)) return res.status(400).json({ error: 'Invalid interval seconds' });
  res.json(SimulationEngine.setUpdateInterval(parseInt(interval)));
});

app.post('/api/simulation/inject', (req, res) => {
  const { deviceId, parameter, value } = req.body;
  if (!deviceId || !parameter || value === undefined) {
    return res.status(400).json({ error: 'Missing parameters: deviceId, parameter, value' });
  }
  const result = SimulationEngine.injectEvent(deviceId, parameter, value === null ? null : parseFloat(value));
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

// Analytics Dashboard Endpoint
app.get('/api/analytics/:deviceId', (req, res) => {
  const deviceId = req.params.deviceId;
  // Get last 200 telemetry points
  const history = DB.getTelemetry(deviceId, 200);
  const alerts = DB.getAlerts().filter(a => a.deviceId === deviceId);
  const thresholds = DB.getThresholds();

  if (history.length === 0) {
    return res.json({
      average: {}, min: {}, max: {}, stdDev: {},
      timeDistribution: { normal: 100, warning: 0, critical: 0 },
      alertsCount: 0
    });
  }

  // Calculate statistics for each parameter
  const params = ['ph', 'temperature', 'turbidity', 'tds', 'dissolvedOxygen'];
  const stats = {
    average: {},
    min: {},
    max: {},
    stdDev: {},
    alertsCount: alerts.length,
    timeDistribution: { normal: 0, warning: 0, critical: 0 }
  };

  const validTelemetry = history.filter(t => t.status !== 'sensor_error');

  params.forEach(p => {
    const values = validTelemetry
      .map(t => t[p === 'temperature' ? 'temperature' : p === 'dissolvedOxygen' ? 'dissolvedOxygen' : p])
      .filter(v => v !== null && v !== undefined && !isNaN(v));

    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      stats.average[p] = parseFloat(avg.toFixed(2));
      stats.min[p] = Math.min(...values);
      stats.max[p] = Math.max(...values);
      
      const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
      stats.stdDev[p] = parseFloat(Math.sqrt(variance).toFixed(2));
    } else {
      stats.average[p] = null;
      stats.min[p] = null;
      stats.max[p] = null;
      stats.stdDev[p] = null;
    }
  });

  // Calculate distribution of statuses
  let normalCount = 0;
  let warningCount = 0;
  let criticalCount = 0;

  history.forEach(h => {
    if (h.status === 'normal') normalCount++;
    else if (h.status === 'warning') warningCount++;
    else if (h.status === 'critical') criticalCount++;
  });

  const total = history.length;
  stats.timeDistribution = {
    normal: Math.round((normalCount / total) * 100),
    warning: Math.round((warningCount / total) * 100),
    critical: Math.round((criticalCount / total) * 100)
  };

  // Correlation calculation between parameters
  // (ph vs temp, ph vs DO, turb vs tds, etc.)
  stats.correlations = calculateCorrelations(validTelemetry, params);

  res.json(stats);
});

// Helper to compute correlation coefficients
function calculateCorrelations(data, params) {
  const correlations = {};
  
  for (let i = 0; i < params.length; i++) {
    for (let j = i; j < params.length; j++) {
      const p1 = params[i];
      const p2 = params[j];
      
      if (p1 === p2) {
        correlations[`${p1}_${p2}`] = 1;
        continue;
      }
      
      const x = data.map(d => d[p1 === 'temperature' ? 'temperature' : p1 === 'dissolvedOxygen' ? 'dissolvedOxygen' : p1]).filter(v => v !== null && !isNaN(v));
      const y = data.map(d => d[p2 === 'temperature' ? 'temperature' : p2 === 'dissolvedOxygen' ? 'dissolvedOxygen' : p2]).filter(v => v !== null && !isNaN(v));
      
      const length = Math.min(x.length, y.length);
      if (length < 2) {
        correlations[`${p1}_${p2}`] = 0;
        continue;
      }
      
      const x_sub = x.slice(0, length);
      const y_sub = y.slice(0, length);
      
      const x_mean = x_sub.reduce((a, b) => a + b, 0) / length;
      const y_mean = y_sub.reduce((a, b) => a + b, 0) / length;
      
      let num = 0;
      let den_x = 0;
      let den_y = 0;
      
      for (let k = 0; k < length; k++) {
        const dx = x_sub[k] - x_mean;
        const dy = y_sub[k] - y_mean;
        num += dx * dy;
        den_x += dx * dx;
        den_y += dy * dy;
      }
      
      const r = den_x === 0 || den_y === 0 ? 0 : num / Math.sqrt(den_x * den_y);
      correlations[`${p1}_${p2}`] = parseFloat(r.toFixed(2));
      correlations[`${p2}_${p1}`] = parseFloat(r.toFixed(2)); // symmetric
    }
  }
  
  return correlations;
}

// Start Server
app.listen(PORT, () => {
  console.log(`Water Monitoring IoT Backend running on port ${PORT}`);
  console.log(`SSE Telemetry Streaming active on http://localhost:${PORT}/api/telemetry/stream`);
});
