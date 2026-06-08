import * as Blockly from 'blockly';

/**
 * Blockly Engine for headless block programming.
 * Provides AST manipulation and code generation.
 */
class BlocklyEngine {
  constructor(options = {}) {
    this.workspace = null;
    this.options = options;
    this.initBlockDefinitions();
  }

  /**
   * Initialize the headless Blockly workspace.
   */
  async initialize() {
    try {
      // Create a headless workspace (no UI)
      this.workspace = new Blockly.Workspace();
      console.log('Blockly workspace initialized');
    } catch (error) {
      console.error('Blockly initialization error:', error);
      throw error;
    }
  }

  /**
   * Define custom block types for motor control.
   */
  initBlockDefinitions() {
    // Motor Forward Block
    Blockly.Blocks['motor_move_forward'] = {
      init: function () {
        this.appendValueInput('distance')
          .setCheck('Number')
          .appendField('Move Forward');
        this.appendField(new Blockly.FieldNumber(100), 'distance_value');
        this.setOutput(true, 'motor');
        this.setColour(230);
        this.setTooltip('Move robot forward by distance');
      },
    };

    // Motor Backward Block
    Blockly.Blocks['motor_move_backward'] = {
      init: function () {
        this.appendField('Move Backward');
        this.appendField(new Blockly.FieldNumber(100), 'distance_value');
        this.setOutput(true, 'motor');
        this.setColour(230);
        this.setTooltip('Move robot backward by distance');
      },
    };

    // Motor Turn Left Block
    Blockly.Blocks['motor_spin_left'] = {
      init: function () {
        this.appendField('Spin Left');
        this.appendField(new Blockly.FieldNumber(90), 'degrees_value');
        this.setOutput(true, 'motor');
        this.setColour(230);
        this.setTooltip('Spin robot left by degrees');
      },
    };

    // Motor Turn Right Block
    Blockly.Blocks['motor_spin_right'] = {
      init: function () {
        this.appendField('Spin Right');
        this.appendField(new Blockly.FieldNumber(90), 'degrees_value');
        this.setOutput(true, 'motor');
        this.setColour(230);
        this.setTooltip('Spin robot right by degrees');
      },
    };

    // Repeat Loop Block
    Blockly.Blocks['controls_repeat'] = {
      init: function () {
        this.appendField('Repeat');
        this.appendField(new Blockly.FieldNumber(3), 'times');
        this.appendField('times');
        this.appendStatementInput('DO');
        this.setColour(260);
        this.setTooltip('Repeat statements N times');
      },
    };

    // If Condition Block
    Blockly.Blocks['controls_if'] = {
      init: function () {
        this.appendField('If');
        this.appendValueInput('condition');
        this.appendField('then');
        this.appendStatementInput('DO');
        this.setColour(260);
        this.setTooltip('Execute block if condition is true');
      },
    };
  }

  /**
   * Get the workspace XML representation.
   */
  getXML() {
    if (!this.workspace) {
      throw new Error('Workspace not initialized');
    }
    return Blockly.Xml.workspaceToDom(this.workspace);
  }

  /**
   * Load workspace from XML.
   */
  loadXML(xmlString) {
    try {
      const xml = Blockly.utils.xml.textToDom(xmlString);
      Blockly.Xml.domToWorkspace(xml, this.workspace);
    } catch (error) {
      console.error('XML load error:', error);
      throw error;
    }
  }

  /**
   * Get all blocks in the workspace.
   */
  getAllBlocks() {
    if (!this.workspace) {
      return [];
    }
    return this.workspace.getAllBlocks(false);
  }

  /**
   * Get top-level blocks (not nested in other blocks).
   */
  getTopBlocks() {
    if (!this.workspace) {
      return [];
    }
    return this.workspace.getTopBlocks(false);
  }

  /**
   * Create a new block and add to workspace.
   */
  createBlock(type, values = {}) {
    if (!this.workspace) {
      throw new Error('Workspace not initialized');
    }

    const block = this.workspace.newBlock(type);
    for (const [key, value] of Object.entries(values)) {
      const field = block.getField(key);
      if (field) {
        field.setValue(value);
      }
    }
    block.initSvg();
    return block;
  }

  /**
   * Delete a block by ID.
   */
  deleteBlock(blockId) {
    if (!this.workspace) {
      return;
    }
    const block = this.workspace.getBlockById(blockId);
    if (block) {
      block.dispose(true);
    }
  }

  /**
   * Clear all blocks from workspace.
   */
  clear() {
    if (this.workspace) {
      this.workspace.clear();
    }
  }

  /**
   * Get AST representation of workspace.
   */
  getAST() {
    const blocks = this.getTopBlocks();
    return blocks.map((block) => this.blockToAST(block));
  }

  /**
   * Convert block to AST node.
   */
  blockToAST(block) {
    const ast = {
      type: block.type,
      id: block.id,
      values: {},
      inputs: {},
    };

    // Extract field values
    for (const field of block.inputList) {
      if (field.fieldRow) {
        for (const f of field.fieldRow) {
          if (f.name) {
            ast.values[f.name] = f.getValue ? f.getValue() : null;
          }
        }
      }
    }

    // Extract nested blocks
    for (const input of block.inputList) {
      if (input.connection && input.connection.targetBlock) {
        ast.inputs[input.name] = this.blockToAST(input.connection.targetBlock());
      }
    }

    return ast;
  }

  /**
   * Cleanup resources.
   */
  cleanup() {
    if (this.workspace) {
      this.workspace.dispose();
      this.workspace = null;
    }
  }
}

export default BlocklyEngine;
