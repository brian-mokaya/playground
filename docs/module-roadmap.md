# Module Development Roadmap

## Overview
This roadmap tracks the development status of the Inclusive Voice-Controlled IDE modules. Each module has clear milestones and can be developed in parallel.

---

## Module 1: Voice Pipeline

**Status**: Core implementation complete  
**Responsible**: Voice team

### Milestones

- [x] Vosk STT integration (`voice/stt.js`)
- [x] Microphone capture (`voice/mic.js`)
- [x] NLP intent parser (`voice/nlp.js`)
- [x] Unit tests for NLP (5+ intents in `nlp.test.js`)
- [ ] **TODO**: Multi-language support (Spanish, French)
- [ ] **TODO**: Custom model support for domain-specific commands
- [ ] **TODO**: Vosk model downloader utility
- [ ] **TODO**: Confidence score filtering (reject low-confidence transcripts)
- [ ] **TODO**: Command history and undo/redo
- [ ] **TODO**: Accessibility: audio feedback for STT state

**Next Step**: Add Spanish/French language models

---

## Module 2: Logic Engine (Blockly + Python Generation)

**Status**: Core implementation complete  
**Responsible**: Logic team

### Milestones

- [x] Headless Blockly workspace (`logic/blocklyEngine.js`)
- [x] Intent-to-AST mapper (`logic/intentToAST.js`)
- [x] Python code generator (`logic/pythonGenerator.js`)
- [x] Unit tests for Python generator (5+ test cases in `pythonGenerator.test.js`)
- [ ] **TODO**: Custom block definitions for motor control
- [ ] **TODO**: Sensor input blocks (proximity, light, motion)
- [ ] **TODO**: Loop and condition statement refinement
- [ ] **TODO**: Variable and function definition blocks
- [ ] **TODO**: Blockly XML import/export (save/load programs)
- [ ] **TODO**: Code optimization (dead code removal)

**Next Step**: Define motor control block spcifications

---

## Module 3: IoT Bridge (MQTT + Telemetry)

**Status**: Core implementation complete  
**Responsible**: IoT team

### Milestones

- [x] MQTT client (`iot/mqttClient.js`)
- [x] Telemetry processor (`iot/telemetry.js`)
- [x] Command schema (`iot/schemas/command.schema.json`)
- [x] Telemetry schema (`iot/schemas/telemetry.schema.json`)
- [ ] **TODO**: Schema validation middleware
- [ ] **TODO**: Reconnection logic with exponential backoff
- [ ] **TODO**: Message queuing for offline scenarios
- [ ] **TODO**: Encryption (TLS) support
- [ ] **TODO**: Multi-device support (fleet management)
- [ ] **TODO**: Telemetry logging and analytics

**Next Step**: Implement schema validation

---

## Module 4: ESP32 Firmware

**Status**: Core implementation complete  
**Responsible**: Firmware team

### Milestones

- [x] MQTT subscriber (`firmware/mqtt_client.py`)
- [x] Motor control module (`firmware/motor_control.py`)
- [x] Main entry point (`firmware/main.py`)
- [x] Configuration (`firmware/config.py`)
- [ ] **TODO**: Kalman filter for motor odometry
- [ ] **TODO**: Accelerometer/gyroscope integration
- [ ] **TODO**: Battery monitoring circuit
- [ ] **TODO**: Flash storage for program persistence
- [ ] **TODO**: OTA (Over-The-Air) firmware updates
- [ ] **TODO**: Sensor calibration routines
- [ ] **TODO**: Energy optimization (sleep modes)

**Next Step**: Integrate accelerometer and gyroscope

---

## Module 5: Audio Feedback (TTS + Earcons)

**Status**: Core implementation in progress  
**Responsible**: Audio team

### Milestones

- [x] TTS engine wrapper (`audio/tts.js`)
- [x] Earcons module (`audio/earcons.js`)
- [x] Placeholder audio files (9 earcons)
- [ ] **TODO**: Replace placeholder audio with professional earcon recordings
- [ ] **TODO**: SSML support for advanced TTS (pitch, speed, pausing)
- [ ] **TODO**: Sound effect library expansion
- [ ] **TODO**: Audio mixing for concurrent playback
- [ ] **TODO**: Accessibility: audio description for visual events
- [ ] **TODO**: Offline TTS engine (espeak integration)
- [ ] **TODO**: Audio ducking (reduce volume during important alerts)

**Next Step**: Record professional earcons (Fiverr or similar)

---

## Module 6: Renderer & UI

**Status**: Core implementation complete  
**Responsible**: UI team

### Milestones

