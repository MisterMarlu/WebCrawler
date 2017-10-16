/**
 * @author lbraun
 * @date 16.10.2017
 * @licence MIT
 */

var axios = require('axios');
var cheerio = require('cheerio');

var args = require('./lib/crawler/arguments');
var output = require('./output')();
var customerInfo = require('./customerInfo')();

module.exports = function (commands) {
  for (var name in args) {
    if (args.hasOwnProperty(name)) {
      this[name] = args[name];
    }
  }

  this.init(commands);

  /**
   * Crawling through websites.
   */
  this.crawl = function () {
    var self = this;

    if (self.numVisited >= self.pageLimit && self.pageLimit !== 0) {
      output.pageLimitOut(self.numVisited,
        self.linkList.typeAbsolute.length,
        self.linkList.typeRelative.length,
        self.numErrors);
      self.debugging(self.errorList);
      self.getCustomerInfo();
      self.getUserInput();
      self.getReadableTime();
      return;
    }

    var nextPage = self.followingPages.pop();

    if (nextPage in self.visited) {
      self.debugging('Url ' + nextPage + ' already visited.');
      self.crawl();
      return;
    }

    if (typeof nextPage === 'undefined') {
      output.lastPageOut(self.numVisited,
        self.linkList.typeAbsolute.length,
        self.linkList.typeRelative.length,
        self.numErrors);
      self.debugging(self.errorList);
      self.getCustomerInfo();
      self.getUserInput();
      self.getReadableTime();
      return;
    }

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
          customerInfo.setCustomer(url, $, self.customers);
        }

        self.collectLinks($);
        callback();
      })
      .catch(function (error) {
        output.writeLine('Error on url ' + url);
        self.debugging('Url: ' + url);
        self.debugging('Status: ' + error.response.status);
        self.debugging('Status text: ' + error.response.statusText);

        if (typeof self.errorList[error.response.status] === 'undefined') {
          self.errorList[error.response.status] = [];
        }

        self.errorList[error.response.status].push(url);
        self.numErrors += 1;

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
   * @param string: string
   */
  this.debugging = function (string) {
    if (this.debug) {
      output.write(string);
    }
  };

  return this;
};

