import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark'); // dark mode default for control room vibe
  const [colorTheme, setColorThemeState] = useState(() => {
    // Restore persisted color theme on load
    return localStorage.getItem('colorTheme') || 'default';
  });
  const [selectedDevice, setSelectedDevice] = useState('WQM-001');
  const [devices, setDevices] = useState([]);
  const [thresholds, setThresholds] = useState({});
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [systemStatus, setSystemStatus] = useState({
    backend: 'OFFLINE',
    database: 'DISCONNECTED',
    telemetry: 'STANDBY',
    simulator: 'STOPPED',
    alerts: 'INACTIVE',
    lastSync: ''
  });
  const [simulatorStatus, setSimulatorStatus] = useState({
    status: 'stopped',
    currentScenario: 'random',
    updateInterval: 3,
    tickCount: 0
  });

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(next);
      document.body.classList.remove('dark', 'light');
      document.body.classList.add(next);
      return next;
    });
  };

  // Set initial class list theme
  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(theme);
  }, []);

  // Apply persisted color theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('colorTheme') || 'default';
    if (saved === 'emerald') {
      document.documentElement.setAttribute('data-color-theme', 'emerald');
    } else {
      document.documentElement.removeAttribute('data-color-theme');
    }
  }, []);

  // Action: change the color theme independently from light/dark
  const setColorTheme = (theme) => {
    setColorThemeState(theme);
    localStorage.setItem('colorTheme', theme);
    if (theme === 'emerald') {
      document.documentElement.setAttribute('data-color-theme', 'emerald');
    } else {
      document.documentElement.removeAttribute('data-color-theme');
    }
  };

  // Fetch initial configuration
  const fetchInitialData = async () => {
    try {
      const [devicesRes, thresholdsRes, telemetryRes, alertsRes, activeAlertsRes] = await Promise.all([
        axios.get('/api/devices'),
        axios.get('/api/thresholds'),
        axios.get('/api/telemetry/history/ALL?limit=200'),
        axios.get('/api/alerts'),
        axios.get('/api/alerts/active')
      ]);

      setDevices(devicesRes.data);
      setThresholds(thresholdsRes.data);
      setTelemetryLogs(telemetryRes.data);
      setNotifications(alertsRes.data.slice(0, 50));
      setActiveAlerts(activeAlertsRes.data);
      setSystemStatus(prev => ({ ...prev, backend: 'ONLINE', database: 'CONNECTED', telemetry: 'RECEIVING' }));
    } catch (err) {
      console.error('Error fetching initial IoT data:', err);
      setSystemStatus(prev => ({ ...prev, backend: 'OFFLINE', database: 'DISCONNECTED' }));
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Establish Server-Sent Events (SSE) Live Stream
  useEffect(() => {
    let eventSource;

    const connectStream = () => {
      console.log('Connecting to IoT live SSE stream...');
      eventSource = new EventSource('/api/telemetry/stream');

      eventSource.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        const { type, data } = msg;

        switch (type) {
          case 'init':
            setSimulatorStatus(data.simulator);
            setSystemStatus(data.system);
            setActiveAlerts(data.activeAlerts);
            break;
          
          case 'telemetry':
            setTelemetryLogs(prev => {
              // Add to top of array, prune if larger than 500
              const updated = [data, ...prev];
              return updated.slice(0, 500);
            });
            break;

          case 'alert':
            // Add new alert to notifications feed and update active list
            setNotifications(prev => [data, ...prev].slice(0, 100));
            if (data.status === 'active') {
              setActiveAlerts(prev => {
                // Remove duplicates if any
                const filtered = prev.filter(a => a.id !== data.id);
                return [data, ...filtered];
              });
            } else if (data.status === 'resolved') {
              // Remove parameter level active alert
              setActiveAlerts(prev => prev.filter(a => !(a.deviceId === data.deviceId && a.parameter === data.parameter)));
            }
            break;

          case 'alert_updated':
            // An alert has been acknowledged or resolved
            setNotifications(prev => prev.map(a => a.id === data.id ? data : a));
            if (data.status === 'resolved') {
              setActiveAlerts(prev => prev.filter(a => a.id !== data.id));
            } else {
              setActiveAlerts(prev => prev.map(a => a.id === data.id ? data : a));
            }
            break;

          case 'device_update':
            setDevices(prev => prev.map(d => d.deviceId === data.deviceId ? data : d));
            break;

          case 'system_status':
            setSystemStatus(data);
            break;

          case 'simulator_status':
            setSimulatorStatus(data);
            break;

          case 'thresholds_updated':
            setThresholds(data);
            break;

          case 'reset':
            fetchInitialData();
            break;

          default:
            break;
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE Live Stream connection lost, retrying in 5s...', err);
        setSystemStatus(prev => ({ ...prev, backend: 'OFFLINE' }));
        eventSource.close();
        setTimeout(connectStream, 5000);
      };
    };

    connectStream();

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  // Control APIs
  const startSimulation = async () => {
    try {
      const res = await axios.post('/api/simulation/start');
      setSimulatorStatus(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const pauseSimulation = async () => {
    try {
      const res = await axios.post('/api/simulation/pause');
      setSimulatorStatus(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const stopSimulation = async () => {
    try {
      const res = await axios.post('/api/simulation/stop');
      setSimulatorStatus(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const resetSimulation = async () => {
    try {
      const res = await axios.post('/api/simulation/reset');
      setSimulatorStatus(res.data);
      await fetchInitialData();
    } catch (e) {
      console.error(e);
    }
  };

  const setScenario = async (scenario) => {
    try {
      const res = await axios.post('/api/simulation/scenario', { scenario });
      setSimulatorStatus(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const setUpdateInterval = async (interval) => {
    try {
      const res = await axios.post('/api/simulation/interval', { interval });
      setSimulatorStatus(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const injectValue = async (deviceId, parameter, value) => {
    try {
      await axios.post('/api/simulation/inject', { deviceId, parameter, value });
    } catch (e) {
      console.error(e);
    }
  };

  const acknowledgeAlert = async (id, user = 'Operator') => {
    try {
      const res = await axios.post(`/api/alerts/acknowledge/${id}`, { user });
      // EventSource will trigger status update, but update immediately locally to avoid lag
      setActiveAlerts(prev => prev.map(a => a.id === id ? res.data : a));
    } catch (e) {
      console.error(e);
    }
  };

  const updateThreshold = async (parameter, limits) => {
    try {
      const res = await axios.put(`/api/thresholds/${parameter}`, limits);
      setThresholds(prev => ({ ...prev, [parameter]: res.data }));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        colorTheme,
        setColorTheme,
        selectedDevice,
        setSelectedDevice,
        devices,
        thresholds,
        telemetryLogs,
        activeAlerts,
        notifications,
        systemStatus,
        simulatorStatus,
        startSimulation,
        pauseSimulation,
        stopSimulation,
        resetSimulation,
        setScenario,
        setUpdateInterval,
        injectValue,
        acknowledgeAlert,
        updateThreshold,
        fetchInitialData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
