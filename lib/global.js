let instance = null;

class Global {
  constructor() {
    if (instance instanceof Global) return instance;
    if (!(this instanceof Global)) return new Global();
    instance = this;

    return this;
  }

  get(name) {
    return (typeof this[name] !== 'undefined') ? this[name] : null;
  }

  set(name, value) {
    this[name] = value;
  }
}

exports.Global = new Global();