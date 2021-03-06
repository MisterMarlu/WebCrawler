/**
 * Parser is a helper class and just has static methods.
 */
class Parser {

  /**
   * Get the name of the module from the absolute file path.
   *
   * @param {string} path Absolute path to the file.
   * @returns {string} Returns the module name.
   */
  static getModuleName(path) {
    let pathArray = path.split('/'),
      fileName = pathArray[pathArray.length - 1];

    return fileName.split('.')[0];
  }

  /**
   * Get the name of the method that is called.
   *
   * @param {function} method The method.
   * @returns {string} Returns the method name.
   */
  static getMethodName(method) {
    if (method.name) return method.name;

    let funcNameRegex = /function (.{1,})\(/,
      results = (funcNameRegex).exec(method.toString()),
      result = results && results.length > 1 && results[1];

    // Check to see custom implementation.
    if (!result) {
      funcNameRegex = /return _this.(.*);/;
      results = (funcNameRegex).exec(method.toString());
      result = results && results.length > 1 && results[1];
    }

    return result || '';
  }

  /**
   * Parse milliseconds to object or array with days, hours, minutes and seconds.
   *
   * @param {number} ms Milliseconds that should be parsed.
   * @param {boolean} [asArray=false] Return as an array.
   * @returns {(object|array)} Returns an object with d, h, m and s or an array with this values.
   */
  static parseTime(ms, asArray = false) {
    let time = {
      d: 0, // days
      h: 0, // hours
      m: 0, // minutes
      s: 0  // seconds
    };

    let seconds = ms / 1000;
    time.s = parseInt(seconds % 60);
    time.s = (time.s < 10) ? `0${time.s}` : time.s;

    let minutes = seconds / 60;
    time.m = parseInt(minutes % 60);
    time.m = (time.m < 10) ? `0${time.m}` : time.m;

    let hours = minutes / 60;
    time.h = parseInt(hours % 24);
    time.h = (time.h < 10) ? `0${time.h}` : time.h;

    let days = hours / 24;
    time.d = parseInt(days);

    if (!asArray) return time;

    return Object.keys(time).map(function (t) {
      return parseInt(time[t]);
    });
  }

  /**
   * Converts the data of the input object into correct types.
   *
   * @param {object} input The input object that should be parsed.
   * @returns {object} Returns the input object.
   */
  static parseInput(input) {
    for (let key in input) {
      if (!input.hasOwnProperty(key)) continue;

      let num = 0;

      if (/^\d+$/.test(input[key])) {
        num = input[key];
        input[key] = 0;
      }

      switch (input[key]) {
        case 'true':
        case 'false':
          input[key] = (input[key] === 'true');
          break;
        case 1:
        case 0:
          input[key] = parseInt(num);
          break;
        default:
      }
    }

    return input;
  }
}

module.exports = Parser;