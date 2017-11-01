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

WebCrawler.prototype.crawl = async function (options) {
  if (typeof options === 'string') {
    options = {startUrl: options};
  }

  this.output.initLogger();

  this.crawler.setOptions(options);
  await this.crawler.start();
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