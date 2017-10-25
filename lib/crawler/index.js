/**
 * Import modules.
 */
const cheerio = require('cheerio');
const axios = require('axios');
const URL = require('url-parse');

/**
 * Import custom modules.
 */
const Output = require('../output').Output;
const Search = require('../search').Search;
const Screenshot = require('../screenshot').Screenshot;

/**
 * Necessary variables.
 */
let output = new Output(),
  search = new Search('sex-anzeigen'),
  screenshot = new Screenshot(),
  instance = {};

/**
 * Crawler constructor.
 *
 * @param commands: {{}}
 * @returns {Crawler}
 * @constructor
 */
let Crawler = function (commands) {
  if (!this instanceof Crawler) return new Crawler(commands);
  if (instance instanceof Crawler) return instance;

  this.init(commands);
  instance = this;

  return this;
};

/**
 * Initialize all parameters to be ready for crawling.
 *
 * @param commands: {}
 * @returns {Crawler}
 */
Crawler.prototype.init = function (commands) {
  let imports = ['./arguments', './output'];

  for (let i = 0; i < imports.length; i += 1) {
    let tmp = require(imports[i]);
    for (let key in tmp) {
      if (tmp.hasOwnProperty(key)) {
        this[key] = tmp[key];
      }
    }
  }

  let startUrl = commands.startUrl || this.startUrl,
    pageLimit = commands.pageLimit || this.pageLimit,
    debug = commands.debug || this.debug,
    screenshots = commands.screenshots || this.screenshots;

  this.commands = {
    startUrl: commands.startUrl || startUrl,
    pageLimit: commands.pageLimit || pageLimit,
    debug: commands.debug || debug,
    screenshots: commands.screenshots || screenshots
  };

  this.startUrl = startUrl;
  this.pageLimit = parseInt(pageLimit);
  this.debug = (debug === 'true');
  this.screenshots = (screenshots === 'true');

  this.url = new URL(this.startUrl);
  this.baseUrl = this.url.protocol + '//' + this.url.hostname;

  this.followingPages.push(this.startUrl);
  this.startTime = new Date();

  return this;
};

/**
 * Starts crawling. When crawler is already crawling prevent.
 *
 * @returns {Promise.<void>}
 */
Crawler.prototype.start = async function () {
  if (this.hasLockFile()) {
    return;
  }

  this.createLockFile();

  try {
    output.initLogger('crawling-1');
    this.getUserInput();
    await this.crawl();
  } catch (error) {
    throw error;
  }
};

/**
 * Get next page or end crawling.
 *
 * @returns {Promise.<void>}
 */
Crawler.prototype.crawl = async function () {
  // Reached limit to visit websites.
  if (this.numVisited >= this.pageLimit && this.pageLimit !== 0) {
    this.endCrawling('pageLimit');
    return;
  }

  let nextPage = this.followingPages.pop();

  // Already visited this website, try next.
  if (nextPage in this.visited) {
    output.write(`Url ${nextPage} already visited.`, this.debug);
    this.crawl();
    return;
  }

  // No more websites available.
  if (typeof nextPage === 'undefined') {
    this.endCrawling('lastPage');
    return;
  }

  // Visit website.
  await this.visitPage(nextPage);
};

/**
 * Visit website.
 *
 * @param url: {string}
 * @returns {Promise.<void>}
 */
Crawler.prototype.visitPage = async function (url) {
  let self = this;
  self.visited[url] = true;
  self.numVisited += 1;

  output.writeLine(`Visiting page ${url}`, self.debug);
  output.write(`Visited pages: ${self.numVisited}`, true);

  // Make the request.
  axios.get(url)
    .then(async function (response) {
      output.write(`Url: ${url}`, self.debug);
      output.write(`Status: ${response.status}`, self.debug);

      if (response.status !== 200) {
        self.crawl();
        return;
      }

      let $ = cheerio.load(response.data);

      // Check for customer website.
      if (search.canHaveWebsite(url)) {
        await search.setCustomer(url, $, self.customers, self.startUrl, self.debug);
      }

      self.collectLinks($);

      // Crawl next website.
      self.crawl();
    }).catch(function (error) {
    output.writeLine(`Error on url ${url}`, true, 'warning');
    output.write(`Url: ${url}`, self.debug);

    if (typeof error.response !== 'undefined') {
      output.write(`Status: ${error.response.status}`, true, 'warning');
      output.writeWithSpace(`Status text: ${error.response.statusText}`, true, 'warning');

      if (typeof self.errorList[error.response.status] === 'undefined') {
        self.errorList[error.response.status] = [];
      }

      self.errorList[error.response.status].push(url);
    } else {
      output.write('Request was sent with no response.', true, 'error');
      if (self.debug) {
        console.log(error);
      }
    }

    // Crawl next website.
    self.crawl();
  });
};

