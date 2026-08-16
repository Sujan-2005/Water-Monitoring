const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data', 'db.json');

// Helper to ensure data directory exists
function ensureDirExists() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Initial Threshold Defaults
const DEFAULT_THRESHOLDS = {
  ph: { parameter: 'ph', unit: 'pH', warningLow: 6.5, warningHigh: 8.5, criticalLow: 6.0, criticalHigh: 9.0 },
  temperature: { parameter: 'temperature', unit: '°C', warningLow: 15.0, warningHigh: 30.0, criticalLow: 10.0, criticalHigh: 35.0 },
  turbidity: { parameter: 'turbidity', unit: 'NTU', warningLow: 0.0, warningHigh: 5.0, criticalLow: 0.0, criticalHigh: 8.0 },
  tds: { parameter: 'tds', unit: 'ppm', warningLow: 0.0, warningHigh: 500.0, criticalLow: 0.0, criticalHigh: 800.0 },
  dissolvedOxygen: { parameter: 'dissolvedOxygen', unit: 'mg/L', warningLow: 5.5, warningHigh: 15.0, criticalLow: 4.0, criticalHigh: 20.0 }
};

// Initial Devices Defaults
const DEFAULT_DEVICES = [
  {
    id: 'WQM-001',
    deviceId: 'WQM-001',
    name: 'Water Quality Monitor 01',
    type: 'ESP32 Water Quality Station',
    location: 'Demo Station North',
    latitude: 12.9716,
    longitude: 77.5946,
    status: 'ONLINE',
    connectionType: 'Wi-Fi',
    lastSeen: new Date().toISOString(),
    firmware: 'v1.0.4',
    sensors: [
      { name: 'pH', status: 'OK', quality: 98.7 },
      { name: 'Temperature', status: 'OK', quality: 99.2 },
      { name: 'Turbidity', status: 'OK', quality: 99.0 },
      { name: 'TDS', status: 'OK', quality: 99.5 },
      { name: 'Dissolved Oxygen', status: 'OK', quality: 98.1 }
    ]
  },
  {
    id: 'WQM-002',
    deviceId: 'WQM-002',
    name: 'Water Quality Monitor 02',
    type: 'ESP32 Water Quality Station',
    location: 'Demo Station East',
    latitude: 12.9816,
    longitude: 77.6046,
    status: 'ONLINE',
    connectionType: 'Wi-Fi',
    lastSeen: new Date().toISOString(),
    firmware: 'v1.0.4',
    sensors: [
      { name: 'pH', status: 'OK', quality: 99.1 },
      { name: 'Temperature', status: 'OK', quality: 99.4 },
      { name: 'Turbidity', status: 'OK', quality: 98.8 },
      { name: 'TDS', status: 'OK', quality: 99.6 },
      { name: 'Dissolved Oxygen', status: 'WARNING', quality: 94.2 }
    ]
  },
  {
    id: 'WQM-003',
    deviceId: 'WQM-003',
    name: 'Water Quality Monitor 03',
    type: 'ESP32 Water Quality Station',
    location: 'Demo Station South Outflow',
    latitude: 12.9616,
    longitude: 77.5846,
    status: 'ONLINE',
    connectionType: 'Cellular',
    lastSeen: new Date().toISOString(),
    firmware: 'v1.0.3',
    sensors: [
      { name: 'pH', status: 'OK', quality: 98.5 },
      { name: 'Temperature', status: 'OK', quality: 99.1 },
      { name: 'Turbidity', status: 'OK', quality: 99.3 },
      { name: 'TDS', status: 'OK', quality: 99.2 },
      { name: 'Dissolved Oxygen', status: 'OK', quality: 98.7 }
    ]
  }
];

