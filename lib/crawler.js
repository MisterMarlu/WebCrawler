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
  URL = require('url-parse'),
  axios = require('axios'),
  cheerio = require('cheerio');

/**
 * Import custom modules.
 */
const {DB} = require(`${__dirname}/db`),
  {Output} = require(`${__dirname}/output`),
  {parseTime} = require(`${__dirname}/parser`),
  {isDebug} = require(`${__dirname}/parser`),
  {Global} = require(`${__dirname}/global`);

/**
 * Globals.
 */
let instance = {},
  moduleName = 'Crawler';

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
      this[key] = config[key];
    }
  }
};

/**
 * Start crawling with some necessary settings.
 *
 * @returns {Promise.<*>}
 */
Crawler.prototype.start = async function () {
  this.output.writeConsole(`Crawler.start - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  // Do not run multiple crawl processes.
  if (this.hasLockFile()) return;

  this.url = new URL(Global.get('START_URL'));
  this.baseUrl = `${this.url.protocol}//${this.url.hostname}`;

  Global.get('followingPages').push(Global.get('START_URL'));
  this.createLockFile();

  // Start timer and begin the crawling process.
  this.startTime = new Date();
  return await this.crawl();
};

/**
 * Finish the crawling process.
 */
Crawler.prototype.end = function () {
  this.output.writeConsole(`Crawler.end - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  let self = this,
    finishDelay = parseInt(this.numVisited / 2);

  finishDelay = (finishDelay < 5000) ? 5000 : finishDelay;

  setTimeout(function () {
    self.output.writeUserInput(self);
    self.getReadableTime();
    self.output.logger.end();
    self.removeLockFile();
  }, finishDelay);
};

/**
 * Try to visit next page. If limit reached or no more websites available, leave the process.
 *
 * @returns {Promise.<*>}
 */
Crawler.prototype.crawl = async function () {
  this.output.writeConsole(`Crawler.crawl - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  // Page limit is reached, leave process.
  if (this.numVisited >= Global.get('PAGE_LIMIT') && Global.get('PAGE_LIMIT') !== 0) return 'page limit';

  let nextPage = Global.get('followingPages').pop();

  // Website already visited, continue with next.
  if (nextPage in this.visited) {
    this.output.write(`Url ${nextPage} already visited.`, isDebug(Global.get('DEBUG'), moduleName));
    return await this.crawl();
  }

  // No more websites available, leave process.
  if (typeof nextPage === 'undefined') return 'last page';

  return await this.visitPage(nextPage);
};

/**
 * Visit website to let the customer search something.
 *
 * @param url: {string} Current visiting website.
 * @returns {Promise.<*>}
 */
Crawler.prototype.visitPage = async function (url) {
  this.output.writeConsole(`Crawler.visitPage - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  let self = this;
  this.increaseVisited(url);

  this.output.writeLine(`Visiting page ${url}`, isDebug(Global.get('DEBUG'), moduleName));
  this.output.write(`Visited pages: ${this.numVisited}`, true);

  // Make the request.
  await axios.get(url)
    .then(async function (response) {
      self.output.write(`Status: ${response.status}`, isDebug(Global.get('DEBUG'), moduleName));

      if (response.status !== 200) return self.crawl();

      let $ = cheerio.load(response.data);

      // Call the search callback function so the customer can do everything he want.
      if (typeof Global.get('searchCallback') === 'function') {
        await Global.get('searchCallback')($, url, isDebug(Global.get('DEBUG'), moduleName));
      }

      // Find all links to collect the next links to visit.
      await self.collectLinks($);
    })
    .catch(function (error) {
      self.output.writeLine(`Error on url ${url}`, true, 'warning');

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

        if (isDebug(Global.get('DEBUG'), moduleName)) console.log(error);
      }
    });

  // Crawl next website.
  return this.crawl();
};

/**
 * Increase visited page counter.
 *
 * @param url: {string}
 */
Crawler.prototype.increaseVisited = function (url) {
  this.output.writeConsole(`Crawler.increaseVisited - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  this.visited[url] = true;
  this.numVisited += 1;

  // Update starting url.
  let oldObject = {url: Global.get('START_URL')},
    newObject = {url: Global.get('START_URL'), num_visited: this.numVisited};
  this.DB.save(oldObject, newObject, 'starting_urls', function (error, result) {
    if (error) throw error;
  });
};

/**
 * Collect all (relative) links.
 *
 * @param $
 */
Crawler.prototype.collectLinks = async function ($) {
  this.output.writeConsole(`Crawler.collectLinks - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), 'Links'), 'debug');
  let self = this,
    links = $("a[href^='/']"),
    abLinks = $("a[href^='http']"),
    count = 0,
    countAbLinks = 0;

  // Add links to link list.
  await links.each(function () {
    if (self.collectRelativeLinks($(this).attr('href'))) count += 1;
  });

  await abLinks.each(function () {
    let href = $(this).attr('href');

    if (href.includes(self.baseUrl)) {
      if (self.linkList['typeRelative'].indexOf(href) === -1) {
        self.linkList['typeRelative'].push(href);
        Global.get('followingPages').push(href);
        countAbLinks += 1;
      }
    }
  });

  this.output.write(`Relative links: ${count}`, isDebug(Global.get('DEBUG'), moduleName));
  this.output.write(`Absolute links: ${countAbLinks}`, isDebug(Global.get('DEBUG'), moduleName));
};

/**
 * Split relative from shorted absolute links (e.g. "/google.com").
 *
 * @param link: {string}
 * @returns {boolean}
 */
Crawler.prototype.collectRelativeLinks = function (link) {
  this.output.writeConsole(`Crawler.collectRelativeLinks - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), 'Links'), 'debug');
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

      if (linkType === 'typeRelative') Global.get('followingPages').push(tmpUrl);
    }
  }

  return (linkType === 'typeRelative');
};

