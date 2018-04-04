// Import custom modules.
const Global = require(`${__dirname}/Global`),
  Parser = require(`${__dirname}/Parser`);

let output = null;

/**
 * Helper is a helper class and just has static methods.
 */
class Helper {

  /**
   * Set the local output instance.
   *
   * @param {Output} instance An instance of the class Output.
   */
  static setOutput(instance) {
    output = instance;
  }

  /**
   * Compare two objects. Are they equal?
   *
   * @param {object} a Object a that should be compared with object b.
   * @param {object} b Object b that should be compared with object a.
   * @returns {boolean} Returns true or false.
   */
  static compare2Objects(a, b) {
    for (let key in a) {
      if (a.hasOwnProperty(key) && b.hasOwnProperty(key)) {
        if (typeof a[key] !== typeof b[key]) return false;
        if (a[key] !== b[key]) return false;
      }
    }

    return true;
  }

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
   * @example "2018-04-03 15:16:27"
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

    // A callback have to be a function.
    return typeof callbacks[name] === 'function';
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
   * @param {function} method The method which called this method.
   * @param {string} file The absolute path to the file.
   * @param {number} line The line number where this method was called.
   */
  static printDebugLine(method, file, line) {
    // Without an output instance we are not able to print something via the output class.
    if (!output) return;

    let methodName = Parser.getMethodName(method),
      moduleName = Parser.getModuleName(file),
      string = `${moduleName}.${methodName} - File: ${file} - Line: ${line}`;

    output.writeConsole(string, Helper.isDebug(moduleName), 'debug');
  }

  /**
   * Prints output on debugging.
   *
   * @param {string} file The absolute path to the file.
   * @param {*} value The value that should be debugged.
   * @param {number} [level=5] The debug level on which it should be printed (level 0-5).
   */
  static debug(file, value, level = 5) {
    if (!output) return;

    let moduleName = Parser.getModuleName(file);

    if (Global.get('DEBUG_LEVEL') >= level) {
      output.writeConsole(value, Helper.isDebug(moduleName), 'default');
    }
  }
}

module.exports = Helper;