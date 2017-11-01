const fs = require('fs');

const {Crawler} = require(`${__dirname}/lib/crawler`),
  {Output} = require(`${__dirname}/lib/output`),
  {ScreenShot} = require(`${__dirname}/lib/screenshot`),
  {DB} = require(`${__dirname}/lib/db`);

let instance,
  configPath = `${__dirname}/config.json`;

let WebCrawler = function (options) {
  if (!(this instanceof WebCrawler)) return new WebCrawler(options);
  if (instance instanceof WebCrawler) return instance;
  if (typeof options === 'undefined') options = {};

  init(this, options);

  instance = this;

  return instance;
};

WebCrawler.prototype.crawl = async function (options, logFileName) {
  if (typeof logFileName === 'undefined') logFileName = this.output.logFileName;
  if (typeof options === 'string') {
    options = {startUrl: options};
  }

  if (this.crawler.hasLockFile()) {
    return;
  }

  this.output.initLogger(logFileName);

  this.crawler.setOptions(options);
  this.output.writeUserInput(this.crawler);
  let self = this,
    startUrlOpject = {url: options.startUrl};
  this.db.find(startUrlOpject, {_id: false}, 'starting_urls', function (error, result) {
    if (error) throw error;
    let newObject = Object.assign({}, startUrlOpject);
    newObject.updated = new Date();

    if (result.length > 0) {
      self.db.update(startUrlOpject, newObject, 'starting_urls', function (error, result) {
        if (error) throw error;
      });

      return;
    }

    self.db.insert(newObject, 'starting_urls', function (error, result) {
      if (error) throw error;
    });
  });

  let reason = await this.crawler.start(this.searchCallback);

  if (typeof this.screenshotCallback === 'function') {
    await this.screenshotCallback(this.crawler.commands);
  }

  if (typeof this.outputCallback === 'function') {
    await this.outputCallback(reason);
  }

  this.crawler.end();
};

WebCrawler.prototype.setOutputCallback = function (outputCallback) {
  this.outputCallback = outputCallback;
};

WebCrawler.prototype.setScreenshotCallback = function (screenshotCallback) {
  this.screenshotCallback = screenshotCallback;
};

WebCrawler.prototype.setSearchCallback = function (searchCallback) {
  this.searchCallback = searchCallback;
};

WebCrawler.prototype.addModule = function (module) {
  return new module({output: this.output, db: this.db});
};

WebCrawler.prototype.searchForConfig = function () {
  if (!fs.existsSync(`${this.projectPath}/web-crawler.json`)) {
    return;
  }

  setConfig(this, `${this.projectPath}/web-crawler.json`, 'userConfig');
};

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

function init(wc, options) {
  wc.dbh = null;

  for (let key in options) {
    if (options.hasOwnProperty(key)) {
      this[key] = options[key];
    }
  }

  wc.projectPath = fs.realpathSync('./');
  wc.crawler = new Crawler();
  wc.output = new Output();
  wc.screenShot = new ScreenShot();
  wc.db = new DB();

  setConfig(wc, configPath);
  wc.searchForConfig();

  wc.databaseCheck();
}

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