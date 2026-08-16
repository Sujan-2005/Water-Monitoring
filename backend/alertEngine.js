const DB = require('./db');

/**
 * Evaluates telemetry changes and generates/resolves alerts
 */
function processAlerts(evaluation, reading) {
  const { deviceId, results } = evaluation;
  const activeAlerts = DB.getActiveAlerts();
  const newEvents = [];

  for (const [param, evalResult] of Object.entries(results)) {
    // Find if there is an active alert for this device + parameter
    const activeAlert = activeAlerts.find(
      a => a.deviceId === deviceId && a.parameter === param
    );

    const currentValue = reading[param];

    if (evalResult.status === 'critical' || evalResult.status === 'warning' || evalResult.status === 'sensor_error') {
      const severity = evalResult.status;
      const message = evalResult.message;
      const thresholdVal = evalResult.thresholdValue || null;

      if (activeAlert) {
        // If alert exists but severity changed (warning -> critical or vice-versa)
        if (activeAlert.severity !== severity) {
          // Resolve old alert
          DB.resolveAlert(activeAlert.id);
          
          // Create new alert with updated severity
          const updatedAlert = DB.addAlert({
            deviceId,
            parameter: param,
            value: currentValue,
            threshold: thresholdVal,
            severity,
            message,
            status: 'active'
          });
          newEvents.push(updatedAlert);
        }
        // If severity is the same, we do nothing to prevent spamming
      } else {
        // No active alert exists, create a new one
        const alert = DB.addAlert({
          deviceId,
          parameter: param,
          value: currentValue,
          threshold: thresholdVal,
          severity,
          message,
          status: 'active'
        });
        newEvents.push(alert);
      }
    } else {
      // Normal state. If there was an active alert, resolve it
      if (activeAlert) {
        DB.resolveAlert(activeAlert.id);

        // Create a recovery notification event (marked resolved immediately)
        const recoveryAlert = DB.addAlert({
          deviceId,
          parameter: param,
          value: currentValue,
          threshold: null,
          severity: 'normal',
          message: `${param} returned to normal range`,
          status: 'resolved',
          resolvedAt: new Date().toISOString()
        });
        newEvents.push(recoveryAlert);
      }
    }
  }

  return newEvents;
}

/**
 * Handle device offline alerts
 */
function handleDeviceOffline(deviceId) {
  const activeAlerts = DB.getActiveAlerts();
  const offlineAlert = activeAlerts.find(
    a => a.deviceId === deviceId && a.parameter === 'connection'
  );

  if (!offlineAlert) {
    const alert = DB.addAlert({
      deviceId,
      parameter: 'connection',
      value: null,
      threshold: null,
      severity: 'critical',
      message: `Device ${deviceId} is OFFLINE - No telemetry received for configured duration`,
      status: 'active'
    });
    return alert;
  }
  return null;
}

/**
 * Handle device online recovery
 */
function handleDeviceOnline(deviceId) {
  const activeAlerts = DB.getActiveAlerts();
  const offlineAlert = activeAlerts.find(
    a => a.deviceId === deviceId && a.parameter === 'connection'
  );

  if (offlineAlert) {
    DB.resolveAlert(offlineAlert.id);
    
    // Create recovery notification
    const recovery = DB.addAlert({
      deviceId,
      parameter: 'connection',
      value: null,
      threshold: null,
      severity: 'normal',
      message: `Device ${deviceId} connection restored. System ONLINE.`,
      status: 'resolved',
      resolvedAt: new Date().toISOString()
    });
    return recovery;
  }
  return null;
}

module.exports = {
  processAlerts,
  handleDeviceOffline,
  handleDeviceOnline
};
