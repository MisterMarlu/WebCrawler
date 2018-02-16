// Import custom modules.
const {Global} = require(`${__dirname}/Global`),
  {Parser} = require(`${__dirname}/Parser`);

/**
 * Helper is a helper class and just has static methods.
 */
class Helper {

  /**
   * Convert a one digit number into a two digit number.
   *
   * @param {number} number The number to convert.
   * @returns {string} Returns a two digit number as string.
   */
  static twoDigits(number) {
    return (number < 10) ? `0${number}` : number;
  }

  /**
   * Get a current MySQL timestamp.
   *
   * @param {Date} date A date object.
   * @returns {string} Returns the current MySQL timestamp.
   */
  static getSqlTimestamp(date = new Date()) {
    let Y = `${date.getFullYear()}`,
      m = `${Helper.twoDigits(1 + date.getMonth())}`,
      d = `${Helper.twoDigits(date.getDate())}`,
      h = `${Helper.twoDigits(date.getHours())}`,
      i = `${Helper.twoDigits(date.getMinutes())}`,
      s = `${Helper.twoDigits(date.getSeconds())}`;

    return `${Y}-${m}-${d} ${h}:${i}:${s}`;
  }

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

  /**
   * Check if debug mode is enabled.
   *
   * @returns {boolean} Returns true of false.
   */
  static debugEnabled() {
    return Global.get('DEBUG') !== 0;
  };

  /**
   * Prints the debugging line.
   *
   * @param {Output} output The Output instance.
   * @param {function} method The method which called this method.
   * @param {string} file The absolute path to the file.
   * @param {number} line The line number where this method was called.
   */
  static printDebugLine(output, method, file, line) {
    let methodName = Parser.getMethodName(method),
      moduleName = Parser.getModuleName(file),
      string = `${moduleName}.${methodName} - File: ${file} - Line: ${line}`;

    output.writeConsole(string, Helper.isDebug(moduleName), 'debug');
  }
}

exports.Helper = Helper;