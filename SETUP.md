# Project Setup Guide

## Overview
This document provides step-by-step instructions for setting up the Inclusive Voice-Controlled IDE project.

## Prerequisites
- Node.js 16+ (tested with v18, v20)
- npm 7+
- Git
- Python 3.8+ (for MicroPython firmware)

## Installation Steps

### 1. Install Dependencies
```bash
cd /home/mokaya/Downloads/Software-Projects/playground

# Clear any previous failed installs
rm -rf node_modules package-lock.json

# Install with legacy peer deps support (for compatibility)
npm install --legacy-peer-deps
```

### 2. Verify Installation
```bash
# Check npm packages
npm list --depth=0

# Verify main dependencies
npm list blockly
npm list mqtt
npm list jest
npm list eslint
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
# Test NLP parser only
npx jest voice/nlp.test.js

# Test Python generator only
npx jest logic/pythonGenerator.test.js

# Run with verbose output
npm test -- --verbose

# Run with coverage report
npm test -- --coverage
```

## Development Commands

### Linting
```bash
npm run lint

# Fix auto-fixable issues
npx eslint . --fix
```

### Starting Electron App (requires electron installation)
```bash
npm run dev
```

### Building Production App
```bash
npm run build
```

## Troubleshooting

### Issue: npm ERR! notarget with dependencies
**Solution**: Use `--legacy-peer-deps` flag:
```bash
npm install --legacy-peer-deps
```

### Issue: ESLint environment unknown
**Solution**: Already fixed in `.eslintrc.json` (uses es2020)

### Issue: Jest not found
**Solution**: Install jest:
```bash
npm install --save-dev jest --legacy-peer-deps
```

### Issue: Module not found errors
**Solution**: Ensure you're using Node.js ESM modules correctly:
```bash
# In your code, use:
import Module from './module.js'

# NOT:
const Module = require('./module.js')
```

## Project Structure Reference

```
playground/
├── main/              # Electron main process
├── renderer/          # Frontend UI
├── voice/             # Voice pipeline (Vosk + NLP)
├── logic/             # Blockly + Python generation
├── iot/               # MQTT bridge
├── audio/             # TTS + earcons
├── firmware/          # ESP32 MicroPython
├── docs/              # Documentation
├── package.json       # Dependencies (blockly, mqtt, jest, eslint)
├── .eslintrc.json     # ESLint configuration
├── jest.config.json   # Jest configuration
├── .npmrc             # NPM configuration
└── README.md          # Project overview
```

## Module Dependencies

The project uses these key npm packages:
- **blockly** (v11.0.0) - Block-based programming
- **mqtt** (v4.3.0) - IoT messaging
- **jest** (v29.7.0) - Testing framework
- **eslint** (v8.50.0) - Code linting
- **electron** (v26.0.0) - Desktop app framework (dev)

## Testing Strategy

### Unit Tests
Each module has comprehensive unit tests:
- `voice/nlp.test.js` - 30+ tests for intent parsing
- `logic/pythonGenerator.test.js` - 19+ tests for code generation

### Running Tests
```bash
# All tests
npm test

# Single file
npx jest voice/nlp.test.js

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage
```

## Environment Setup

### For Development on Linux/macOS
```bash
# Install Node.js (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### For Windows Development
```bash
# Using chocolatey
choco install nodejs

# Or download from: https://nodejs.org/en/download/
```

### For MQTT Testing (Optional)
```bash
# Install Mosquitto broker
# macOS:
brew install mosquitto

# Linux (Debian/Ubuntu):
sudo apt-get install mosquitto

# Start broker
mosquitto
```

## Next Steps

1. **Install dependencies**: `npm install --legacy-peer-deps`
2. **Run tests**: `npm test`
3. **Check code quality**: `npm run lint`
4. **Read documentation**: See `README.md` and `docs/`

## Accessing Code

All source files are organized by module:
- Voice parsing: `voice/nlp.js` (154 lines)
- Code generation: `logic/pythonGenerator.js` (249 lines)
- IoT communication: `iot/mqttClient.js` (167 lines)
- ESP32 firmware: `firmware/main.py` (186 lines)

## Additional Resources

- **Architecture**: `docs/architecture.md` - Complete system design
- **Roadmap**: `docs/module-roadmap.md` - Development timeline
- **Conventions**: `CLAUDE.md` - Coding standards

---

**Last Updated**: June 6, 2026  
**Node.js Version**: 16+ (tested v18, v20)  
**Status**: Ready for development
