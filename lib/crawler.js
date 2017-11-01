/**
 * Import modules.
 */
const fs = require('fs');

/**
 * Globals.
 */
let instance = {};

/**
 *
 * @returns {*}
 * @constructor
 */
let Crawler = function () {
  if (!(this instanceof Crawler)) return new Crawler();
  if (instance instanceof Crawler) return instance;

  init(this);

  instance = this;

  return this;
};

Crawler.prototype.setConfig = function (config) {
  if (typeof config !== 'object') {
    return;
  }

  for (let key in config) {
    if (config.hasOwnProperty(key)) {
      this.defaultArgs[key] = config[key];
      this[key] = config[key];

      if (this.commands.hasOwnProperty(key)) {
        this.commands[key] = this[key];
      }
    }
  }
};

Crawler.prototype.get = function (parameter) {
  if (typeof this[parameter] === 'undefined') return false;

  return this[parameter];
};

Crawler.prototype.setOptions = function (options) {
  for (let key in options) {
    if (options.hasOwnProperty(key) && this.commands.hasOwnProperty(key)) {
      this.commands[key] = options[key];
      this[key] = this.commands[key];
    }
  }
};

Crawler.prototype.start = async function () {
  for (let key in this.commands) {
    if (this.commands.hasOwnProperty(key)) {
      console.log(`Is command ${key} default? ${this.isDefault(key)}`);
    }
  }
};

/**
 * Set all arguments to default.
 */
Crawler.prototype.setDefault = function () {
  for (let key in this.defaultArgs) {
    if (this.defaultArgs.hasOwnProperty(key)) {
      this[key] = this.defaultArgs[key];
    }
  }
};

Crawler.prototype.isDefault = function (command) {
  if (!this.commands.hasOwnProperty(command)) {
    return false;
  }

  return (this.commands[command] === this.defaultArgs[command]);
};

/**
 * Creates lock file.
 */
Crawler.prototype.createLockFile = function () {
  fs.writeFileSync(this.lockFileName, new Date());
};

/**
 * Removes lock file.
 */
Crawler.prototype.removeLockFile = function () {
  fs.unlinkSync(this.lockFileName);
};

/**
 * Checks if lock file exists.
 */
Crawler.prototype.hasLockFile = function () {
  return fs.existsSync(this.lockFileName);
};

/**
 * Set necessary arguments.
 * @param c: {Crawler}
 */
function init(c) {
  c.defaultArgs = {};
  c.commands = {};
  c.startUrl = null;
  c.pageLimit = null;
  c.debug = null;
  c.screenshots = null;
  c.visited = null;
  c.numVisited = null;
  c.followingPages = null;
  c.url = null;
  c.baseUrl = null;
  c.linkList = null;
  c.errorList = null;
  c.customers = null;
  c.startTime = null;
  c.lockFileName = null;
}

exports.Crawler = Crawler;