/**
 * Natural Language Processing (NLP) module.
 * Deterministic intent parser for voice commands.
 * Maps transcribed text to structured intents (action + value).
 */
class IntentParser {
  constructor() {
    // Intent patterns: [regex, action, valueExtractor]
    this.patterns = [
      // Motor commands
      [/move\s+forward(?:\s+(\d+)\s*(?:mm|units|steps))?/i, 'motor_forward', (_m) => _m[1] || '100'],
      [/move\s+backward(?:\s+(\d+)\s*(?:mm|units|steps))?/i, 'motor_backward', (_m) => _m[1] || '100'],
      [/spin\s+left(?:\s+(\d+)\s*(?:degrees|deg))?/i, 'motor_turn_left', (_m) => _m[1] || '90'],
      [/spin\s+right(?:\s+(\d+)\s*(?:degrees|deg))?/i, 'motor_turn_right', (_m) => _m[1] || '90'],
      [/rotate\s+(\d+)\s*(?:degrees|deg)/i, 'motor_rotate', (_m) => _m[1]],

      // Block management
      [/add\s+(?:a\s+)?(\w+)\s+block/i, 'add_block', (_m) => _m[1] || 'basic'],
      [/delete\s+(?:the\s+)?(?:selected\s+)?block/i, 'delete_block', (_m) => 'selected'],
      [/clear\s+(?:all\s+)?blocks/i, 'clear_blocks', (_m) => 'all'],

      // Control flow
      [/repeat\s+(\d+)\s+times/i, 'add_loop', (_m) => _m[1] || '3'],
      [/add\s+(?:an\s+)?if\s+statement/i, 'add_condition', (_m) => 'if'],

      // Execution
      [/run\s+(?:the\s+)?code/i, 'run_code', (_m) => 'execute'],
      [/stop\s+(?:the\s+)?code/i, 'stop_code', (_m) => 'halt'],

      // UI commands
      [/switch\s+to\s+(?:the\s+)?(?:high\s+)?contrast/i, 'toggle_contrast', (_m) => 'high'],
      [/use\s+(?:the\s+)?(?:light\s+)?(?:color\s+)?theme/i, 'toggle_contrast', (_m) => 'light'],
    ];
  }

  /**
   * Parse a transcript string and return structured intent.
   * @param {string} transcript - Raw speech-to-text output
   * @returns {object} - { action, value, confidence, raw: transcript }
   */
  parse(transcript) {
    if (!transcript || typeof transcript !== 'string') {
      return {
        action: 'unknown',
        value: '',
        confidence: 0,
        raw: transcript || '',
      };
    }

    const trimmed = transcript.trim().toLowerCase();

    for (const [pattern, action, valueExtractor] of this.patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const value = valueExtractor(match);
        return {
          action,
          value,
          confidence: 0.95, // High confidence for deterministic match
          raw: transcript,
        };
      }
    }

    // No match found
    return {
      action: 'unknown',
      value: trimmed,
      confidence: 0.0,
      raw: transcript,
    };
  }

  /**
   * Add a custom intent pattern.
   * @param {RegExp} pattern - Regex pattern to match
   * @param {string} action - Intent action name
   * @param {function} valueExtractor - Function to extract value from regex match
   */
  addPattern(pattern, action, valueExtractor) {
    this.patterns.push([pattern, action, valueExtractor]);
  }

  /**
   * Parse multiple transcripts and return best match.
   * Useful when Vosk returns multiple hypotheses.
   * @param {string[]} transcripts - Array of possible transcriptions
   * @returns {object} - Best matched intent
   */
  parseBest(transcripts) {
    if (!Array.isArray(transcripts) || transcripts.length === 0) {
      return { action: 'unknown', value: '', confidence: 0 };
    }

    let bestIntent = { action: 'unknown', value: '', confidence: 0 };

    for (const transcript of transcripts) {
      const intent = this.parse(transcript);
      if (intent.confidence > bestIntent.confidence) {
        bestIntent = intent;
      }
    }

    return bestIntent;
  }
}

export default IntentParser;
