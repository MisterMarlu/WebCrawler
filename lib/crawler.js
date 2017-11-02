/**
 * Import modules.
 */
const fs = require('fs'),
  URL = require('url-parse'),
  axios = require('axios'),
  cheerio = require('cheerio');

/**
 * Import custom modules.
 */
const {DB} = require(`${__dirname}/db`),
  {Output} = require(`${__dirname}/output`),
  {parseTime} = require(`${__dirname}/parser`);

/**
 * Globals.
 */
let instance = {};

/**
 * Crawler constructor.
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

/**
 * Set configurations.
 *
 * @param config: {{}} Object of configurations.
 */
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

/**
 * Get any parameter from crawler instance.
 *
 * @param parameter
 * @returns {*}
 */
Crawler.prototype.get = function (parameter) {
  if (typeof this[parameter] === 'undefined') return false;

  return this[parameter];
};

/**
 * Set crawling options.
 *
 * @param options: {{}}
 */
Crawler.prototype.setOptions = function (options) {
  for (let key in this.commands) {
    if (this.commands.hasOwnProperty(key)) {
      if (options.hasOwnProperty(key)) {
        this.commands[key] = options[key];
      }

      let num = 0;
      if (/^\d+$/.test(this.commands[key])) {
        num = this.commands[key];
        this.commands[key] = 0;
      }

      switch (this.commands[key]) {
        case 'true':
        case 'false':
          this[key] = (this.commands[key] === 'true');
          break;
        case 0:
          this[key] = parseInt(num);
          this.commands[key] = num;
          break;
        default:
          this[key] = this.commands[key];
      }
    }
  }
};

/**
 * Start crawling with some necessary settings.
 *
 * @param searchCallback: function
 * @returns {Promise.<*>}
 */
Crawler.prototype.start = async function (searchCallback) {
  // Do not run multiple crawl processes.
  if (this.hasLockFile()) {
    return;
  }

  this.createLockFile();

  this.DB = new DB();
  this.output = new Output();
  this.url = new URL(this.startUrl);
  this.baseUrl = `${this.url.protocol}//${this.url.hostname}`;
  this.followingPages.push(this.startUrl);

  // Save starting url.
  let oldObject = {url: this.startUrl},
    structure = {_id: false},
    newObject = {url: this.startUrl, updated: new Date()};
  this.DB.save(oldObject, structure, newObject, 'starting_urls', function (error, result) {
    if (error) throw error;
  });

  // Start timer and begin the crawling process.
  this.startTime = new Date();
  return await this.crawl(searchCallback);
};

/**
 * Finish the crawling process.
 *
 * @param delay?: {int}
 */
Crawler.prototype.end = function (delay) {
  if (typeof delay === 'undefined' || delay < 0) delay = 0;

  let self = this,
    finishDelay = parseInt(this.numVisited / 2);

  finishDelay = (finishDelay < 500) ? 500 : finishDelay;

  setTimeout(function () {
    self.output.writeUserInput(self);
    self.getReadableTime(finishDelay + delay);
    self.output.logger.end();
    self.removeLockFile();
  }, finishDelay);
};

/**
 * Try to visit next page. If limit reached or no more websites available, leave the process.
 *
 * @param callback: function
 * @returns {Promise.<*>}
 */
Crawler.prototype.crawl = async function (callback) {
  // Page limit is reached, leave the process.
  if (this.numVisited >= this.pageLimit && this.pageLimit !== 0) {
    return 'page limit';
  }

  let nextPage = this.followingPages.pop();

  // Website already visited, continue with next.
  if (nextPage in this.visited) {
    this.output.write(`Url ${nextPage} already visited.`, this.debug);
    return await this.crawl(callback);
  }

  // No more websites available, leave process.
  if (typeof nextPage === 'undefined') {
    return 'last page';
  }

  return await this.visitPage(nextPage, callback);
};

/**
 * Visit website to let the customer search some thing.
 *
 * @param url: {string} Current visiting website.
 * @param callback: function
 * @returns {Promise.<*>}
 */
Crawler.prototype.visitPage = async function (url, callback) {
  let self = this;
  this.visited[url] = true;
  this.numVisited += 1;

  this.output.writeLine(`Visiting page ${url}`, this.debug);
  this.output.write(`Visited pages: ${this.numVisited}`, true);

  // Make the request.
  await axios.get(url)
    .then(async function (response) {
      self.output.write(`Url: ${url}`, self.debug);
      self.output.write(`Status: ${response.status}`, self.debug);

      if (response.status !== 200) {
        return self.crawl(callback);
      }

      let $ = cheerio.load(response.data);

      // Call the callback function so the customer can do everything he want.
      await callback($, url, self.debug);

      // Find all links to collect the next links t visit.
      await self.collectLinks($);
    })
    .catch(function (error) {
      self.output.writeLine(`Error on url ${url}`, true, 'warning');
      self.output.write(`Url: ${url}`, self.debug);

      if (typeof error.response !== 'undefined') {
        self.output.write(`Status: ${error.response.status}`, true, 'warning');
        self.output.writeWithSpace(`Status text: ${error.response.statusText}`, true, 'warning');

        if (typeof self.errorList[error.response.status] === 'undefined') {
          self.errorList[error.response.status] = [];
        }

        self.errorList[error.response.status].push(url);
      } else {
        // Oh no, something went wrong in the code :(
        self.output.write('Request was sent with no response.', true, 'error');

        if (self.debug) {
          console.log(error);
        }
      }
    });

  // Crawl next website.
  return this.crawl(callback);
};

