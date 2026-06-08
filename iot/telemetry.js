import { EventEmitter } from 'events';

/**
 * Telemetry module for parsing and handling device feedback.
 * Processes incoming MQTT telemetry from ESP32.
 */
class TelemetryProcessor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.schema = options.schema || null;
    this.telemetryBuffer = [];
    this.maxBufferSize = options.maxBufferSize || 1000;
  }

  /**
   * Process incoming telemetry JSON payload.
   */
  processMessage(jsonMessage) {
    try {
      const data = typeof jsonMessage === 'string' ? JSON.parse(jsonMessage) : jsonMessage;

      // Validate against schema if provided
      if (this.schema && !this.validateSchema(data)) {
        console.warn('Telemetry validation failed:', data);
        this.emit('validation-error', data);
        return null;
      }

      // Add timestamp if not present
      if (!data.timestamp) {
        data.timestamp = Date.now();
      }

      // Buffer telemetry
      this.addToBuffer(data);

      // Emit specific events based on data type
      if (data.type === 'status') {
        this.emit('status-update', data);
      } else if (data.type === 'sensor') {
        this.emit('sensor-data', data);
      } else if (data.type === 'error') {
        this.emit('device-error', data);
      }

      // Generic telemetry event
      this.emit('telemetry', data);

      return data;
    } catch (error) {
      console.error('Telemetry processing error:', error);
      this.emit('parse-error', { message: jsonMessage, error });
      return null;
    }
  }

  /**
   * Validate telemetry against schema.
   */
  validateSchema(data) {
    if (!this.schema) return true;

    // Simple schema validation
    for (const [key, required] of Object.entries(this.schema)) {
      if (required && !(key in data)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Add telemetry to buffer.
   */
  addToBuffer(data) {
    this.telemetryBuffer.push(data);
    if (this.telemetryBuffer.length > this.maxBufferSize) {
      this.telemetryBuffer.shift();
    }
  }

  /**
   * Get telemetry buffer.
   */
  getBuffer() {
    return [...this.telemetryBuffer];
  }

  /**
   * Clear telemetry buffer.
   */
  clearBuffer() {
    this.telemetryBuffer = [];
  }

  /**
   * Get recent telemetry.
   */
  getRecent(count = 10) {
    return this.telemetryBuffer.slice(-count);
  }

  /**
   * Parse device status from telemetry.
   */
  parseStatus(telemetry) {
    return {
      state: telemetry.state || 'unknown',
      battery: telemetry.battery || null,
      temperature: telemetry.temperature || null,
      uptime: telemetry.uptime || 0,
      lastUpdate: telemetry.timestamp || null,
    };
  }

  /**
   * Parse sensor data from telemetry.
   */
  parseSensorData(telemetry) {
    return {
      proximity: telemetry.proximity || null,
      light: telemetry.light || null,
      motion: telemetry.motion || false,
      temperature: telemetry.temperature || null,
    };
  }
}

export default TelemetryProcessor;
