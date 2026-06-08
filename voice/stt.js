import { EventEmitter } from 'events';

/**
 * Speech-to-Text module using Vosk (optional/offline-first).
 * Converts audio stream to text transcripts.
 * Falls back gracefully if vosk is not available.
 */
class MicroVoiceEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.modelPath = options.modelPath || null;
    this.vosk = null;
    this.recognizer = null;
    this.isInitialized = false;
    this.voskAvailable = false;
  }

  /**
   * Initialize Vosk STT engine (optional).
   * Model path should point to a Vosk model directory.
   */
  async initialize() {
    try {
      // Try to dynamically import vosk module
      try {
        const VoskModule = await import('vosk');
        this.vosk = VoskModule;
        this.voskAvailable = true;

        // Set silence timeout and other parameters
        this.vosk.setLogLevel(-1); // Suppress Vosk verbose logging

        // Create recognizer (model loading done on first audio chunk)
        this.recognizer = null;
        this.isInitialized = true;
        console.log('Vosk STT initialized');
      } catch (voskError) {
        // Vosk not available - app can still run without speech-to-text
        console.warn('Vosk not available (optional dependency). Speech-to-text will be unavailable.');
        console.debug('Vosk error details:', voskError.message);
        this.voskAvailable = false;
        this.isInitialized = true; // Still mark as initialized to allow app to continue
      }
    } catch (error) {
      console.error('STT initialization error:', error);
      throw error;
    }
  }

  /**
   * Start listening to microphone and convert audio to text.
   * Emits 'transcript' events as text is recognized.
   */
  async startListening(language = 'en-US') {
    if (!this.isInitialized) {
      throw new Error('STT engine not initialized');
    }

    if (!this.voskAvailable) {
      throw new Error('Vosk not available - speech-to-text not supported');
    }

    try {
      // Lazy-load model on first use
      if (!this.recognizer) {
        const model = new this.vosk.Model(this.modelPath || './models/vosk-model-small-en-us-0.15');
        this.recognizer = new this.vosk.Recognizer({ model, sampleRate: 16000 });
      }

      this.emit('listening-started');
    } catch (error) {
      console.error('STT start error:', error);
      throw error;
    }
  }

  /**
   * Process audio chunk and emit transcript if recognized.
   * Should be called with audio data from microphone.
   */
  processAudioChunk(buffer) {
    if (!this.recognizer) {
      return;
    }

    try {
      if (this.recognizer.acceptWaveform(buffer)) {
        const result = JSON.parse(this.recognizer.result());
        if (result.result && result.result.length > 0) {
          this.emit('transcript', result.result.map((r) => r.conf).join(''));
        }
      } else {
        const partial = JSON.parse(this.recognizer.getPartialResult());
        if (partial.partial) {
          this.emit('partial', partial.partial);
        }
      }
    } catch (error) {
      console.error('STT processing error:', error);
    }
  }

  /**
   * Stop listening.
   */
  async stopListening() {
    try {
      if (this.recognizer) {
        const final = JSON.parse(this.recognizer.getFinalResult());
        if (final.result && final.result.length > 0) {
          this.emit('transcript', final.result.map((r) => r.conf).join(''));
        }
      }
      this.emit('listening-stopped');
    } catch (error) {
      console.error('STT stop error:', error);
    }
  }

  /**
   * Cleanup resources.
   */
  async cleanup() {
    try {
      if (this.recognizer) {
        this.recognizer.free();
        this.recognizer = null;
      }
    } catch (error) {
      console.error('STT cleanup error:', error);
    }
  }
}

export default MicroVoiceEngine;
