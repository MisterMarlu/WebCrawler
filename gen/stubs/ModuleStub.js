// Import custom modules.
const {BaseModule} = require(`${__dirname}/../%crawlerDirName%`);

let instance = null;

/**
 * A new module.
 *
 * @extends BaseModule
 * @param {object} options An object of options, defined in the core.
 * @returns {%ModuleStub%} Returns the %ModuleStub% instance.
 */
class %ModuleStub% extends BaseModule {

  /**
   * @see %ModuleStub%.
   */
  constructor(options) {
    // Constructor of the super class.
    super(options);

    // The class %ModuleStub% is a singleton class.
    if (!(this instanceof %ModuleStub%)) return new %ModuleStub%(options);
    if (instance instanceof %ModuleStub%) return instance;

    instance = this;

    return this;
  }
}

module.exports = %ModuleStub%;