/**
 * Check if command is default.
 *
 * @param command: {string} Key of the command (e.g. "pageLimit")
 * @returns {boolean}
 */
Crawler.prototype.isDefault = function (command) {
  this.output.writeConsole(`Crawler.isDefault - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  if (!Global.get('input').hasOwnProperty(command)) return false;

  return (Global.get('input')[command] === Global.get('input').default[command]);
};

/**
 * Stops execution - and print readable time.
 */
Crawler.prototype.getReadableTime = function () {
  this.output.writeConsole(`Crawler.getReadableTime - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  let ms = new Date() - this.startTime,
    time = parseTime(ms),
    timeString = `${time.d} days, ${time.h}:${time.m}:${time.s}`;

  this.output.write(timeString, true, 'success');
  this.output.writeLine(`Stopped at: ${new Date()}`, true, 'success');
};

/**
 * Creates lock file.
 */
Crawler.prototype.createLockFile = function () {
  this.output.writeConsole(`Crawler.createLockFile - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  // Update starting url.
  let oldObject = {url: Global.get('START_URL')},
    newObject = {
      url: Global.get('START_URL'),
      active: true
    };

  this.DB.save(oldObject, newObject, 'starting_urls', function (error, result) {
    if (error) throw error;
  });

  fs.writeFileSync(`${Global.get('projectPath')}/${this.lockFileName}`, new Date());
};

/**
 * Removes lock file.
 */
Crawler.prototype.removeLockFile = function () {
  this.output.writeConsole(`Crawler.removeLockFile - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  fs.unlinkSync(`${Global.get('projectPath')}/${this.lockFileName}`);

  // Update starting url.
  let oldObject = {url: Global.get('START_URL')},
    newObject = {
      url: Global.get('START_URL'),
      active: false
    };

  this.DB.save(oldObject, newObject, 'starting_urls', function (error, result) {
    if (error) throw error;
  });
};

/**
 * Checks if lock file exists.
 */
Crawler.prototype.hasLockFile = function () {
  this.output.writeConsole(`Crawler.hasLockFile - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  return fs.existsSync(`${Global.get('projectPath')}/${this.lockFileName}`);
};

/**
 * Initialize Crawler.
 *
 * @param c: {Crawler}
 */
function init(c) {
  c.defaultArgs = {};
  c.visited = {};
  c.numVisited = 0;
  Global.set('followingPages', []);
  c.url = {};
  c.baseUrl = '';
  c.linkList = {};
  c.errorList = {};
  c.startTime = new Date();
  c.lockFileName = '';
  c.output = new Output();
  c.DB = new DB();
}

exports.Crawler = Crawler;