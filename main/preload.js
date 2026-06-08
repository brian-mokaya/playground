import { contextBridge, ipcRenderer } from 'electron';

// Expose IPC channels to renderer through a safe context bridge
contextBridge.exposeInMainWorld('voiceAPI', {
  start: (language) => ipcRenderer.invoke('voice:start', { language }),
  stop: () => ipcRenderer.invoke('voice:stop'),
  onTranscript: (callback) => {
    ipcRenderer.on('intent:parsed', (_event, data) => {
      callback(data);
    });
  },
});

contextBridge.exposeInMainWorld('mqttAPI', {
  publish: (topic, message) => ipcRenderer.invoke('mqtt:publish', { topic, message }),
  subscribe: (topic) => ipcRenderer.invoke('mqtt:subscribe', { topic }),
  onMessage: (callback) => {
    ipcRenderer.on('mqtt:message', (_event, { topic, message }) => {
      callback(topic, message);
    });
  },
});

contextBridge.exposeInMainWorld('ttsAPI', {
  speak: (text, priority = 'normal') =>
    ipcRenderer.invoke('tts:speak', { text, priority }),
});

contextBridge.exposeInMainWorld('logicAPI', {
  generatePython: (blocks) => ipcRenderer.invoke('logic:generate-python', { blocks }),
});

// Console API for debugging (removed in production)
contextBridge.exposeInMainWorld('debugAPI', {
  log: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
});
