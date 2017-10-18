/**
 * Import modules.
 */
var axios = require('axios');
var cheerio = require('cheerio');

/**
 * Import custom modules.
 */
var args = require('./lib/crawler/arguments');
var output = require('./output')();
var customerInfo = require('./customerInfo')();

/**
 * Module Crawler
 *
 * @param commands: {}
 * @returns {module}
 */
module.exports = function (commands) {
  // Set arguments.
  for (var name in args) {
    if (args.hasOwnProperty(name)) {
      this[name] = args[name];
    }
  }

  // Init arguments.
  this.init(commands);

  /**
   * Crawling through websites.
   */
  this.crawl = function (first) {
    if (typeof first !== 'undefined') {
      if (this.lockFileExists()) {
        output.logger.end();
        return;
      }

      this.createLockFile();
    }

    var self = this;

    // Reached limit to visit websites.
    if (self.numVisited >= self.pageLimit && self.pageLimit !== 0) {
      output.pageLimitOut(self.numVisited,
        self.linkList.typeAbsolute.length,
        self.linkList.typeRelative.length,
        self.numErrors());
      self.debugging(self.errorList);
      self.getCustomerInfo();
      self.getUserInput();
      self.getReadableTime();
      output.logger.end();
      this.removeLockFile();
      return;
    }

    var nextPage = self.followingPages.pop();

    // Already visited next website.
    if (nextPage in self.visited) {
      self.debugging('Url ' + nextPage + ' already visited.');
      self.crawl();
      return;
    }

    // No more websites available.
    if (typeof nextPage === 'undefined') {
      output.lastPageOut(self.numVisited,
        self.linkList.typeAbsolute.length,
        self.linkList.typeRelative.length,
        self.numErrors());
      self.debugging(self.errorList);
      self.getCustomerInfo();
      self.getUserInput();
      self.getReadableTime();
      output.logger.end();
      this.removeLockFile();
      return;
    }

    // Visit website.
    self.visitPage(nextPage, self.crawl);
  };

  /**
   * Visiting the website.
   *
   * @param url: string
   * @param callback: function
   */
  this.visitPage = function (url, callback) {
    var self = this;
    self.visited[url] = true;
    self.numVisited += 1;

    output.writeLine('Visiting page ' + url);
    output.write('Visited pages: ' + self.numVisited);

    // Make the request.
    axios.get(url)
      .then(function (response) {
        self.debugging('Url: ' + url);
        self.debugging('Status: ' + response.status);

        if (response.status !== 200) {
          callback();
          return;
        }

        var $ = cheerio.load(response.data);

        if (customerInfo.canHaveWebsite(url)) {
          customerInfo.setCustomer(url, $, self.customers, output);
        }

        self.collectLinks($);

        // Crawl next website.
        callback();
      })
      .catch(function (error) {
        output.writeLine('Error on url ' + url, 'warning');
        self.debugging('Url: ' + url);

        if (typeof error.response !== 'undefined') {
          self.debugging('Status: ' + error.response.status);
          self.debugging('Status text: ' + error.response.statusText);

          if (typeof self.errorList[error.response.status] === 'undefined') {
            self.errorList[error.response.status] = [];
          }

          self.errorList[error.response.status].push(url);
        } else {
          output.write('Request was sent with no response.', 'error');
        }

        // Crawl next website.
        callback();
      });
  };

  /**
   * Collect all links.
   *
   * @param $
   */
  this.collectLinks = function ($) {
    var self = this;
    var absoluteLinks = $("a[href^='http']");
    var relativeLinks = $("a[href^='/']");
    var count = {
      relative: 0,
      absolute: absoluteLinks.length
    };

    absoluteLinks.each(function () {
      var href = $(this).attr('href');
      if (self.linkList.typeAbsolute.indexOf(href) === -1) {
        self.linkList.typeAbsolute.push(href);
      }
    });

    relativeLinks.each(function () {
      if (self.collectRelativeLinks($(this).attr('href'))) {
        count.relative += 1;
      } else {
        count.absolute += 1;
      }
    });

    self.debugging('Relative links: ' + count.relative);
    self.debugging('Absolute links ' + count.absolute);
  };

  /**
   * Split relative from shorted absolute links (e.g. "/google.com").
   *
   * @param link: string
   * @returns {boolean}
   */
  this.collectRelativeLinks = function (link) {
    var self = this;
    var linkArray = link.split('/');

    for (var i = 0; i < link.length;) {
      if (linkArray[0] === '') {
        linkArray.shift();
      } else {
        i += 1;
      }
    }

    var linkType = 'typeRelative';

    if (linkArray.length === 0 || linkArray[0].indexOf('.') > -1) {
      linkType = 'typeAbsolute';
    }

    link = linkArray.join('/');

    var tmpUrl = (linkType === 'typeRelative') ? self.baseUrl + '/' + link : self.url.protocol + '//' + link;
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
   * Just outputs content when debug was set to true.
   *
   * @param string
   */
  this.debugging = function (string) {
    if (this.debug) {
      console.log("\x1b[36m", string, "\x1b[0m");
    }
  };

  /**
   * Print customer/post information.
   */
  this.getCustomerInfo = function () {
    var i = 0;
    var web = {
      no: [],
      other: [],
      rto: [],
      hasError: []
    };

    for (i = 0; i < this.customers.withoutWebsite.length; i += 1) {
      web.no.push(this.customers.withoutWebsite[i]);
    }

    for (i = 0; i < this.customers.withWebsite.length; i += 1) {
      var type = (this.customers.withWebsite[i].rto === true) ? 'rto' : 'other';
      type = (this.customers.withWebsite[i].hasError === true) ? 'hasError' : type;

      web[type].push(this.customers.withWebsite[i]);
    }

    if (this.debug) {
      output.writeLine('No website: ' + web.no.length);
      for (i = 0; i < web.no.length; i += 1) {
        output.write((i + 1) + ':');
        output.write('Link: ' + web.no[i]);
      }

      output.writeLine('Other website: ' + web.other.length);
      for (i = 0; i < web.other.length; i += 1) {
        output.write((i + 1) + ':');
        output.write('Link: ' + web.other[i].url);
        output.write('Website: ' + web.other[i].website);
        output.write('Imprint: ' + web.other[i].imprint);
      }

      output.writeLine('RTO website: ' + web.rto.length);
      for (i = 0; i < web.rto.length; i += 1) {
        output.write((i + 1) + ':');
        output.write('Link: ' + web.rto[i].url);
        output.write('Website: ' + web.rto[i].website);
        output.write('Imprint: ' + web.rto[i].imprint);
      }

      output.writeLine('Websites with error: ' + web.hasError.length);
      for (i = 0; i < web.hasError.length; i += 1) {
        output.write((i + 1) + ':');
        output.write('Link: ' + web.hasError[i].url);
        output.write('Website: ' + web.hasError[i].website);
      }
    }

    output.writeLine('No website: ' + web.no.length);
    output.write('Other website: ' + web.other.length);
    output.write('RTO website: ' + web.rto.length);
    var webErrorColor = (web.hasError.length === 0) ? '' : ((web.hasError.length >= 10) ? 'error' : 'warning');
    output.write('Websites with error: ' + web.hasError.length, webErrorColor);
  };

  /**
   * Print user inputs.
   */
  this.getUserInput = function () {
    output.writeLine('User input:');
    for (var name in this.commands) {
      if (this.commands.hasOwnProperty(name)) {
        var isDefault = (this.commands[name] === this.defaultArgs[name]) ? ' (default)' : '';
        output.write(name + ': ' + this.commands[name] + isDefault);
      }
    }
  };

  /**
   * Stops execution time and print as readable time.
   */
  this.getReadableTime = function () {
    var timeLimits = {
      success: (1000 * 60 * 30), // 30 minutes.
      warning: (1000 * 60 * 60), // 1 hour.
      error: (1000 * 60 * 60 + 1000) // >1 hour.
    };

    var timeColor = 'success';

    for (var type in timeLimits) {
      if (timeLimits.hasOwnProperty(type) && ms <= timeLimits[type]) {
        timeColor = type;
      }
    }

    var ms = new Date() - this.startTime;
    var days = ms / 1000;
    var seconds = parseInt(days % 60);
    seconds = (seconds < 10) ? '0' + seconds : seconds;

    days /= 60;
    var minutes = parseInt(days % 60);
    minutes = (minutes < 10) ? '0' + minutes : minutes;

    days /= 60;
    var hours = parseInt(days % 24);
    hours = (hours < 10) ? '0' + hours : hours;

    days /= 24;
    days = parseInt(days);

    var time = days + ' days, ' + hours + ':' + minutes + ':' + seconds;
    output.write(time, timeColor);
  };

  /**
   * Counts the number of total errors.
   *
   * @param status?: string
   * @returns {number}
   */
  this.numErrors = function (status) {
    var counter = 0;

    if (typeof status === 'undefined') {
      for (var tmpStatus in this.errorList) {
        if (this.errorList.hasOwnProperty(tmpStatus)) {
          counter += this.errorList[tmpStatus].length;
        }
      }

      return counter;
    }

    if (this.errorList.hasOwnProperty(status)) {
      counter = this.errorList[status].length;
    }

    return counter;
  };

  // Write user input into log file.
  this.getUserInput();

  return this;
};