/**
 * Collect all links.
 *
 * @param $
 */
Crawler.prototype.collectLinks = function ($) {
  let self = this,
    absoluteLinks = $("a[href^='http']"),
    relativeLinks = $("a[href^='/']"),
    count = {
      relative: 0,
      absolute: absoluteLinks.length
    };

  // Add absolute links to link list.
  absoluteLinks.each(function () {
    let href = $(this).attr('href');
    if (self.linkList.typeAbsolute.indexOf(href) === -1) {
      self.linkList.typeAbsolute.push(href);
    }
  });

  // Add relative links to link list.
  relativeLinks.each(function () {
    if (self.collectRelativeLinks($(this).attr('href'))) {
      count.relative += 1;
    } else {
      count.absolute += 1;
    }
  });

  output.write(`Relative links: ${count.relative}`, self.debug);
  output.write(`Absolute links ${count.absolute}`, self.debug);
};

/**
 * Split relative from shorted absolute links (e.g. "/google.com").
 *
 * @param link: {string}
 * @returns {boolean}
 */
Crawler.prototype.collectRelativeLinks = function (link) {
  let self = this,
    linkArray = link.split('/');

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

  let tmpUrlRel = self.baseUrl + '/' + link,
    tmpUrlAbs = self.url.protocol + '//' + link,
    tmpUrl = (linkType === 'typeRelative') ? tmpUrlRel : tmpUrlAbs;

  if (link.length > 0) {
    if (self.linkList[linkType].indexOf(tmpUrl) === -1) {
      self.linkList[linkType].push(tmpUrl);

      if (linkType === 'typeRelative') {
        self.followingPages.push(tmpUrl);
      }
    }
  }

  return (linkType === 'typeRelative');
};

/**
 * Do the ending stuff like screenshots or outputting the summary.
 *
 * @param outputType: {string} The used output method for the correct ending reason.
 * @returns {Promise.<void>}
 */
Crawler.prototype.endCrawling = async function (outputType) {
  let finishDelay = 0;

  if (!this.screenshots) {
    let self = this;
    finishDelay = parseInt(self.numVisited / 2);
    finishDelay = (finishDelay < 500) ? 500 : finishDelay;

    setTimeout(function () {
      if (typeof output[outputType] === 'function') {
        output[outputType](self.numVisited,
          self.linkList.typeAbsolute.length,
          self.linkList.typeRelative.length,
          self.numErrors(),
          screenshot.totalScreenshots,
          self.screenshots);
      }

      output.write(self.errorList, self.debug);
      self.getCustomerInfo();
      self.getUserInput();
      self.getReadableTime(finishDelay);
      output.logger.end();
      self.removeLockFile();
    }, finishDelay);

    return;
  }

  finishDelay = new Date();
  try {
    await screenshot.doScreenshots(this.customers.withWebsite);
  } catch (error) {
    console.log(error);
  }
  finishDelay = new Date() - finishDelay;

  if (typeof output[outputType] === 'function') {
    output[outputType](this.numVisited,
      this.linkList.typeAbsolute.length,
      this.linkList.typeRelative.length,
      this.numErrors(),
      screenshot.totalScreenshots,
      this.screenshots);
  }

  output.write(this.errorList, this.debug);
  this.getCustomerInfo();
  this.getUserInput();
  this.getReadableTime(finishDelay);
  output.logger.end();
  this.removeLockFile();
};

exports.Crawler = Crawler;