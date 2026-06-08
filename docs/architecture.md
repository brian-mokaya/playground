# Architecture Overview

## 4-Step Voice-to-Execution Pipeline

### Step 1: Voice Input & STT
- User speaks a command into the microphone
- **Vosk** (offline STT engine) converts audio to raw transcript string
- No cloud dependency; all processing happens locally on the device
- Example: "move forward 50 units" → raw transcript sent to NLP parser

### Step 2: Intent Parsing (NLP)
- Raw transcript is deterministically parsed by `voice/nlp.js`
- Maps transcript patterns to structured intents: `{ action, value }`
- Example: "move forward 50 units" → `{ action: 'motor_forward', value: 50 }`
- Uses regex-based pattern matching (no external ML model)

### Step 3: Intent to Blockly AST
- Parsed intent is converted to Blockly block operations by `logic/intentToAST.js`
- Maps action names to block types and creates blocks in the workspace
- Example: `{ action: 'motor_forward', value: 50 }` → creates `motor_move_forward` block with distance=50
- User can see visual blocks forming in real-time

### Step 4: Code Generation & Device Execution
- **Blockly AST** is walked by `logic/pythonGenerator.js` to generate MicroPython code
- Generated code is published via MQTT to the ESP32 device
- **ESP32** subscribes to MQTT topic, receives Python code, and executes motor commands
- Example: Block AST → `move_forward(50)` → ESP32 motor controller → left/right motor pins activate

## System Architecture Diagram

```
┌──────────────────┐
│   User Voice     │
│  "move forward"  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Vosk STT        │─── (offline, no internet)
│  Raw Transcript  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  NLP Parser      │
│  Intent Extract  │
│  {action,value}  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Blockly AST     │
│  Block Creation  │
│  Visual Display  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Python Gen      │
│  Code String     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐       ┌──────────────────┐
│  MQTT Publish    │──────▶│  MQTT Broker     │
│  (Electron)      │       │  (Local Network) │
└──────────────────┘       └────────┬─────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │  MQTT Subscribe  │
                           │  (ESP32 Device)  │
                           └────────┬─────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │  Motor Control   │
                           │  GPIO Activation │
                           └──────────────────┘
```

## Module Interactions

### Main Process (`main/main.js`)
- Initializes all submodules
- Sets up IPC channels for renderer ↔ main communication
- Manages app lifecycle and cleanup

### Renderer (`renderer/renderer.js`)
- Manages Blockly UI
- Listens to voice events via IPC
- Updates code preview in real-time
- Publishes MQTT commands when user clicks "Run"

### Voice Module (`voice/`)
- `mic.js`: Captures audio from microphone (push-to-talk)
- `stt.js`: Feeds audio to Vosk, emits transcripts
- `nlp.js`: Parses transcripts into intents

### Logic Module (`logic/`)
- `blocklyEngine.js`: Headless Blockly workspace
- `intentToAST.js`: Maps intents to block operations
- `pythonGenerator.js`: Walks AST, generates Python code

### IoT Module (`iot/`)
- `mqttClient.js`: Local MQTT broker connection
- `telemetry.js`: Parses device feedback JSON
- Schemas: Validate command/telemetry message structure

### Audio Module (`audio/`)
- `tts.js`: Routes all user feedback through TTS (ensures accessibility)
- `earcons.js`: Maps events to audio cues

### Firmware (`firmware/`)
- `main.py`: ESP32 entry point, MQTT dispatcher
- `motor_control.py`: Motor kinematics (forward, backward, spin)
- `mqtt_client.py`: MicroPython MQTT wrapper
- `config.py`: Broker IP, topics, GPIO pins

## Data Flow: Complete Example

**User says:** "Move forward 50 units, then spin left 90 degrees"

1. **Vosk STT** → "move forward 50 units"
2. **NLP Parser** → `{ action: 'motor_forward', value: '50' }`
3. **Blockly** → Create `motor_move_forward` block, set distance to 50
4. **Vosk STT** → "spin left 90 degrees"
5. **NLP Parser** → `{ action: 'motor_turn_left', value: '90' }`
6. **Blockly** → Create `motor_spin_left` block, set degrees to 90
7. **Python Gen** → Generates:
   ```python
   move_forward(50)
   spin_left(90)
   ```
8. **MQTT Publish** → `commands/python` topic receives Python code
9. **ESP32 Subscribes** → Receives code, executes `move_forward(50)`
10. **Motor Control** → Left/right forward pins activate for ~0.5 seconds
11. **Execution** → Robot moves forward
12. **Motor Control** → Left backward, right forward pins activate for ~0.25 seconds
13. **Robot** → Spins left 90 degrees
14. **Telemetry** → ESP32 publishes `{ type: 'status', state: 'idle', ... }`
15. **Device Status** → Renderer displays "Idle"

## Offline-First Design

- **No Cloud APIs**: All STT, NLP, and code generation run locally
- **Local MQTT**: Broker runs on same network (e.g., Mosquitto on laptop)
- **MicroPython**: Lightweight runtime suitable for ESP32 flash constraints
- **Encrypted**: Optional TLS for MQTT if needed (not required for local use)

## Accessibility Features

1. **Tri-Modal Interface**:
   - Visual: Blockly canvas (sighted users)
   - High-Contrast: 100% black/white mode for low-vision users
   - Auditory: TTS feedback + earcons (blind users)

2. **Offline TTS**: All user-facing text routed through `audio/tts.js`
   - Screen reader friendly
   - Audio priority queue (high-priority feedback interrupts)

3. **Earcons**: Audio cues for events (block added, run started, error)
   - Reduces reliance on visual feedback

## Performance & Constraints

- **Vosk Model**: ~50MB footprint (silent/small model)
- **Blockly**: Headless + visual modes support all use cases
- **MicroPython**: ESP32 can hold ~1-2MB of code (firmware + user scripts)
- **MQTT**: Minimal overhead, suitable for resource-constrained devices
- **TTS**: Latency depends on backend (gtts ~1-2 seconds, espeak ~300ms)
