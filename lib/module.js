class Module {
  constructor(options) {
    for (let key in options) {
      if (options.hasOwnProperty(key)) this[key] = options[key];
    }

    return this;
  }

  setLocalConfig(config) {
    if (typeof config !== 'object') return;

    for (let key in config) {
      if (config.hasOwnProperty(key)) {
        this[key] = config[key];
      }
    }
  }
}

exports.Module = Module;