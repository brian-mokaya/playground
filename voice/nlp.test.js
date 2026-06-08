import IntentParser from './nlp.js';

describe('IntentParser', () => {
  let parser;

  beforeEach(() => {
    parser = new IntentParser();
  });

  describe('Motor Commands', () => {
    test('should parse "move forward" command', () => {
      const result = parser.parse('move forward');
      expect(result.action).toBe('motor_forward');
      expect(result.value).toBe('100');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('should parse "move forward 50 units" with distance', () => {
      const result = parser.parse('move forward 50 units');
      expect(result.action).toBe('motor_forward');
      expect(result.value).toBe('50');
    });

    test('should parse "spin right 90 degrees"', () => {
      const result = parser.parse('spin right 90 degrees');
      expect(result.action).toBe('motor_turn_right');
      expect(result.value).toBe('90');
    });

    test('should parse "move backward"', () => {
      const result = parser.parse('move backward');
      expect(result.action).toBe('motor_backward');
    });

    test('should parse "rotate 180 degrees"', () => {
      const result = parser.parse('rotate 180 degrees');
      expect(result.action).toBe('motor_rotate');
      expect(result.value).toBe('180');
    });
  });

  describe('Block Management', () => {
    test('should parse "add a motor block"', () => {
      const result = parser.parse('add a motor block');
      expect(result.action).toBe('add_block');
      expect(result.value).toBe('motor');
    });

    test('should parse "delete the selected block"', () => {
      const result = parser.parse('delete the selected block');
      expect(result.action).toBe('delete_block');
    });

    test('should parse "clear all blocks"', () => {
      const result = parser.parse('clear all blocks');
      expect(result.action).toBe('clear_blocks');
      expect(result.value).toBe('all');
    });

    test('should parse "add loop block"', () => {
      const result = parser.parse('repeat 5 times');
      expect(result.action).toBe('add_loop');
      expect(result.value).toBe('5');
    });
  });

  describe('Execution Commands', () => {
    test('should parse "run code"', () => {
      const result = parser.parse('run code');
      expect(result.action).toBe('run_code');
    });

    test('should parse "stop the code"', () => {
      const result = parser.parse('stop the code');
      expect(result.action).toBe('stop_code');
    });
  });

  describe('UI Commands', () => {
    test('should parse "switch to high contrast"', () => {
      const result = parser.parse('switch to high contrast');
      expect(result.action).toBe('toggle_contrast');
      expect(result.value).toBe('high');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty string', () => {
      const result = parser.parse('');
      expect(result.action).toBe('unknown');
      expect(result.confidence).toBe(0);
    });

    test('should handle null', () => {
      const result = parser.parse(null);
      expect(result.action).toBe('unknown');
    });

    test('should return unknown for unrecognized command', () => {
      const result = parser.parse('this is complete nonsense xyz');
      expect(result.action).toBe('unknown');
      expect(result.confidence).toBe(0);
    });

    test('should be case insensitive', () => {
      const lower = parser.parse('move forward');
      const upper = parser.parse('MOVE FORWARD');
      expect(lower.action).toBe(upper.action);
    });
  });

  describe('Multiple Hypothesis Parsing', () => {
    test('should select best match from multiple transcripts', () => {
      const transcripts = [
        'this is nonsense',
        'move forwrd typo',
        'move forward 50 units',
      ];
      const result = parser.parseBest(transcripts);
      expect(result.action).toBe('motor_forward');
      expect(result.value).toBe('50');
    });

    test('should handle empty array', () => {
      const result = parser.parseBest([]);
      expect(result.action).toBe('unknown');
    });
  });

  describe('Custom Patterns', () => {
    test('should add and recognize custom patterns', () => {
      parser.addPattern(
        /dance\s+(\w+)/i,
        'custom_dance',
        (m) => m[1]
      );
      const result = parser.parse('dance tango');
      expect(result.action).toBe('custom_dance');
      expect(result.value).toBe('tango');
    });
  });
});
