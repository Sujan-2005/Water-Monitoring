const DB = require('./db');

/**
 * Evaluates a single sensor value against thresholds
 */
function evaluateParameter(paramName, value, thresholds) {
  const thresh = thresholds[paramName];
  
  // If the value is null, undefined, NaN, or explicitly flagged as error
  if (value === null || value === undefined || isNaN(value)) {
    return {
      status: 'sensor_error',
      value: null,
      message: `${paramName} sensor returned invalid data (Sensor Error)`
    };
  }

  if (!thresh) {
    return { status: 'normal', value, message: 'No thresholds defined' };
  }

  // Check critical limits
  if (value <= thresh.criticalLow) {
    return {
      status: 'critical',
      boundary: 'low',
      thresholdValue: thresh.criticalLow,
      message: `${paramName} (${value} ${thresh.unit}) fell below critical limit (${thresh.criticalLow} ${thresh.unit})`
    };
  }
  if (value >= thresh.criticalHigh) {
    return {
      status: 'critical',
      boundary: 'high',
      thresholdValue: thresh.criticalHigh,
      message: `${paramName} (${value} ${thresh.unit}) exceeded critical limit (${thresh.criticalHigh} ${thresh.unit})`
    };
  }

  // Check warning limits
  if (value <= thresh.warningLow) {
    return {
      status: 'warning',
      boundary: 'low',
      thresholdValue: thresh.warningLow,
      message: `${paramName} (${value} ${thresh.unit}) fell below warning limit (${thresh.warningLow} ${thresh.unit})`
    };
  }
  if (value >= thresh.warningHigh) {
    return {
      status: 'warning',
      boundary: 'high',
      thresholdValue: thresh.warningHigh,
      message: `${paramName} (${value} ${thresh.unit}) exceeded warning limit (${thresh.warningHigh} ${thresh.unit})`
    };
  }

  return {
    status: 'normal',
    message: `${paramName} within normal range`
  };
}

/**
 * Evaluates all parameters in a telemetry packet
 */
function evaluateTelemetry(reading) {
  const thresholds = DB.getThresholds();
  
  const parameters = {
    ph: reading.ph,
    temperature: reading.temperature,
    turbidity: reading.turbidity,
    tds: reading.tds,
    dissolvedOxygen: reading.dissolvedOxygen
  };

  const results = {};
  let overallStatus = 'normal';
  let hasSensorError = false;
  let hasCritical = false;
  let hasWarning = false;

  for (const [param, val] of Object.entries(parameters)) {
    const evaluation = evaluateParameter(param, val, thresholds);
    results[param] = evaluation;

    if (evaluation.status === 'sensor_error') {
      hasSensorError = true;
    } else if (evaluation.status === 'critical') {
      hasCritical = true;
    } else if (evaluation.status === 'warning') {
      hasWarning = true;
    }
  }

  // Priority order for overall state: sensor_error > critical > warning > normal
  if (hasSensorError) {
    overallStatus = 'sensor_error';
  } else if (hasCritical) {
    overallStatus = 'critical';
  } else if (hasWarning) {
    overallStatus = 'warning';
  }

  return {
    deviceId: reading.deviceId,
    timestamp: reading.timestamp || new Date().toISOString(),
    overallStatus,
    results
  };
}

module.exports = {
  evaluateParameter,
  evaluateTelemetry
};
