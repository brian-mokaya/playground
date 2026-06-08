import { EventEmitter } from 'events';

/**
 * Text-to-Speech module using local TTS engine.
 * Routes all user-facing audio feedback through this module.
 * Supports priority queue for concurrent speech.
 * Offline-first: Uses espeak for local TTS, no external cloud APIs.
 */
class TTSEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.engine = options.engine || 'espeak'; // 'espeak' or custom (offline-first)
    this.language = options.language || 'en';
    this.isInitialized = false;
    this.queue = [];
    this.isSpeaking = false;
  }

  /**
   * Initialize TTS engine.
   */
  async initialize() {
    try {
      if (this.engine === 'espeak') {
        // Use espeak command-line tool (offline-first)
        this.tts = null; // Handled via child_process in speak()
      }

      this.isInitialized = true;
      console.log(`TTS engine (${this.engine}) initialized`);
      this.emit('ready');
    } catch (error) {
      console.error('TTS initialization error:', error);
      throw error;
    }
  }

  /**
   * Speak text with priority queue support.
   * @param {string} text - Text to speak
   * @param {string} priority - 'high', 'normal', 'low'
   */
  async speak(text, priority = 'normal') {
    if (!this.isInitialized) {
      console.warn('TTS not initialized');
      return;
    }

    if (!text || typeof text !== 'string') {
      console.warn('Invalid text for TTS');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.queue.push({ text, priority, resolve, reject });
        this.processQueue();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Process speech queue.
   */
  async processQueue() {
    if (this.isSpeaking || this.queue.length === 0) {
      return;
    }

    // Sort by priority (high first)
    this.queue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const item = this.queue.shift();
    this.isSpeaking = true;

    try {
      await this.speakInternal(item.text);
      item.resolve();
      this.emit('spoke', item.text);
    } catch (error) {
      console.error('TTS speak error:', error);
      item.reject(error);
    }

    this.isSpeaking = false;
    if (this.queue.length > 0) {
      setImmediate(() => this.processQueue());
    }
  }

  /**
   * Internal speak implementation.
   */
  async speakInternal(text) {
    return new Promise((resolve, reject) => {
      try {
        if (this.engine === 'espeak') {
          this.espeakSpeak(text, resolve, reject);
        } else {
          reject(new Error(`Unknown TTS engine: ${this.engine}`));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Espeak implementation (offline-first).
   */
  async espeakSpeak(text, resolve, reject) {
    try {
      const { spawn } = await import('child_process');
      const espeak = spawn('espeak', ['-v', this.language, text]);

      espeak.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Espeak exited with code ${code}`));
        }
      });

      espeak.on('error', reject);
    } catch (error) {
      reject(error);
    }
  }

  /**
   * Stop all speech immediately.
   */
  async stop() {
    this.queue = [];
    this.isSpeaking = false;
    this.emit('stopped');
  }

  /**
   * Check if currently speaking.
   */
  isSpeakingNow() {
    return this.isSpeaking;
  }

  /**
   * Cleanup resources.
   */
  async cleanup() {
    await this.stop();
    this.isInitialized = false;
  }
}

export default TTSEngine;
