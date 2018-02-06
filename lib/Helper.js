// Import custom modules.
const {Global} = require(`${__dirname}/Global`);

/**
 * Helper is a helper class and just has static methods.
 */
class Helper {

  /**
   * Check if a callback exists.
   *
   * @param {string} name The name of a callback.
   * @returns {boolean} Returns true of false.
   */
  static hasCallback(name) {
    let callbacks = Global.get('callbacks');

    return typeof callbacks[name] !== 'undefined';
  }

  /**
   * Get a callback if exists.
   *
   * @param {string} name The name of a callback.
   * @returns {function|null} Returns the callback or null if not exists.
   */
  static getCallback(name) {
    let callbacks = Global.get('callbacks');

    return (this.hasCallback(name) ? callbacks[name] : null);
  }

  /**
   * Check if debug mode is enabled for the given module.
   *
   * @param {string} moduleName The name of the module.
   * @returns {boolean} Returns true of false.
   */
  static isDebug(moduleName) {
    if (typeof Global.get('DEBUG') === 'string') return Global.get('DEBUG') === moduleName;

    return Global.get('DEBUG');
  };
}

exports.Helper = Helper;