// Generate Seed Telemetry
function generateSeedTelemetry() {
  const telemetry = [];
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  // Seed 24 hours of data, one reading every 30 minutes (48 points per device)
  const devices = ['WQM-001', 'WQM-002', 'WQM-003'];
  
  devices.forEach((devId, devIndex) => {
    for (let i = 48; i >= 0; i--) {
      const timestamp = new Date(now - i * 30 * 60000).toISOString();
      const hourOfDay = new Date(timestamp).getHours();
      
      // Diurnal temp cycle (warmer at 14:00, cooler at 04:00)
      const baseTemp = 24 + devIndex * 1.2;
      const tempDiff = Math.sin((hourOfDay - 8) / 24 * 2 * Math.PI) * 2;
      const temperature = parseFloat((baseTemp + tempDiff + (Math.random() - 0.5) * 0.4).toFixed(1));
      
      // pH: slow fluctuations
      const basePh = 7.2 + devIndex * 0.15;
      const phDiff = Math.sin((hourOfDay - 12) / 24 * 2 * Math.PI) * 0.15;
      const ph = parseFloat((basePh + phDiff + (Math.random() - 0.5) * 0.08).toFixed(2));
      
      // Turbidity: clean base with tiny variations
      const baseTurb = 1.2 + devIndex * 0.4;
      const turbidity = parseFloat((baseTurb + Math.random() * 0.4).toFixed(2));
      
      // TDS: very stable
      const tds = Math.floor(310 + devIndex * 45 + (Math.random() - 0.5) * 10);
      
      // DO: inverse to temperature (cold water holds more oxygen)
      const doBase = 8.5 - (temperature - 20) * 0.15;
      const dissolvedOxygen = parseFloat((doBase + (Math.random() - 0.5) * 0.3).toFixed(1));
      
      telemetry.push({
        id: `${devId}-${Date.parse(timestamp)}`,
        deviceId: devId,
        timestamp,
        ph,
        temperature,
        turbidity,
        tds,
        dissolvedOxygen,
        source: 'simulation',
        status: 'normal'
      });
    }
  });
  
  return telemetry;
}

// Low-level read/write
function getDefaultData() {
  return {
    devices: DEFAULT_DEVICES,
    thresholds: DEFAULT_THRESHOLDS,
    telemetry: generateSeedTelemetry(),
    alerts: [],
    systemStatus: {
      backend: 'ONLINE',
      database: 'CONNECTED',
      telemetry: 'RECEIVING',
      simulator: 'RUNNING',
      alerts: 'ACTIVE',
      lastSync: new Date().toISOString()
    }
  };
}

function readDB() {
  ensureDirExists();
  if (!fs.existsSync(DB_FILE)) {
    const defaultData = getDefaultData();
    writeDB(defaultData);
    return defaultData;
  }
  
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    if (!raw.trim()) {
      throw new SyntaxError('Empty DB file');
    }
    const data = JSON.parse(raw);
    if (!data || !data.devices || data.devices.length === 0 || !data.thresholds || Object.keys(data.thresholds).length === 0) {
      throw new Error('Database is empty or missing key collections');
    }
    return data;
  } catch (err) {
    console.error('Error reading JSON DB, fallback to default data', err);
    const defaultData = getDefaultData();
    try {
      writeDB(defaultData);
    } catch (writeErr) {
      console.error('Failed to restore default DB file:', writeErr);
    }
    return defaultData;
  }
}

function writeDB(data) {
  ensureDirExists();
  const tempFile = `${DB_FILE}.tmp`;
  try {
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    
    // Atomic rename with retry to handle Windows file locking EPERM/EBUSY
    let attempts = 0;
    const maxAttempts = 5;
    while (attempts < maxAttempts) {
      try {
        fs.renameSync(tempFile, DB_FILE);
        break;
      } catch (renameErr) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw renameErr;
        }
        // Small synchronous wait
        const start = Date.now();
        while (Date.now() - start < 10) {}
      }
    }
  } catch (err) {
    console.error('Error writing JSON DB, trying direct fallback', err);
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (fallbackErr) {
      console.error('Critical fallback direct write failed:', fallbackErr);
    }
    if (fs.existsSync(tempFile)) {
      try {
        fs.unlinkSync(tempFile);
      } catch (unlinkErr) {}
    }
  }
}

