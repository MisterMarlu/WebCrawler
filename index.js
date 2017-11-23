if (typeof __stack === 'undefined') {
  /**
   * Define __stack for __line.
   */
  Object.defineProperty(global, '__stack', {
    get: function () {
      let orig = Error.prepareStackTrace;
      Error.prepareStackTrace = function (_, stack) {
        return stack;
      };
      let err = new Error;
      Error.captureStackTrace(err, arguments.callee);
      let stack = err.stack;
      Error.prepareStackTrace = orig;
      return stack;
    }
  });

  if (typeof __line === 'undefined') {
    /**
     * Define __line for debugging.
     */
    Object.defineProperty(global, '__line', {
      get: function () {
        return __stack[1].getLineNumber();
      }
    });
  }
}

/**
 * Import modules.
 */
const fs = require('fs'),
  {MongoClient} = require('mongodb');

/**
 * Import custom modules.
 */
const {Crawler} = require(`${__dirname}/lib/crawler`),
  {Output} = require(`${__dirname}/lib/output`),
  {ScreenShot} = require(`${__dirname}/lib/screenshot`),
  {DB} = require(`${__dirname}/lib/db`),
  {Global} = require(`${__dirname}/lib/global`),
  {parseInput} = require(`${__dirname}/lib/parser`),
  {isDebug} = require(`${__dirname}/lib/parser`);

/**
 * Globals.
 */
let instance,
  configPath = `${__dirname}/config.json`,
  moduleName = 'WebCrawler';

/**
 * WebCrawler constructor.
 *
 * @param dir Project directory path.
 * @returns {*}
 * @constructor
 */
let WebCrawler = function (dir) {
  if (!(this instanceof WebCrawler)) return new WebCrawler(dir);
  if (instance instanceof WebCrawler) return instance;

  init(this, dir);
  instance = this;

  return instance;
};

/**
 * Prepare the crawling process.
 *
 * @param options Can be type of object or string.
 * @param logFileName?: {string}
 * @returns {Promise.<void>}
 */