- [x] HTML entry point (`renderer/index.html`)
- [x] Renderer logic (`renderer/renderer.js`)
- [x] Base CSS (`renderer/styles/base.css`)
- [x] High-contrast theme (`renderer/styles/high-contrast.css`)
- [x] Blockly custom theme (`renderer/styles/blockly-theme.css`)
- [ ] **TODO**: Dark mode support
- [ ] **TODO**: Screen reader optimizations (ARIA labels, semantic HTML)
- [ ] **TODO**: Keyboard shortcuts (Tab, Enter, Delete)
- [ ] **TODO**: Touch/gesture support for mobile
- [ ] **TODO**: Responsive design for small screens
- [ ] **TODO**: Visual block animation feedback
- [ ] **TODO**: Code preview syntax highlighting

**Next Step**: Implement keyboard shortcut handler

---

## Module 7: Main Process & IPC

**Status**: Core implementation complete  
**Responsible**: Desktop team

### Milestones

- [x] Electron main process (`main/main.js`)
- [x] IPC preload bridge (`main/preload.js`)
- [ ] **TODO**: Error handling and recovery
- [ ] **TODO**: Crash reporting (Sentry integration)
- [ ] **TODO**: Auto-update mechanism
- [ ] **TODO**: Settings/preferences panel
- [ ] **TODO**: Multi-window support (debug console)
- [ ] **TODO**: Performance monitoring

**Next Step**: Add settings persistence

---

## Integration Testing

**Status**: Not started  
**Responsible**: QA team

### Milestones

- [ ] **TODO**: End-to-end voice → MQTT → ESP32 test
- [ ] **TODO**: Manual accessibility testing (screen reader)
- [ ] **TODO**: Performance profiling (CPU, memory)
- [ ] **TODO**: Network failure recovery
- [ ] **TODO**: Stress testing (100+ blocks in workspace)
- [ ] **TODO**: Cross-platform testing (Windows, macOS, Linux)

---

## Documentation

**Status**: In progress  
**Responsible**: Documentation team

### Milestones

- [x] Architecture overview (`docs/architecture.md`)
- [x] Module roadmap (`docs/module-roadmap.md`)
- [ ] **TODO**: API documentation (JSDoc)
- [ ] **TODO**: User guide (getting started, voice commands reference)
- [ ] **TODO**: Developer guide (contributing, code style)
- [ ] **TODO**: Troubleshooting guide
- [ ] **TODO**: Video tutorials

---

## Release Planning

### Phase 1: Alpha (Current)
- All core modules functional
- Voice → Blockly → Python pipeline complete
- Basic UI with high-contrast mode
- Target: Q3 2024

### Phase 2: Beta
- Professional audio (earcons recorded)
- Accessibility refinements
- Multi-language support
- Target: Q4 2024

### Phase 3: v1.0
- Performance optimization
- Mobile app (React Native)
- Plugin system
- Target: Q1 2025

---

## Open Questions & Decisions

1. **TTS Backend**: Should we default to espeak or gtts?
   - espeak: Faster, open-source, no internet
   - gtts: Better quality, requires internet or offline caching
   - **Decision pending**: User feedback needed

2. **MQTT Broker**: Should we bundle Mosquitto or require external installation?
   - Bundled: Easier setup, larger package
   - External: Leaner, more modular
   - **Decision pending**: Focus on UX vs. package size

3. **Blockly Custom Blocks**: Should we maintain our own or contribute upstream?
   - Maintain: Full control, faster iteration
   - Upstream: Community support, better maintenance
   - **Decision**: Maintain for now, review Blockly PRs quarterly

4. **ESP32 Board Support**: Which variants should we target?
   - ESP32-WROOM: Affordable, widely available
   - ESP32-S3: Newer, better performance
   - **Decision**: Both; config.py handles pin mapping

---

## Getting Involved

To contribute to a module:
1. Check the milestone list above
2. Pick a **TODO** item
3. Create a GitHub issue describing the work
4. Submit a PR with tests and documentation
5. See `CLAUDE.md` for coding conventions

---

## Timeline Summary

| Module | Alpha | Beta | v1.0 |
|--------|-------|------|------|
| Voice | ✅ | ➕ Multi-lang | ✅ |
| Logic | ✅ | ➕ Adv blocks | ✅ |
| IoT | ✅ | ➕ Encryption | ✅ |
| Firmware | ✅ | ➕ Sensors | ✅ |
| Audio | 🚧 | ✅ Pro earcons | ✅ |
| Renderer | ✅ | ➕ Dark mode | ✅ |
| Main | ✅ | ➕ Settings | ✅ |
| Testing | 🚧 | ✅ Complete | ✅ |

**Legend**: ✅ Complete | 🚧 In Progress | ➕ Planned

---

*Last updated: 2024-Q3*
