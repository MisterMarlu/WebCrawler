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
 * Prepare and start the crawling process.
 *
 * @param options Can be type of object or string.
 * @param logFileName?: {string}
 * @returns {Promise.<void>}
 */
WebCrawler.prototype.crawl = async function (options, logFileName) {
  if (typeof logFileName === 'undefined') logFileName = this.output.logFileName;
  if (typeof options === 'string') {
    options = {startUrl: options};
  }

  // Do not run multiple crawling processes.
  if (this.crawler.hasLockFile()) {
    return;
  }

  // Init the log.
  this.output.initLogger(logFileName);
  this.crawler.setOptions(options);
  this.output.writeUserInput(this.crawler);

  // The crawling process.
  let reason = await this.crawler.start(this.searchCallback),
    delay = 0;

  if (typeof options.screenShot !== 'undefined' && options.screenShot === 'true') {
    // Call the callbacks so the customer can do everything.
    if (typeof this.screenshotCallback === 'function') {
      delay = await this.screenshotCallback(this.crawler.commands);
    }
  }

  if (typeof this.outputCallback === 'function') {
    delay += await this.outputCallback(reason);
  }

  // End the crawling process.
  this.crawler.end(delay);
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

  setConfig(this, `${this.projectPath}/web-crawler.json`, 'userConfig');
};

/**
 * Check for configurations for database to prevent fatal errors.
 */
WebCrawler.prototype.databaseCheck = function () {
  if (typeof this.dbh === 'undefined' || this.dbh === null) {
    if (typeof this.userConfig === 'undefined'
      || typeof this.userConfig.db === 'undefined'
      || typeof this.userConfig.db.connString === 'undefined') {
      throw 'You have to define a mongodb connection string as "dbh" or as "db": {"connString"}';
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
  wc.dbh = null;

  wc.projectPath = dir;
  wc.crawler = new Crawler();
  wc.output = new Output();
  wc.screenShot = new ScreenShot();
  wc.db = new DB();

  setConfig(wc, configPath);
  wc.searchForConfig();

  wc.databaseCheck();
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

  if (typeof parameter !== 'string') parameter = 'config';

  wc[parameter] = require(filePath);
  wc.crawler.setConfig(wc[parameter].crawler);
  wc.output.setConfig(wc[parameter].output);
  wc.screenShot.setConfig(wc[parameter].screenShot);
  wc.db.setConfig(wc[parameter].db);
}