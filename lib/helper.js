// Import custom modules.
const {Global} = require(`${__dirname}/global`);

/**
 * Class Helper.
 */
class Helper {

  /**
   * Check if callback exists.
   *
   * @param name: String
   * @returns {boolean}
   */
  static hasCallback(name) {
    let callbacks = Global.get('callbacks');

    return typeof callbacks[name] !== 'undefined';
  }

  /**
   * Get callback if exists.
   *
   * @param name: String
   * @returns {function|null}
   */
  static getCallback(name) {
    let callbacks = Global.get('callbacks');

    return (this.hasCallback(name) ? callbacks[name] : null);
  }

  /**
   * Check if debug mode is enabled for specific module.
   *
   * @param moduleName: String
   * @returns {boolean}
   */
  static isDebug(moduleName) {
    return (Global.get('DEBUG') || Global.get('DEBUG') === moduleName);
  };
}

exports.Helper = Helper;