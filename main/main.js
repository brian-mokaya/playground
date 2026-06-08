import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import MicroVoiceEngine from '../voice/stt.js';
import IntentParser from '../voice/nlp.js';
import MQTTClient from '../iot/mqttClient.js';
import TTSEngine from '../audio/tts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;
let voiceEngine;
let intentParser;
let mqttClient;
let ttsEngine;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

const initializeModules = async () => {
  try {
    // Initialize TTS first (needed for feedback)
    ttsEngine = new TTSEngine();
    await ttsEngine.initialize();

    // Initialize Voice Engine
    voiceEngine = new MicroVoiceEngine();
    await voiceEngine.initialize();

    // Initialize Intent Parser
    intentParser = new IntentParser();

    // Initialize MQTT Client
    mqttClient = new MQTTClient();
    await mqttClient.connect({
      protocol: 'mqtt',
      host: 'localhost',
      port: 1883,
    });

    // Set up voice engine event listener AFTER initialization
    voiceEngine.on('transcript', (transcript) => {
      const { action, value } = intentParser.parse(transcript);
      mainWindow.webContents.send('intent:parsed', { action, value, transcript });
    });

    console.log('All modules initialized successfully');
  } catch (error) {
    console.error('Module initialization error:', error);
    process.exit(1);
  }
};

// IPC: Voice Control
ipcMain.handle('voice:start', async (_event, { language }) => {
  try {
    await voiceEngine.startListening(language || 'en-US');
    return { success: true };
  } catch (error) {
    console.error('Voice start error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('voice:stop', async () => {
  try {
    await voiceEngine.stopListening();
    return { success: true };
  } catch (error) {
    console.error('Voice stop error:', error);
    return { success: false, error: error.message };
  }
});

// IPC: MQTT Operations
ipcMain.handle('mqtt:publish', async (_event, { topic, message }) => {
  try {
    await mqttClient.publish(topic, message);
    return { success: true };
  } catch (error) {
    console.error('MQTT publish error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('mqtt:subscribe', async (_event, { topic }) => {
  try {
    mqttClient.subscribe(topic, (message) => {
      mainWindow.webContents.send('mqtt:message', { topic, message });
    });
    return { success: true };
  } catch (error) {
    console.error('MQTT subscribe error:', error);
    return { success: false, error: error.message };
  }
});

// IPC: TTS
ipcMain.handle('tts:speak', async (_event, { text, priority = 'normal' }) => {
  try {
    await ttsEngine.speak(text, priority);
    return { success: true };
  } catch (error) {
    console.error('TTS error:', error);
    return { success: false, error: error.message };
  }
});

// Electron App Lifecycle
app.on('ready', async () => {
  await initializeModules();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Cleanup on exit
app.on('quit', async () => {
  try {
    if (voiceEngine) await voiceEngine.cleanup();
    if (mqttClient) await mqttClient.disconnect();
    if (ttsEngine) await ttsEngine.cleanup();
  } catch (error) {
    console.error('Cleanup error:', error);
  }
});

export { mainWindow };
