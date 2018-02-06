/**
 * This class is an abstract class with all default methods that every child class should have.
 *
 * @param {object} options An object of options that should be parameters of this class.
 * @returns {BaseModule} Returns an instance of the child class.
 */
class BaseModule {

  /**
   * @see BaseModule.
   */
  constructor(options) {
    if (new.target === BaseModule) {
      throw new TypeError('Cannot construct BaseModule instances directly');
    }

    for (let key in options) {
      if (options.hasOwnProperty(key)) this[key] = options[key];
    }

    return this;
  }

  /**
   * Set all configuration parameters for this class.
   *
   * @param {object} [config={}] An object of configurations.
   */
  setLocalConfig(config = {}) {
    for (let key in config) {
      if (config.hasOwnProperty(key)) {
        this[key] = config[key];
      }
    }
  }
}

exports.BaseModule = BaseModule;