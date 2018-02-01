let instance = null;

/**
 * Class Global.
 */
class Global {

  /**
   * Global constructor.
   *
   * @returns {*}
   */
  constructor() {
    if (instance instanceof Global) return instance;
    if (!(this instanceof Global)) return new Global();
    instance = this;

    return this;
  }

  /**
   * Get any parameter.
   *
   * @param name: String
   * @returns {*|null}
   */
  get(name) {
    return (typeof this[name] !== 'undefined') ? this[name] : null;
  }

  /**
   * Set any parameter.
   *
   * @param name: String
   * @param value: {*}
   */
  set(name, value) {
    this[name] = value;
  }
}

exports.Global = new Global();