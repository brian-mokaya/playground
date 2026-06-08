import { EventEmitter } from 'events';

/**
 * Earcons module for audio event feedback.
 * Maps application events to pre-recorded audio cues.
 * Earcons enhance accessibility for blind/low-vision users.
 */
class Earcons extends EventEmitter {
  constructor(options = {}) {
    super();
    this.audioPath = options.audioPath || './audio/earcons/';
    this.audioContext = null;
    this.audioCache = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize audio context and preload earcons.
   */
  async initialize() {
    try {
      // Initialize Web Audio API context
      if (typeof window !== 'undefined' && window.AudioContext) {
        this.audioContext = new window.AudioContext();
      } else {
        console.warn('Web Audio API not available');
      }

      // Map of earcon names to file paths
      this.earconMap = {
        voice_on: 'voice_start.mp3',
        voice_off: 'voice_stop.mp3',
        block_added: 'block_add.mp3',
        block_deleted: 'block_delete.mp3',
        run_started: 'run_start.mp3',
        move_complete: 'move_complete.mp3',
        error: 'error.mp3',
        success: 'success.mp3',
        warning: 'warning.mp3',
      };

      // Preload key earcons
      await this.preloadEarcons(['voice_on', 'voice_off', 'run_started', 'error']);

      this.isInitialized = true;
      console.log('Earcons initialized');
    } catch (error) {
      console.error('Earcons initialization error:', error);
    }
  }

  /**
   * Preload audio files into cache.
   */
  async preloadEarcons(earconNames) {
    for (const name of earconNames) {
      try {
        const data = await this.loadAudio(name);
        this.audioCache.set(name, data);
      } catch (error) {
        console.warn(`Failed to preload earcon ${name}:`, error);
      }
    }
  }

  /**
   * Load audio file.
   */
  async loadAudio(earconName) {
    if (this.audioCache.has(earconName)) {
      return this.audioCache.get(earconName);
    }

    try {
      const filename = this.earconMap[earconName];
      if (!filename) {
        throw new Error(`Unknown earcon: ${earconName}`);
      }

      // In Electron, load from file system
      if (typeof require !== 'undefined') {
        const path = require('path');
        const fs = require('fs');
        const filePath = path.join(this.audioPath, filename);
        const buffer = fs.readFileSync(filePath);
        return buffer;
      } else if (typeof fetch !== 'undefined') {
        // In browser, fetch from URL
        const response = await fetch(`${this.audioPath}${filename}`);
        return await response.arrayBuffer();
      }
    } catch (error) {
      console.error(`Error loading earcon ${earconName}:`, error);
      throw error;
    }
  }

  /**
   * Play an earcon by name.
   */
  async play(earconName) {
    if (!this.isInitialized) {
      console.warn('Earcons not initialized');
      return;
    }

    try {
      const audio = await this.loadAudio(earconName);

      if (this.audioContext) {
        // Web Audio API
        const audioBuffer = await this.audioContext.decodeAudioData(audio);
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);
        source.start(0);
      } else {
        // Fallback for Electron: use native audio
        console.log(`[Audio] Playing earcon: ${earconName}`);
      }

      this.emit('played', earconName);
    } catch (error) {
      console.error(`Error playing earcon ${earconName}:`, error);
    }
  }

  /**
   * Play multiple earcons in sequence.
   */
  async playSequence(earconNames, delayBetween = 100) {
    for (const name of earconNames) {
      await this.play(name);
      if (delayBetween > 0 && name !== earconNames[earconNames.length - 1]) {
        await new Promise((r) => setTimeout(r, delayBetween));
      }
    }
  }

  /**
   * Play earcon based on event type.
   */
  async playEvent(eventType, data = {}) {
    const earconMap = {
      block_added: 'block_added',
      block_deleted: 'block_deleted',
      run_started: 'run_started',
      run_stopped: 'voice_off',
      move_complete: 'move_complete',
      device_error: 'error',
      execution_success: 'success',
      execution_warning: 'warning',
    };

    const earconName = earconMap[eventType];
    if (earconName) {
      await this.play(earconName);
    }
  }

  /**
   * Cleanup resources.
   */
  async cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.audioCache.clear();
    this.isInitialized = false;
  }
}

export default Earcons;
