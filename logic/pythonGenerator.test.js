import PythonGenerator from './pythonGenerator.js';

describe('PythonGenerator', () => {
  let generator;

  beforeEach(() => {
    generator = new PythonGenerator();
  });

  describe('Block Generation', () => {
    test('should generate move_forward command', () => {
      const ast = {
        type: 'motor_move_forward',
        values: { distance_value: 100 },
      };
      const result = generator.generateBlock(ast, 0);
      expect(result).toContain('move_forward(100)');
    });

    test('should generate move_backward command', () => {
      const ast = {
        type: 'motor_move_backward',
        values: { distance_value: 50 },
      };
      const result = generator.generateBlock(ast, 0);
      expect(result).toContain('move_backward(50)');
    });

    test('should generate spin_left command', () => {
      const ast = {
        type: 'motor_spin_left',
        values: { degrees_value: 90 },
      };
      const result = generator.generateBlock(ast, 0);
      expect(result).toContain('spin_left(90)');
    });

    test('should generate spin_right command', () => {
      const ast = {
        type: 'motor_spin_right',
        values: { degrees_value: 180 },
      };
      const result = generator.generateBlock(ast, 0);
      expect(result).toContain('spin_right(180)');
    });

    test('should handle default values', () => {
      const ast = {
        type: 'motor_move_forward',
        values: {},
      };
      const result = generator.generateBlock(ast, 0);
      expect(result).toContain('move_forward(100)');
    });
  });

  describe('Control Flow', () => {
    test('should generate repeat loop', () => {
      const ast = {
        type: 'controls_repeat',
        values: { times: 5 },
        inputs: { DO: { type: 'motor_move_forward', values: { distance_value: 50 } } },
      };
      const result = generator.generateBlock(ast, 0);
      expect(result).toContain('for i in range(5)');
      expect(result).toContain('move_forward(50)');
    });

    test('should generate if statement', () => {
      const ast = {
        type: 'controls_if',
        values: {},
        inputs: { DO: { type: 'motor_spin_left', values: { degrees_value: 45 } } },
      };
      const result = generator.generateBlock(ast, 0);
      expect(result).toContain('if ');
      expect(result).toContain('spin_left(45)');
    });
  });

  describe('Full Program Generation', () => {
    test('should generate complete program with imports', () => {
      const ast = [
        {
          type: 'motor_move_forward',
          values: { distance_value: 100 },
        },
      ];
      const code = generator.generateFromAST(ast);
      expect(code).toContain('import machine');
      expect(code).toContain('import utime');
      expect(code).toContain('from umqtt import simple as mqtt');
      expect(code).toContain('def move_forward');
      expect(code).toContain('move_forward(100)');
    });

    test('should generate program with initialization', () => {
      const ast = [];
      const code = generator.generateFromAST(ast);
      expect(code).toContain('left_forward = machine.Pin');
      expect(code).toContain('left_pwm = machine.PWM');
    });

    test('should handle empty AST', () => {
      const code = generator.generateFromAST([]);
      expect(code).toContain('import machine');
      expect(code.length).toBeGreaterThan(0);
    });

    test('should maintain proper indentation', () => {
      const ast = {
        type: 'controls_repeat',
        values: { times: 2 },
        inputs: { DO: { type: 'motor_move_forward', values: { distance_value: 50 } } },
      };
      const code = generator.generateBlock(ast, 1);
      expect(code).toContain('  for i in range(2)');
      expect(code).toContain('    move_forward(50)');
    });
  });

  describe('Code Quality', () => {
    test('should generate valid Python syntax', () => {
      const ast = [
        { type: 'motor_move_forward', values: { distance_value: 100 } },
        { type: 'motor_spin_left', values: { degrees_value: 90 } },
      ];
      const code = generator.generateFromAST(ast);

      // Basic syntax check: should have balanced parentheses
      const openParen = (code.match(/\(/g) || []).length;
      const closeParen = (code.match(/\)/g) || []).length;
      expect(openParen).toBe(closeParen);
    });

    test('should include motor control functions', () => {
      const code = generator.generateImports();
      const init = generator.generateInit();
      const fullCode = code + '\n' + init;

      expect(fullCode).toContain('def move_forward');
      expect(fullCode).toContain('def move_backward');
      expect(fullCode).toContain('def spin_left');
      expect(fullCode).toContain('def spin_right');
    });
  });
});
