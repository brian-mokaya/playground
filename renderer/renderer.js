/* global Blockly */

import BlocklyEngine from '../logic/blocklyEngine.js';
import PythonGenerator from '../logic/pythonGenerator.js';
import Earcons from '../audio/earcons.js';

class RendererApp {
  constructor() {
    this.blocklyEngine = new BlocklyEngine();
    this.pythonGenerator = new PythonGenerator();
    this.earcons = new Earcons();
    this.voiceActive = false;
    this.workspace = null;
  }

  async initialize() {
    this.setupBlockly();
    this.setupEventListeners();
    this.setupIPCListeners();
    await this.earcons.initialize();
  }

  setupBlockly() {
    const toolbox = {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category',
          name: 'Motor',
          colour: 230,
          contents: [
            { kind: 'block', type: 'motor_move_forward' },
            { kind: 'block', type: 'motor_move_backward' },
            { kind: 'block', type: 'motor_spin_left' },
            { kind: 'block', type: 'motor_spin_right' },
          ],
        },
        {
          kind: 'category',
          name: 'Control',
          colour: 260,
          contents: [
            { kind: 'block', type: 'controls_repeat' },
            { kind: 'block', type: 'controls_if' },
          ],
        },
        {
          kind: 'category',
          name: 'Variables',
          custom: 'VARIABLE',
        },
      ],
    };

    this.workspace = Blockly.inject('blockly-workspace', {
      toolbox,
      grid: {
        spacing: 20,
        length: 3,
        colour: '#ccc',
        snap: true,
      },
    });

    this.workspace.addChangeListener(this.onBlocklyChange.bind(this));
  }

  setupEventListeners() {
    document.getElementById('voice-toggle').addEventListener('click', () => {
      this.toggleVoice();
    });

    document.getElementById('theme-toggle').addEventListener('click', () => {
      document.body.classList.toggle('high-contrast');
    });

    document.getElementById('run-code').addEventListener('click', () => {
      this.runCode();
    });
  }

  setupIPCListeners() {
    if (window.voiceAPI) {
      window.voiceAPI.onTranscript(async (data) => {
        const { action, value, transcript } = data;
        console.log(`Parsed intent: ${action} = ${value}`);
        await this.handleIntent(action, value);
        this.updateLog(`Voice: ${transcript}`);
      });
    }

    if (window.mqttAPI) {
      window.mqttAPI.onMessage((topic, message) => {
        this.handleMQTTMessage(topic, message);
      });
    }
  }

  async toggleVoice() {
    const button = document.getElementById('voice-toggle');
    try {
      if (this.voiceActive) {
        await window.voiceAPI.stop();
        this.voiceActive = false;
        button.textContent = '🎤 Voice Off';
        document.getElementById('voice-status').textContent = 'Disconnected';
        await this.earcons.play('voice_off');
      } else {
        await window.voiceAPI.start('en-US');
        this.voiceActive = true;
        button.textContent = '🎤 Voice On';
        document.getElementById('voice-status').textContent = 'Listening';
        await this.earcons.play('voice_on');
      }
    } catch (error) {
      console.error('Voice toggle error:', error);
      this.updateLog(`Error: ${error.message}`);
    }
  }

  async handleIntent(action, value) {
    try {
      switch (action) {
      case 'add_block':
        this.addBlockFromIntent(value);
        await this.earcons.play('block_added');
        break;
      case 'delete_block':
        this.deleteSelectedBlock();
        await this.earcons.play('block_deleted');
        break;
      case 'run_code':
        await this.runCode();
        break;
      default:
        console.warn(`Unknown intent: ${action}`);
      }
    } catch (error) {
      console.error('Intent handler error:', error);
      this.updateLog(`Error processing intent: ${error.message}`);
    }
  }

  async runCode() {
    try {
      const xml = Blockly.Xml.workspaceToDom(this.workspace);
      const python = this.pythonGenerator.generate(xml);

      document.getElementById('code-output').textContent = python;
      this.updateLog('Code generated. Publishing to device...');

      // Publish to MQTT
      await window.mqttAPI.publish('commands/python', python);
      document.getElementById('device-status').textContent = 'Running';
      await this.earcons.play('run_started');
    } catch (error) {
      console.error('Code run error:', error);
      this.updateLog(`Error: ${error.message}`);
    }
  }

  addBlockFromIntent(blockType) {
    const newBlock = this.workspace.newBlock(blockType);
    newBlock.initSvg();
    newBlock.render();
    this.updateLog(`Block added: ${blockType}`);
  }

  deleteSelectedBlock() {
    const selected = Blockly.selected;
    if (selected) {
      selected.dispose(true);
      this.updateLog('Block deleted');
    } else {
      this.updateLog('No block selected');
    }
  }

  onBlocklyChange(_event) {
    try {
      const xml = Blockly.Xml.workspaceToDom(this.workspace);
      const python = this.pythonGenerator.generate(xml);
      document.getElementById('code-output').textContent = python;
    } catch (error) {
      console.error('Blockly change error:', error);
    }
  }

  handleMQTTMessage(topic, message) {
    if (topic === 'telemetry/device') {
      try {
        const data = JSON.parse(message);
        this.updateDeviceStatus(data);
      } catch (error) {
        console.error('Telemetry parse error:', error);
      }
    }
  }

  updateDeviceStatus(data) {
    const status = data.status || 'Unknown';
    document.getElementById('device-status').textContent = status;
    this.updateLog(`Device: ${status}`);
  }

  updateLog(message) {
    const logElement = document.getElementById('console-log');
    const entry = document.createElement('div');
    entry.classList.add('log-entry');
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logElement.appendChild(entry);
    logElement.scrollTop = logElement.scrollHeight;
  }
}

// Initialize on DOMContentLoaded
window.addEventListener('DOMContentLoaded', async () => {
  const app = new RendererApp();
  await app.initialize();
});
