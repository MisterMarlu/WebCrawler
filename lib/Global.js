let instance = null;

/**
 * This class stores all global things like functions, objects, arrays etc.
 *
 * @returns {Global} Returns the Global instance.
 */
class Global {

  /**
   * @see Global.
   */
  constructor() {
    // The class Global is a singleton class.
    if (instance instanceof Global) return instance;
    if (!(this instanceof Global)) return new Global();

    instance = this;
    return this;
  }

  /**
   * Get any parameter.
   *
   * @param {string} name The name of the parameter
   * @returns {*|null} Returns the value of the parameter or null.
   */
  get(name) {
    return (typeof this[name] !== 'undefined') ? this[name] : null;
  }

  /**
   * Set any parameter.
   *
   * @param {string} name The name of a parameter.
   * @param {*} value The value of the parameter.
   */
  set(name, value) {
    this[name] = value;
  }
}

exports.Global = new Global();