/**
 * Import modules.
 */
const fs = require('fs');

/**
 * Import custom modules.
 */
const {Crawler} = require(`${__dirname}/lib/crawler`),
  {Output} = require(`${__dirname}/lib/output`),
  {ScreenShot} = require(`${__dirname}/lib/screenshot`),
  {DB} = require(`${__dirname}/lib/db`);

/**
 * Globals.
 */
let instance,
  configPath = `${__dirname}/config.json`;

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
  if (typeof logFileName === 'undefined') logFileName = this.output.logFileName;
  if (typeof options === 'string') {
    options = {startUrl: options};
  }

  this.databaseCheck();

  // Do not run multiple crawling processes.
  if (this.crawler.hasLockFile()) {
    return;
  }

  saveStartingUrl(options.startUrl, this);

  let self = this;
  setTimeout(function () {
    // Init the log.
    self.output.initLogger(logFileName);
    self.crawler.setOptions(options);
    self.crawler.init(options.startUrl);
    self.output.writeUserInput(self.crawler);

    if (typeof self.initCallback === 'function') {
      self.initCallback(self, options);
    } else {
      self.startCrawling(options);
    }
  }, 10000);
};

/**
 * Start the crawling process.
 *
 * @param options: {{}} Must contain "startUrl" as string.
 * @returns {Promise.<void>}
 */
WebCrawler.prototype.startCrawling = async function (options) {
  // The crawling process.
  let reason = await this.crawler.start(this.searchCallback);

  if (typeof options.screenShots !== 'undefined' && options.screenShots === 'true') {
    // Call the callbacks so the customer can do everything.
    if (typeof this.screenshotCallback === 'function') {
      await this.screenshotCallback(this.crawler.commands);
    }
  }

  if (typeof this.outputCallback === 'function') {
    await this.outputCallback(reason);
  }

  // End the crawling process.
  this.crawler.end();
};

/**
 * Set the callback for custom output.
 *
 * @param outputCallback: function
 */
WebCrawler.prototype.setOutputCallback = function (outputCallback) {
  if (typeof outputCallback === 'function') this.outputCallback = outputCallback;
};

/**
 * Set the callback for custom screenshots.
 *
 * @param screenshotCallback: function
 */
WebCrawler.prototype.setScreenshotCallback = function (screenshotCallback) {
  if (typeof screenshotCallback === 'function') this.screenshotCallback = screenshotCallback;
};

/**
 * Set the callback for search.
 *
 * @param searchCallback: function
 */
WebCrawler.prototype.setSearchCallback = function (searchCallback) {
  if (typeof searchCallback === 'function') this.searchCallback = searchCallback;
};

/**
 * Set the callback for initialize.
 *
 * @param initCallback: function
 */
WebCrawler.prototype.setInitCallback = function (initCallback) {
  if (typeof initCallback === 'function') this.initCallback = initCallback;
};

/**
 * Set the callback for search.
 *
 * @param pathToConfig: {string}
 * @param name: {string}
 */
WebCrawler.prototype.addConfig = function (pathToConfig, name) {
  setConfig(this, pathToConfig, name);
};

/**
 * Initialize external module to make it usable into WebCrawler.
 *
 * @param moduleName: {string}
 * @param path: {string}
 * @returns {*}
 */
WebCrawler.prototype.addModule = function (moduleName, path) {
  let Module = require(this.projectPath + path)[moduleName];
  this[moduleName] = new Module({output: this.output, db: this.db});
};

/**
 * Search for user configuration file to overwrite default configurations.
 */
WebCrawler.prototype.searchForConfig = function () {
  if (!fs.existsSync(`${this.projectPath}/web-crawler.json`)) {
    return;
  }

  setConfig(this, `${this.projectPath}/web-crawler.json`, 'project');
};

/**
 * Check for configurations for database to prevent fatal errors.
 */
WebCrawler.prototype.databaseCheck = function () {
  let isset = false;

  for (let name in this.config) {
    if (this.config.hasOwnProperty(name)) {
      if (typeof this.config[name] === 'object') {
        if (typeof this.config[name].db === 'object') {
          if (typeof this.config[name].db.connString === 'string') {
            isset = true;
          }
        }
      }
    }
  }

  if (!isset) {
    throw 'You have to define a mongodb connection string as "db": {"connString": "mongodb://"}';
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
  wc.projectPath = dir;
  wc.crawler = new Crawler(dir);
  wc.output = new Output(dir);
  wc.screenShot = new ScreenShot(dir);
  wc.db = new DB();
  wc.config = {};

  wc.initCallback = null;
  wc.searchCallback = null;
  wc.outputCallback = null;
  wc.screenshotCallback = null;

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

  if (typeof parameter !== 'string') parameter = 'default';

  wc.config[parameter] = require(filePath);
  for (let module in wc.config[parameter]) {
    if (wc.config[parameter].hasOwnProperty(module) && wc.hasOwnProperty(module)) {
      wc[module].setConfig(wc.config[parameter][module]);
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
  });
}