/**
 * Collect all (relative) links.
 *
 * @param $
 */
Crawler.prototype.collectLinks = async function ($) {
  let self = this,
    links = $("a[href^='/']"),
    count = 0;

  // Add links to link list.
  await links.each(function () {
    let href = $(this).attr('href'),
      oldObject = {starting_url: self.startUrl, url: href, type: 'relative'},
      structure = {_id: false, type: false, updated: false},
      newObject = {starting_url: self.startUrl, url: href, type: 'relative', updated: new Date()};

    if (self.collectRelativeLinks(href)) {
      self.DB.save(oldObject, structure, newObject, 'found_urls', function (error, result) {
        if (error) throw error;
      });
      count += 1;
    }
  });

  this.output.write(`Relative links: ${count.relative}`, this.debug);
};

/**
 * Split relative from shorted absolute links (e.g. "/google.com").
 *
 * @param link: {string}
 * @returns {boolean}
 */
Crawler.prototype.collectRelativeLinks = function (link) {
  let linkArray = link.split('/');

  for (let i = 0; i < link.length;) {
    if (linkArray[0] === '') {
      linkArray.shift();
    } else {
      i += 1;
    }
  }

  let linkType = 'typeRelative';

  if (linkArray.length === 0 || linkArray[0].indexOf('.') > -1) linkType = 'typeAbsolute';

  link = linkArray.join('/');

  let tmpUrlRel = this.baseUrl + '/' + link,
    tmpUrlAbs = this.url.protocol + '//' + link,
    tmpUrl = (linkType === 'typeRelative') ? tmpUrlRel : tmpUrlAbs;

  if (link.length > 0) {
    if (this.linkList[linkType].indexOf(tmpUrl) === -1) {
      this.linkList[linkType].push(tmpUrl);

      if (linkType === 'typeRelative') {
        this.followingPages.push(tmpUrl);
      }
    }
  }

  return (linkType === 'typeRelative');
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

/**
 * Check if command is default.
 *
 * @param command: {string} Key of the command (e.g. "pageLimit")
 * @returns {boolean}
 */
Crawler.prototype.isDefault = function (command) {
  if (!this.commands.hasOwnProperty(command)) {
    return false;
  }

  return (this.commands[command] === this.defaultArgs[command]);
};

/**
 * Stops execution time and print readable time.
 *
 * @param delay?: {int}
 */
Crawler.prototype.getReadableTime = function (delay) {
  if (typeof delay === 'undefined') {
    delay = 2000;
  }

  delay = (delay < 2000) ? 2000 : delay;
  delay /= 1000;

  let ratio = {
      success: {
        pages: 100,
        seconds: 15
      },
      warning: {
        pages: 100,
        seconds: 30
      }
    },
    ms = new Date() - this.startTime,
    timeColor = '',
    expectations = [];

  if (this.numVisited !== 0) {
    timeColor = 'error';
    for (let type in ratio) {
      if (ratio.hasOwnProperty(type)) {
        let exSeconds = (this.numVisited / 100 * ratio[type].seconds); // Get seconds from ratio.
        exSeconds *= 1.25; // Add tolerance.
        exSeconds += delay; // Add delay.
        expectations[expectations.length] = parseInt(exSeconds);
        let tmpUsedSeconds = parseInt(ms / 1000);

        if (tmpUsedSeconds <= expectations[(expectations.length - 1)]) {
          timeColor = type;
          break;
        }
      }
    }
  }

  let time = parseTime(ms),
    timeString = `${time.d} days, ${time.h}:${time.m}:${time.s}`;

  this.output.write(timeString, true, timeColor);

  if (expectations.length > 0) {
    let etn = parseTime((expectations[(expectations.length - 1)] * 1000)),
      etnString = `(Expected: ${etn.d} days, ${etn.h}:${etn.m}:${etn.s})`;
    this.output.write(etnString, true, 'comment');

    if (expectations.length > 1) {
      let etb = parseTime((expectations[0] * 1000)),
        etbString = `(Expected: ${etb.d} days, ${etb.h}:${etb.m}:${etb.s})`;
      this.output.write(etbString, true, 'comment');
    }
  }
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
 * Initialize Crawler.
 *
 * @param c: {Crawler}
 */
function init(c) {
  c.defaultArgs = {};
  c.commands = {};
  c.startUrl = null;
  c.pageLimit = null;
  c.debug = null;
  c.screenShots = null;
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