// API Abstractions
const DB = {
  getDevices: () => {
    const db = readDB();
    return db.devices;
  },
  
  getDevice: (id) => {
    const db = readDB();
    return db.devices.find(d => d.deviceId === id);
  },
  
  updateDeviceStatus: (id, status) => {
    const db = readDB();
    const dev = db.devices.find(d => d.deviceId === id);
    if (dev) {
      dev.status = status;
      dev.lastSeen = new Date().toISOString();
      writeDB(db);
    }
    return dev;
  },

  updateDeviceSensors: (id, sensors) => {
    const db = readDB();
    const dev = db.devices.find(d => d.deviceId === id);
    if (dev) {
      dev.sensors = sensors;
      writeDB(db);
    }
    return dev;
  },

  updateDeviceDetails: (id, fields) => {
    const db = readDB();
    const idx = db.devices.findIndex(d => d.deviceId === id);
    if (idx !== -1) {
      db.devices[idx] = { ...db.devices[idx], ...fields, lastSeen: new Date().toISOString() };
      writeDB(db);
      return db.devices[idx];
    }
    return null;
  },
  
  getThresholds: () => {
    const db = readDB();
    return db.thresholds;
  },
  
  updateThreshold: (param, data) => {
    const db = readDB();
    if (db.thresholds[param]) {
      db.thresholds[param] = {
        ...db.thresholds[param],
        ...data,
        updatedAt: new Date().toISOString()
      };
      writeDB(db);
    }
    return db.thresholds[param];
  },
  
  getTelemetry: (deviceId, limit = 100) => {
    const db = readDB();
    let filtered = db.telemetry;
    if (deviceId && deviceId !== 'ALL') {
      filtered = filtered.filter(t => t.deviceId === deviceId);
    }
    // Sort descending by timestamp
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return filtered.slice(0, limit);
  },

  getLatestTelemetry: (deviceId) => {
    const db = readDB();
    const filtered = db.telemetry.filter(t => t.deviceId === deviceId);
    if (filtered.length === 0) return null;
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return filtered[0];
  },
  
  addTelemetry: (reading) => {
    const db = readDB();
    const telemetryObj = {
      id: `${reading.deviceId}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...reading
    };
    db.telemetry.push(telemetryObj);
    
    // Cap telemetry size to prevent file bloat (keep last 1000 readings per device)
    const MAX_READINGS_PER_DEVICE = 1000;
    const devicesList = ['WQM-001', 'WQM-002', 'WQM-003'];
    let pruned = [];
    devicesList.forEach(devId => {
      let devTelem = db.telemetry.filter(t => t.deviceId === devId);
      devTelem.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      pruned = pruned.concat(devTelem.slice(0, MAX_READINGS_PER_DEVICE));
    });
    db.telemetry = pruned;

    // Update last seen for device
    const device = db.devices.find(d => d.deviceId === reading.deviceId);
    if (device) {
      device.lastSeen = new Date().toISOString();
      if (device.status !== 'ONLINE') {
        device.status = 'ONLINE';
      }
    }
    
    writeDB(db);
    return telemetryObj;
  },
  
  getAlerts: () => {
    const db = readDB();
    // Sort descending by timestamp
    return db.alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },
  
  getActiveAlerts: () => {
    const db = readDB();
    return db.alerts.filter(a => a.status === 'active');
  },
  
  addAlert: (alert) => {
    const db = readDB();
    const alertObj = {
      id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      status: 'active',
      acknowledgedAt: null,
      resolvedAt: null,
      ...alert
    };
    db.alerts.push(alertObj);
    writeDB(db);
    return alertObj;
  },
  
  acknowledgeAlert: (id, user = 'Operator') => {
    const db = readDB();
    const alert = db.alerts.find(a => a.id === id);
    if (alert) {
      alert.status = 'acknowledged';
      alert.acknowledgedAt = new Date().toISOString();
      alert.acknowledgedBy = user;
      writeDB(db);
    }
    return alert;
  },

  resolveAlert: (id) => {
    const db = readDB();
    const alert = db.alerts.find(a => a.id === id);
    if (alert && alert.status !== 'resolved') {
      alert.status = 'resolved';
      alert.resolvedAt = new Date().toISOString();
      writeDB(db);
    }
    return alert;
  },

  resolveActiveAlertsForParameter: (deviceId, parameter) => {
    const db = readDB();
    let updated = false;
    db.alerts.forEach(alert => {
      if (alert.deviceId === deviceId && alert.parameter === parameter && alert.status !== 'resolved') {
        alert.status = 'resolved';
        alert.resolvedAt = new Date().toISOString();
        updated = true;
      }
    });
    if (updated) {
      writeDB(db);
    }
  },
  
  getSystemStatus: () => {
    const db = readDB();
    db.systemStatus.lastSync = new Date().toISOString();
    return db.systemStatus;
  },

  updateSystemStatus: (field, value) => {
    const db = readDB();
    db.systemStatus[field] = value;
    writeDB(db);
    return db.systemStatus;
  },

  clearData: () => {
    const db = readDB();
    db.telemetry = generateSeedTelemetry();
    db.alerts = [];
    db.devices = DEFAULT_DEVICES.map(d => ({
      ...d,
      status: 'ONLINE',
      lastSeen: new Date().toISOString()
    }));
    db.thresholds = DEFAULT_THRESHOLDS;
    writeDB(db);
    return db;
  }
};

module.exports = DB;
