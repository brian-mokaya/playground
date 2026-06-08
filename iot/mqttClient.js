import mqtt from 'mqtt';
import { EventEmitter } from 'events';

/**
 * MQTT Client for IoT communication.
 * Connects to local MQTT broker and provides pub/sub helpers.
 */
class MQTTClient extends EventEmitter {
  constructor(options = {}) {
    super();
    this.brokerURL = options.brokerUrl || 'mqtt://localhost:1883';
    this.client = null;
    this.subscriptions = new Map();
    this.isConnected = false;
  }

  /**
   * Connect to MQTT broker (graceful - doesn't crash app if unavailable).
   */
  async connect(options = {}) {
    return new Promise((resolve) => {
      try {
        const clientOptions = {
          clientId: `esp32-ide-${Date.now()}`,
          reconnectPeriod: 5000, // Retry every 5 seconds
          ...options,
        };

        this.client = mqtt.connect(this.brokerURL, clientOptions);

        this.client.on('connect', () => {
          console.log('Connected to MQTT broker');
          this.isConnected = true;
          this.emit('connected');
          resolve({ success: true });
        });

        this.client.on('error', (error) => {
          if (!this.isConnected) {
            // First connection attempt failed - log warning but don't crash
            console.warn('MQTT broker unavailable (optional). Device communication will be limited.');
            console.debug('MQTT error details:', error.message);
            // Still resolve to allow app to start
            resolve({ success: false, message: 'MQTT broker unavailable' });
          } else {
            // Already connected once, now disconnected - emit error event
            this.emit('error', error);
          }
        });

        this.client.on('close', () => {
          console.warn('MQTT connection closed');
          this.isConnected = false;
          this.emit('disconnected');
        });

        this.client.on('message', (topic, message) => {
          this.handleMessage(topic, message);
        });

        // Set a timeout for initial connection attempt
        setTimeout(() => {
          if (!this.isConnected && this.client && this.client.status === 'offline') {
            console.warn('MQTT connection timeout - broker may be unavailable');
            resolve({ success: false, message: 'Connection timeout' });
          }
        }, 3000);
      } catch (error) {
        console.error('MQTT initialization error:', error);
        resolve({ success: false, message: error.message });
      }
    });
  }

  /**
   * Publish a message to a topic.
   */
  async publish(topic, message) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to MQTT broker'));
        return;
      }

      try {
        const payload = typeof message === 'string' ? message : JSON.stringify(message);
        this.client.publish(topic, payload, { qos: 1 }, (error) => {
          if (error) {
            reject(error);
          } else {
            this.emit('message-sent', { topic, message });
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Subscribe to a topic.
   */
  subscribe(topic, callback) {
    if (!this.isConnected) {
      console.error('Not connected to MQTT broker');
      return;
    }

    this.client.subscribe(topic, (error) => {
      if (error) {
        console.error(`Subscription error for ${topic}:`, error);
      } else {
        console.log(`Subscribed to ${topic}`);
        this.subscriptions.set(topic, callback);
      }
    });
  }

  /**
   * Unsubscribe from a topic.
   */
  unsubscribe(topic) {
    if (this.subscriptions.has(topic)) {
      this.client.unsubscribe(topic);
      this.subscriptions.delete(topic);
    }
  }

  /**
   * Handle incoming MQTT message.
   */
  handleMessage(topic, buffer) {
    const message = buffer.toString('utf-8');

    // Call topic-specific callbacks
    const callback = this.subscriptions.get(topic);
    if (callback) {
      try {
        callback(message);
      } catch (error) {
        console.error(`Callback error for ${topic}:`, error);
      }
    }

    // Emit global message event
    this.emit('message', { topic, message });
  }

  /**
   * Disconnect from broker.
   */
  async disconnect() {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        resolve();
        return;
      }

      this.client.end(false, {}, (error) => {
        if (error) {
          reject(error);
        } else {
          this.isConnected = false;
          this.emit('disconnected');
          resolve();
        }
      });
    });
  }

  /**
   * Check connection status.
   */
  getStatus() {
    return {
      connected: this.isConnected,
      broker: this.brokerURL,
      subscriptions: Array.from(this.subscriptions.keys()),
    };
  }
}

export default MQTTClient;