WebCrawler.prototype.crawl = function (options, logFileName) {
  this.output.writeConsole(`WebCrawler.crawl - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  if (typeof logFileName === 'undefined') logFileName = this.output.logFileName;
  if (typeof options === 'string') options = {startUrl: options};

  setInput(options);

  this.databaseCheck();

  let self = this;
  MongoClient.connect(this.connString, function (error, db) {
    if (error) throw error;

    self.db.setConnection(db);

    // Do not run multiple crawling processes.
    if (self.crawler.hasLockFile()) {
      db.close();

      return;
    }

    saveStartingUrl(Global.get('START_URL'), self);

    setTimeout(function () {
      // Init the log.
      self.output.initLogger(logFileName);
      self.output.writeUserInput(self.crawler);
      self.screenShot.init();

      if (typeof Global.get('initCallback') === 'function') {
        Global.get('initCallback')(self, Global.get('input'));
        return;
      }

      self.startCrawling();
    }, 10000);
  });
};

/**
 * Start the crawling process.
 *
 * @returns {Promise.<void>}
 */
WebCrawler.prototype.startCrawling = async function () {
  this.output.writeConsole(`WebCrawler.startCrawling - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  // The crawling process.
  let reason = await this.crawler.start();

  if (typeof Global.get('input').screenShots !== 'undefined' && Global.get('input').screenShots) {
    // Call the callbacks so the customer can do everything.
    if (typeof Global.get('screenshotCallback') === 'function') {
      await Global.get('screenshotCallback')(Global.get('input'));
    }
  }

  if (typeof Global.get('outputCallback') === 'function') {
    await Global.get('outputCallback')(reason);
  }

  // End the crawling process after killing all chrome processes.
  this.screenShot.stopChrome(this.crawler.end());
};

/**
 * Set the callback for custom output.
 *
 * @param outputCallback: {function}
 */
WebCrawler.prototype.setOutputCallback = function (outputCallback) {
  this.output.writeConsole(`WebCrawler.setOutputCallback - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  if (typeof outputCallback === 'function') Global.set('outputCallback', outputCallback);
};

/**
 * Set the callback for custom screenshots.
 *
 * @param screenshotCallback: {function}
 */
WebCrawler.prototype.setScreenshotCallback = function (screenshotCallback) {
  this.output.writeConsole(`WebCrawler.setScreenshotCallback - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  if (typeof screenshotCallback === 'function') Global.set('screenshotCallback', screenshotCallback);
};

/**
 * Set the callback for search.
 *
 * @param searchCallback: {function}
 */
WebCrawler.prototype.setSearchCallback = function (searchCallback) {
  this.output.writeConsole(`WebCrawler.setSearchCallback - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  if (typeof searchCallback === 'function') Global.set('searchCallback', searchCallback);
};

/**
 * Set the callback for initialize.
 *
 * @param initCallback: {function}
 */
WebCrawler.prototype.setInitCallback = function (initCallback) {
  this.output.writeConsole(`WebCrawler.setInitCallback - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  if (typeof initCallback === 'function') Global.set('initCallback', initCallback);
};

/**
 * Set the callback for search.
 *
 * @param pathToConfig: {string}
 * @param name: {string}
 */
WebCrawler.prototype.addConfig = function (pathToConfig, name) {
  this.output.writeConsole(`WebCrawler.addConfig - File: ${__filename} - Line: ${__line}`, Global.get('DEBUG'), 'debug');
  setConfig(this, pathToConfig, name);
};

/**
 * Initialize external module to make it usable into WebCrawler.
 *
 * @param moduleName: {string}
 * @param path: {string}
 */
WebCrawler.prototype.addModule = function (moduleName, path) {
  this.output.writeConsole(`WebCrawler.addModule - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  let Module = require(Global.get('projectPath') + path)[moduleName];
  this[moduleName] = new Module({output: this.output, db: this.db});
};

/**
 * Search for user configuration file to overwrite default configurations.
 */
WebCrawler.prototype.searchForConfig = function () {
  this.output.writeConsole(`WebCrawler.searchForConfig - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  if (fs.existsSync(`${Global.get('projectPath')}/web-crawler.json`)) {
    setConfig(this, `${Global.get('projectPath')}/web-crawler.json`, 'project');
  }
};

/**
 * Check for configurations for database to prevent fatal errors.
 */
WebCrawler.prototype.databaseCheck = function () {
  this.output.writeConsole(`WebCrawler.databaseCheck - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  let isSet = false;

  for (let name in Global.get('config')) {
    if (Global.get('config').hasOwnProperty(name)) {
      if (typeof Global.get('config')[name] === 'object') {
        if (typeof Global.get('config')[name].default === 'object') {
          if (typeof Global.get('config')[name].default.connString === 'string') {
            isSet = true;
          }
        }
      }
    }
  }

  if (!isSet) {
    throw 'You have to define a mongodb connection string as "default": {"connString": "mongodb://"}';
  }
};

/**
 * Set configurations.
 *
 * @param config: {{}} Object of configurations.
 */
WebCrawler.prototype.setConfig = function (config) {
  if (typeof config !== 'object') {
    return;
  }

  for (let key in config) {
    if (config.hasOwnProperty(key)) {
      this[key] = config[key];
    }
  }
};

exports.WebCrawler = WebCrawler;

/**
 * Initialize WebCrawler.
 *
 * @param wc: {WebCrawler}
 * @param dir: {string}
 */
function init(wc, dir) {
  Global.set('projectPath', dir);
  Global.set('config', {});
  wc.crawler = new Crawler();
  wc.output = new Output();
  wc.screenShot = new ScreenShot();
  wc.db = new DB();
  wc.connString = '';


  setConfig(wc, configPath);
  wc.searchForConfig();
}

/**
 * Set configurations from config files.
 *
 * @param wc: {WebCrawler}
 * @param filePath: {string}
 * @param parameter?: {string}
 */
function setConfig(wc, filePath, parameter) {
  if (!fs.existsSync(filePath)) {
    console.log(`Error: File ${filePath} doesn't exists.`);
    return;
  }

  if (typeof parameter !== 'string') parameter = moduleName;

  Global.get('config')[parameter] = require(filePath);
  for (let module in Global.get('config')[parameter]) {
    if (module === 'default') {
      if (Global.get('config')[parameter].hasOwnProperty(module)) {
        wc.setConfig(Global.get('config')[parameter][module]);
      }
      continue;
    }

    if (Global.get('config')[parameter].hasOwnProperty(module) && wc.hasOwnProperty(module)) {
      wc[module].setConfig(Global.get('config')[parameter][module]);
    }
  }
}

/**
 * Save the starting url.
 *
 * @param url: {string}
 * @param wc: {WebCrawler}
 */
function saveStartingUrl(url, wc) {
  wc.db.save({url: url}, {url: url, active: true}, 'starting_urls', function (error, result) {
    if (error) throw error;

    wc.db.findOne({url: url}, {}, 'startings_urls', function (error, starting) {
      Global.set('starting', starting);
    });
  });
}

/**
 * Set default and user input.
 *
 * @param options: {{}} Object of input parameters.
 */
function setInput(options) {
  let input = {
      startUrl: 'https://www.phpdoc.org/',
      pageLimit: 0,
      debug: false,
      screenShots: false,
    },
    userInput = {
      default: input,
    };

  for (let key in input) {
    if (input.hasOwnProperty(key)) {
      userInput[key] = input[key];

      if (options.hasOwnProperty(key)) {
        userInput[key] = options[key];
      }
    }
  }

  userInput = parseInput(userInput);
  userInput.default = input;

  Global.set('input', userInput);
  Global.set('START_URL', userInput.startUrl);
  Global.set('PAGE_LIMIT', userInput.pageLimit);
  Global.set('DEBUG', userInput.debug);
  Global.set('SCREENSHOTS', userInput.screenShots);
}