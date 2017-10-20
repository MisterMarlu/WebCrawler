/**
 * Import modules.
 */
var axios = require('axios');
var cheerio = require('cheerio');
var spinner = require('cli-spinner').Spinner;

// Default spinner type "|/-\".
spinner.setDefaultSpinnerString(0);

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
  var finishDelay = 2000;

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
   *
   * @param first?: {boolean}
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
    var spinnerTitle = null;
    var consoleSpinner = null;

    // Reached limit to visit websites.
    if (self.numVisited >= self.pageLimit && self.pageLimit !== 0) {
      // Chromeless should take approx 4 seconds per screenshot.
      // finishDelay = (customerInfo.numScreenshots * 4 * 1000) + finishDelay;
      spinnerTitle = "%s Waiting for screenshots.";
      spinnerTitle += "(" + (finishDelay / 1000) + " seconds for " + customerInfo.numScreenshots + " screenshots)";
      consoleSpinner = new spinner(spinnerTitle);
      consoleSpinner.start();
      // customerInfo.doScreenshots(self.customers.withWebsite, output);
      setTimeout(function (args2) {
        consoleSpinner.stop(true);
        output.pageLimitOut(self.numVisited,
          self.linkList.typeAbsolute.length,
          self.linkList.typeRelative.length,
          self.numErrors(),
          self.numScreenshots);
        output.write(self.errorList, self.debug);
        self.getCustomerInfo();
        self.getUserInput();
        self.getReadableTime(finishDelay);
        output.logger.end();
        self.removeLockFile();
      }, finishDelay);
      return;
    }

    var nextPage = self.followingPages.pop();

    // Already visited next website.
    if (nextPage in self.visited) {
      output.write('Url ' + nextPage + ' already visited.', self.debug);
      self.crawl();
      return;
    }

    // No more websites available.
    if (typeof nextPage === 'undefined') {
      // Screenshot delay was set in seconds but we need ms.
      // finishDelay = (self.numScreenshots * 1000) + finishDelay;
      spinnerTitle = "%s Waiting for screenshots.";
      spinnerTitle += "(" + (finishDelay / 1000) + " seconds)";
      consoleSpinner = new spinner(spinnerTitle);
      consoleSpinner.start();
      // customerInfo.doScreenshots(self.customers.withWebsite, output);
      setTimeout(function (args2) {
        output.lastPageOut(self.numVisited,
          self.linkList.typeAbsolute.length,
          self.linkList.typeRelative.length,
          self.numErrors(),
          self.numScreenshots);
        output.write(self.errorList, self.debug);
        self.getCustomerInfo();
        self.getUserInput();
        self.getReadableTime(finishDelay);
        output.logger.end();
        self.removeLockFile();
      }, finishDelay);
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

    output.writeLine('Visiting page ' + url, self.debug);
    output.write('Visited pages: ' + self.numVisited, true);

    // Make the request.
    axios.get(url)
      .then(function (response) {
        output.write('Url: ' + url, self.debug);
        output.write('Status: ' + response.status, self.debug);

        if (response.status !== 200) {
          callback();
          return;
        }

        var $ = cheerio.load(response.data);

        if (customerInfo.canHaveWebsite(url, 'sex-anzeigen')) {
          customerInfo.setCustomer(url, $, self.customers, output, self.debug);
        }

        self.collectLinks($);

        // Crawl next website.
        callback();
      })
      .catch(function (error) {
        output.writeLine('Error on url ' + url, true, 'warning');
        output.write('Url: ' + url, self.debug);

        if (typeof error.response !== 'undefined') {
          output.write('Status: ' + error.response.status, true, 'warning');
          output.writeWithSpace('Status text: ' + error.response.statusText, true, 'warning');

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

    // Add absolute links to link list.
    absoluteLinks.each(function () {
      var href = $(this).attr('href');
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

    output.write('Relative links: ' + count.relative, self.debug);
    output.write('Absolute links ' + count.absolute, self.debug);
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

    output.writeLine('No website: ' + web.no.length, this.debug);
    for (i = 0; i < web.no.length; i += 1) {
      output.write((i + 1) + ':', this.debug);
      output.write('Link: ' + web.no[i], this.debug);
    }

    output.writeLine('Other website: ' + web.other.length, this.debug);
    for (i = 0; i < web.other.length; i += 1) {
      output.write((i + 1) + ':', this.debug);
      output.write('Link: ' + web.other[i].url, this.debug);
      output.write('Website: ' + web.other[i].website, this.debug);
      output.write('Imprint: ' + web.other[i].imprint, this.debug);
    }

    output.writeLine('RTO website: ' + web.rto.length, this.debug);
    for (i = 0; i < web.rto.length; i += 1) {
      output.write((i + 1) + ':', this.debug);
      output.write('Link: ' + web.rto[i].url, this.debug);
      output.write('Website: ' + web.rto[i].website, this.debug);
      output.write('Imprint: ' + web.rto[i].imprint, this.debug);
    }

    output.writeLine('Websites with error: ' + web.hasError.length, this.debug);
    for (i = 0; i < web.hasError.length; i += 1) {
      output.write((i + 1) + ':', this.debug);
      output.write('Link: ' + web.hasError[i].url, this.debug);
      output.write('Website: ' + web.hasError[i].website, this.debug);
    }

    output.writeLine('No website: ' + web.no.length, true);
    output.write('Other website: ' + web.other.length, true);
    output.write('RTO website: ' + web.rto.length, true);
    var webErrorColor = '';
    if (web.hasError.length > 0) {
      webErrorColor = (web.hasError.length >= parseInt(this.pageLimit / 50)) ? 'error' : 'warning';
    }

    output.write('Websites with error: ' + web.hasError.length, true, webErrorColor);
  };

  /**
   * Print user inputs.
   */
  this.getUserInput = function () {
    output.writeLine('User input:', true);
    for (var name in this.commands) {
      if (this.commands.hasOwnProperty(name)) {
        var isDefault = (this.commands[name] === this.defaultArgs[name]);
        var string = (isDefault) ? ' (default)' : '';
        var color = (isDefault) ? 'default' : '';
        output.write(name + ': ' + this.commands[name] + string, true, color);
      }
    }
  };

  /**
   * Stops execution time and print as readable time.
   *
   * @param delay?: int
   */
  this.getReadableTime = function (delay) {
    if (typeof delay === 'undefined') {
      delay = 0;
    }

    delay = (delay > 0) ? delay / 1000 : delay;

    var ratio = {
      success: {
        pages: 100,
        seconds: 5
      },
      warning: {
        pages: 100,
        seconds: 10
      }
    };
    var ms = new Date() - this.startTime;
    var timeColor = '';
    var expectations = [];

    if (this.pageLimit !== 0) {
      timeColor = 'error';
      for (var type in ratio) {
        if (ratio.hasOwnProperty(type)) {
          var exSeconds = (this.pageLimit / 100 * ratio[type].seconds); // Get seconds from ratio.
          exSeconds *= 1.05; // Add tolerance.
          exSeconds += delay; // Add delay.
          expectations[expectations.length] = parseInt(exSeconds);
          var tmpUsedSeconds = parseInt(ms / 1000);

          if (tmpUsedSeconds <= expectations[(expectations.length - 1)]) {
            timeColor = type;
            break;
          }
        }
      }
    }

    var time = this.parseTime(ms);
    var timeString = time.d + ' days, ' + time.h + ':' + time.m + ':' + time.s;

    output.write(timeString, true, timeColor);

    if (expectations.length > 0) {
      var etn = this.parseTime((expectations[(expectations.length - 1)] * 1000));
      output.write(output.sprintf('(Expected: %s days, %s:%s:%s)', etn.d, etn.h, etn.m, etn.s), true, 'comment');

      if (expectations.length > 1) {
        var etb = this.parseTime((expectations[0] * 1000));
        output.write(output.sprintf('(Expected best: %s days, %s:%s:%s)', etb.d, etb.h, etb.m, etb.s), true, 'comment');
      }
    }
  };

  /**
   * Parse milliseconds to object or array with days, hours, minutes and seconds.
   *
   * @param ms: int
   * @param asArray?: bool
   * @returns {*}
   */
  this.parseTime = function (ms, asArray) {
    if (typeof asArray === 'undefined') {
      asArray = false;
    }

    var time = {
      d: 0,
      h: 0,
      m: 0,
      s: 0
    };

    var seconds = ms / 1000;
    time.s = parseInt(seconds % 60);
    time.s = (time.s < 10) ? '0' + time.s : time.s;

    var minutes = seconds / 60;
    time.m = parseInt(minutes % 60);
    time.m = (time.m < 10) ? '0' + time.m : time.m;

    var hours = minutes / 60;
    time.h = parseInt(hours % 24);
    time.h = (time.h < 10) ? '0' + time.h : time.h;

    var days = hours / 24;
    time.d = parseInt(days);

    if (!asArray) {
      return time;
    }

    return Object.keys(time).map(function (t) {
      return parseInt(time[t]);
    });
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

