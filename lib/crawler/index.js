/**
 * Import modules.
 */
const cheerio = require('cheerio');
const axios = require('axios');

/**
 * Import custom modules.
 */
const Output = require('../output').Output;
const Search = require('../search').Search;
const Screenshot = require('../screenshot').Screenshot;

/**
 * Crawler constructor.
 *
 * @param commands: {{}}
 * @returns {Crawler}
 * @constructor
 */
let Crawler = function (commands) {
  if (!this instanceof Crawler) return new Crawler(commands);

  let args = require('./arguments');
  for (let key in args) {
    if (args.hasOwnProperty(key)) {
      this[key] = args[key];
    }
  }

  this.init(commands);
};

/**
 * Public methods.
 */

Crawler.prototype.start = function () {
  if (this.hasLockFile()) {
    return;
  }

  this.createLockFile();
  this.output = new Output();
  this.search = new Search('sex-anzeigen');
  this.screenshot = new Screenshot();

  try {
    this.output.initLogger('crawling-1');
    this.crawl();
  } catch (error) {
    throw error;
  }
};

Crawler.prototype.crawl = async function () {
  if (this.numVisited >= this.pageLimit && this.pageLimit !== 0) {
    this.endCrawling('pageLimit');
    return;
  }

  console.log(typeof this.followingPages);
  let nextPage = this.followingPages.pop();

  if (nextPage in this.visited) {
    this.output.write(`Url ${nextPage} already visited.`, this.debug);
    this.crawl();
    return;
  }

  if (typeof nextPage === 'undefined') {
    this.endCrawling('lastPage');
    return;
  }

  await this.visitPage(nextPage, this.crawl);
};

Crawler.prototype.visitPage = async function (url, callback) {
  let self = this;
  self.visited[url] = true;
  self.numVisited += 1;

  self.output.writeLine(`Visiting page ${url}`, self.debug);
  self.output.write(`Visited pages: ${self.numVisited}`, true);

  axios.get(url)
    .then(function (response) {
      self.output.write(`Url: ${url}`, self.debug);
      self.output.write(`Status: ${response.status}`, self.debug);

      if (response.status !== 200) {
        callback();
        return;
      }

      let $ = cheerio.load(response.data);

      if (self.search.canHaveWebsite(url)) {
        self.search.setCustomer(url, $, self.customers, self.startUrl, self.output, self.debug);
      }

      self.collectLinks($);

      // Crawl next website.
      callback();
    }).catch(function (error) {

  });
};

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

  self.output.write('Relative links: ' + count.relative, self.debug);
  self.output.write('Absolute links ' + count.absolute, self.debug);
};

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

Crawler.prototype.endCrawling = async function (outputType) {
  let finishDelay = 0;

  if (!this.screenshots) {
    let self = this;
    finishDelay = parseInt(self.numVisited / 2);
    finishDelay = (finishDelay < 500) ? 500 : finishDelay;

    setTimeout(function () {
      if (typeof self.output[outputType] === 'function') {
        output[outputType](self.numVisited,
          self.linkList.typeAbsolute.length,
          self.linkList.typeRelative.length,
          self.numErrors(),
          self.screenshot.totalScreenshots,
          self.screenshots);
      }

      self.output.write(self.errorList, self.debug);
      self.getCustomerInfo();
      self.getUserInput();
      self.getReadableTime(finishDelay);
      self.output.logger.end();
      self.removeLockFile();
    }, finishDelay);

    return;
  }

  finishDelay = new Date();
  try {
    await this.screenshot.doScreenshots(this.customers.withWebsite, output);
  } catch (error) {
    console.log(error);
  }
  finishDelay = new Date() - finishDelay;

  if (typeof this.output[outputType] === 'function') {
    this.output[outputType](this.numVisited,
      this.linkList.typeAbsolute.length,
      this.linkList.typeRelative.length,
      this.numErrors(),
      this.screenshot.totalScreenshots,
      this.screenshots);
  }

  this.output.write(this.errorList, this.debug);
  this.getCustomerInfo();
  this.getUserInput();
  this.getReadableTime(finishDelay);
  this.output.logger.end();
  this.removeLockFile();
};

exports.Crawler = Crawler;