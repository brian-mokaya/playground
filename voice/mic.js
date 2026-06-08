import mic from 'node-mic';
import { EventEmitter } from 'events';

/**
 * Microphone capture module for voice input.
 * Wraps node-mic to provide push-to-talk functionality.
 */
class MicrophoneCapture extends EventEmitter {
  constructor(options = {}) {
    super();
    this.sampleRate = options.sampleRate || 16000;
    this.channels = options.channels || 1;
    this.bitDepth = options.bitDepth || 16;
    this.device = options.device || null;
    this.recordingStream = null;
    this.listening = false;
  }

  /**
   * Start listening to microphone input.
   * Emits 'audio' events with PCM buffers.
   */
  async startListening() {
    if (this.listening) {
      console.warn('Already listening');
      return;
    }

    try {
      const micInstance = mic({
        rate: this.sampleRate,
        channels: this.channels,
        bitdepth: this.bitDepth,
        device: this.device,
      });

      this.recordingStream = micInstance.getAudioStream();

      this.recordingStream.on('data', (chunk) => {
        this.emit('audio', chunk);
      });

      this.recordingStream.on('error', (error) => {
        this.emit('error', error);
      });

      micInstance.start();
      this.listening = true;
      this.emit('listening-started');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop listening to microphone input.
   */
  async stopListening() {
    if (!this.listening) {
      console.warn('Not currently listening');
      return;
    }

    try {
      if (this.recordingStream) {
        this.recordingStream.destroy();
      }
      this.listening = false;
      this.emit('listening-stopped');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Check if currently listening.
   */
  isListening() {
    return this.listening;
  }

  /**
   * Cleanup resources.
   */
  async cleanup() {
    if (this.listening) {
      await this.stopListening();
    }
  }
}

export default MicrophoneCapture;
