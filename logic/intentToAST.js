/**
 * Intent to Blockly AST mapper.
 * Converts parsed voice intents into Blockly block operations.
 */
class IntentToAST {
  constructor(blocklyEngine) {
    this.engine = blocklyEngine;
    this.intentHandlers = {
      motor_forward: this.handleMotorForward.bind(this),
      motor_backward: this.handleMotorBackward.bind(this),
      motor_turn_left: this.handleMotorTurnLeft.bind(this),
      motor_turn_right: this.handleMotorTurnRight.bind(this),
      motor_rotate: this.handleMotorRotate.bind(this),
      add_block: this.handleAddBlock.bind(this),
      delete_block: this.handleDeleteBlock.bind(this),
      clear_blocks: this.handleClearBlocks.bind(this),
      add_loop: this.handleAddLoop.bind(this),
      add_condition: this.handleAddCondition.bind(this),
    };
  }

  /**
   * Process an intent and update the Blockly workspace.
   */
  async processIntent(intent) {
    const { action, value } = intent;
    const handler = this.intentHandlers[action];

    if (!handler) {
      console.warn(`No handler for intent: ${action}`);
      return null;
    }

    try {
      return await handler(value);
    } catch (error) {
      console.error(`Intent processing error for ${action}:`, error);
      throw error;
    }
  }

  handleMotorForward(distance) {
    const block = this.engine.createBlock('motor_move_forward', {
      distance_value: parseInt(distance) || 100,
    });
    return { blockId: block.id, type: 'motor_forward' };
  }

  handleMotorBackward(distance) {
    const block = this.engine.createBlock('motor_move_backward', {
      distance_value: parseInt(distance) || 100,
    });
    return { blockId: block.id, type: 'motor_backward' };
  }

  handleMotorTurnLeft(degrees) {
    const block = this.engine.createBlock('motor_spin_left', {
      degrees_value: parseInt(degrees) || 90,
    });
    return { blockId: block.id, type: 'motor_turn_left' };
  }

  handleMotorTurnRight(degrees) {
    const block = this.engine.createBlock('motor_spin_right', {
      degrees_value: parseInt(degrees) || 90,
    });
    return { blockId: block.id, type: 'motor_turn_right' };
  }

  handleMotorRotate(degrees) {
    const block = this.engine.createBlock('motor_spin_right', {
      degrees_value: parseInt(degrees) || 90,
    });
    return { blockId: block.id, type: 'motor_rotate' };
  }

  handleAddBlock(blockType) {
    const typeMap = {
      motor: 'motor_move_forward',
      loop: 'controls_repeat',
      if: 'controls_if',
      condition: 'controls_if',
      forward: 'motor_move_forward',
      backward: 'motor_move_backward',
    };

    const actualType = typeMap[blockType.toLowerCase()] || 'motor_move_forward';
    const block = this.engine.createBlock(actualType);
    return { blockId: block.id, type: blockType };
  }

  handleDeleteBlock(_value) {
    // This would typically delete the selected block
    // Implementation depends on renderer context
    return { message: 'Block deletion requested' };
  }

  handleClearBlocks(_value) {
    this.engine.clear();
    return { message: 'All blocks cleared' };
  }

  handleAddLoop(times) {
    const block = this.engine.createBlock('controls_repeat', {
      times: parseInt(times) || 3,
    });
    return { blockId: block.id, type: 'loop' };
  }

  handleAddCondition(_value) {
    const block = this.engine.createBlock('controls_if');
    return { blockId: block.id, type: 'condition' };
  }

  /**
   * Get current AST from workspace.
   */
  getCurrentAST() {
    return this.engine.getAST();
  }
}

export default IntentToAST;
