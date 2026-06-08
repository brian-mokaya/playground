# CLAUDE.md — Agent Context

## Overview

This is the **Inclusive Voice-Controlled IDE** — an Electron-based, offline-first IDE for voice-controlled ESP32 programming with accessibility as a first-class concern.

## Architecture Summary

```
┌─────────────┐     ┌──────────┐      ┌────────────┐
│   Voice     │────▶│  Blockly │─────▶│ MicroPython│
│  Pipeline   │     │   AST    │      │ Generation │
└─────────────┘     └──────────┘      └────────────┘
       │                                     │
       │ (Vosk STT)                         │
       │ (NLP Parser)                       │ (MQTT Publish)
       │                                     │
       └─────────────────────────────────────┘
                      │
                      ▼
             ┌─────────────────┐
             │  ESP32 Device   │
             │  MQTT Subscriber│
             │  MicroPython RT │
             └─────────────────┘
```

## Module Map

| Module | Path | Purpose |
|--------|------|---------|
| **Voice** | `voice/` | STT (Vosk), intent parsing, NLP |
| **Logic** | `logic/` | Blockly engine, AST → Python |
| **IoT** | `iot/` | MQTT broker connection, telemetry |
| **Audio** | `audio/` | TTS, earcons, event feedback |
| **Firmware** | `firmware/` | MicroPython ESP32 code |
| **Renderer** | `renderer/` | HTML UI, IPC listeners |
| **Main** | `main/` | Electron app lifecycle, IPC bridge |

## Coding Conventions

### JavaScript
- **Module System**: ES6 `import`/`export`
- **Async Pattern**: `async`/`await` only, no callbacks
- **Single Export**: Each module exports exactly one default (object/class/function)
- **Naming**: camelCase for functions/variables, kebab-case for IPC channels
- **IPC Channels**: `module:action` format (e.g., `voice:start`, `mqtt:publish`)
- **User Feedback**: **Always** route through `audio/tts.js`, never `console.log` for user messages

### Python (ESP32)
- **Naming**: snake_case throughout
- **Async**: Use `asyncio` patterns
- **No Dependencies**: Only MicroPython stdlib + umqtt.simple

### General
- **Offline-First**: Zero external cloud APIs
- **Testing**: Jest unit tests for all logic modules
- **Linting**: ESLint with strict rules

## IPC Channels

| Channel | Direction | Payload | Handler |
|---------|-----------|---------|---------|
| `voice:start` | renderer → main | `{ language }` | Start microphone |
| `voice:stop` | renderer → main | `{}` | Stop microphone |
| `voice:transcript` | main → renderer | `{ text, confidence }` | Incoming voice |
| `mqtt:publish` | renderer → main | `{ topic, message }` | Publish to MQTT |
| `mqtt:message` | main → renderer | `{ topic, payload }` | Incoming MQTT message |
| `tts:speak` | renderer ↔ main | `{ text, priority }` | Play audio feedback |
| `intent:parsed` | main → renderer | `{ action, value }` | NLP result |

## File Organization

- **Configuration**: Root level (`.eslintrc.json`, `package.json`)
- **Electron Bridge**: `main/` and `renderer/`
- **Business Logic**: `voice/`, `logic/`, `iot/`, `audio/`
- **Firmware**: `firmware/` (separate Python context)
- **Tests**: Alongside modules (`*.test.js`)
- **Docs**: `docs/` (architecture, roadmaps)

## Development Workflow

1. **Voice module** fully offline; test with `nlp.test.js`
2. **Logic module** generates Python independently
3. **IoT module** connects to local MQTT (no internet required)
4. **Renderer** binds UI to IPC channels
5. **Firmware** runs standalone on ESP32 via MicroPython

## Key Decisions

- **Blockly**: Provides AST and visual editor without external dependencies
- **Vosk**: No internet, silent model, offline STT
- **MQTT**: Decoupled device communication; local broker sufficient
- **MicroPython**: Lightweight, suitable for ESP32 resource constraints
- **No Frameworks**: Vanilla HTML + JS for renderer; direct Electron IPC

## Testing Strategy

- **Unit Tests**: Each module has Jest tests for core logic
- **Integration**: IPC channels tested end-to-end in renderer
- **Manual**: Voice input and device telemetry tested with real ESP32

## Next Steps (When Extending)

1. Blockly custom blocks for motor control
2. More intent types in NLP parser
3. Visual theme refinement (high-contrast, dark mode)
4. Audio earcon library expansion
5. Firmware: sensor integration, calibration routines
