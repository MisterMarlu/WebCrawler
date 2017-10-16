/**
 * @author lbraun
 * @date 13.10.2017
 * @licence MIT
 */

/**
 * Importing modules.
 */
const commands = require('minimist')(process.argv.slice(2));
const axios = require('axios');
const cheerio = require('cheerio');
const URL = require('url-parse');

/**
 * Defaults from command line.
 */
const startUrlDefault = 'https://www.phpdoc.org/';
const maxPagesDefault = 0;
const debugDefault = 'false';

/**
 * Settings.
 */
var startUrlVar = commands.url || startUrlDefault;
var maxPagesVar = commands.pages || maxPagesDefault;
var debugVar = commands.debug || debugDefault;

// Set constants with correct type.
const startUrl = startUrlVar; // String
const maxPages = parseInt(maxPagesVar); // Integer
const debug = (debugVar === 'true'); // Boolean

/**
 * Global definitions.
 */
var visited = {};
var numVisited = 0;
var followingPages = [];
var url = new URL(startUrl);
var baseUrl = url.protocol + '//' + url.hostname;
var linkList = {
  absolute: [],
  relative: []
};
var errorList = {};

/**
 * Start crawling.
 */
followingPages.push(startUrl);
crawl();

/**
 * Crawler functions.
 */

/**
 * Check before visit a page.
 */
function crawl() {
  // Reached max limit of pages to visit.
  if (numVisited >= maxPages && maxPages !== 0) {
    writeLine('Reached max limit of number of pages to visit. (Pages: ' + numVisited + ')');
    write('Found absolute links total: ' + linkList.absolute.length);
    write('Found relative links total: ' + linkList.relative.length);
    write('Found links total: ' + (linkList.absolute.length + linkList.relative.length));
    write('Errors total: ' + getTotalErrors());
    debugging(errorList);
    writeUserInput();
    return;
  }

  var nextPage = followingPages.pop();

  // Page already visited.
  if (nextPage in visited) {
    crawl();
    return;
  }

  // No more page to visit.
  if (typeof nextPage === 'undefined') {
    writeLine('No more page to visit. (Page ' + numVisited + ')');
    write('Found absolute links total: ' + linkList.absolute.length);
    write('Found relative links total: ' + linkList.relative.length);
    write('Found links total: ' + (linkList.absolute.length + linkList.relative.length));
    write('Errors total: ' + getTotalErrors());
    debugging(errorList);
    writeUserInput();
    return;
  }

  visitPage(nextPage, crawl);
}

/**
 * Visit page.
 *
 * @param url: string
 * @param callback: function
 */
function visitPage(url, callback) {
  visited[url] = true;
  numVisited += 1;

  writeLine('Visiting page ' + url);
  write('Visited pages: ' + numVisited);

  axios.get(url)
    .then(function (response) {
      debugging('Url: ' + url);
      debugging('Status: ' + response.status);

      if (response.status !== 200) {
        callback();
        return;
      }

      var $ = cheerio.load(response.data);
      collectLinks($);
      callback();
    })
    .catch(function (error) {
      writeLine('Error on url ' + url);
      debugging('Url: ' + url);
      debugging('Status: ' + error.response.status);
      debugging('Status text: ' + error.response.statusText);

      if (typeof errorList[error.response.status] === 'undefined') {
        errorList[error.response.status] = [];
      }

      errorList[error.response.status].push(url);

      callback();
    });
}

/**
 * Get all anchors.
 *
 * @param $ Something like jQuery.
 */
function collectLinks($) {
  var relativeLinks = $("a[href^='/']");
  var absoluteLinks = $("a[href^='http']");
  var count = {
    relative: 0,
    absolute: absoluteLinks.length
  };

  absoluteLinks.each(function () {
    var href = $(this).attr('href');
    if (linkList.absolute.indexOf(href) === -1) {
      linkList.absolute.push(href);
    }
  });

  relativeLinks.each(function () {
    if (collectRelativeLinks($(this).attr('href'))) {
      count.relative += 1;
    } else {
      count.absolute += 1;
    }
  });

  debugging('Relative links: ' + count.relative);
  write('Absolute links ' + count.absolute);
}

/**
 * Set relative links or absolute links without protocol type (e.g. /google.com) to list of links.
 *
 * @param link: string
 * @returns {boolean}
 */
function collectRelativeLinks(link) {
  var linkArray = link.split('/');

  for (var i = 0; i < link.length;) {
    if (linkArray[0] === '') {
      linkArray.shift();
    } else {
      i += 1;
    }
  }

  var linkType = 'relative';

  if (linkArray.length === 0 || linkArray[0].indexOf('.') > -1) {
    linkType = 'absolute';
  }

  link = linkArray.join('/');

  var tmpUrl = (linkType === 'relative') ? baseUrl + '/' + link : url.protocol + '//' + link;
  if (link.length > 0) {
    if (linkList[linkType].indexOf(tmpUrl) === -1) {
      linkList[linkType].push(tmpUrl);

      if (linkType === 'relative') {
        followingPages.push(tmpUrl);
      }
    }
  }

  return (linkType === 'relative');
}

/**
 * Helper functions.
 */

/**
 * Returns input when "debug" was true.
 *
 * @param variable
 */
function debugging(variable) {
  if (debug) {
    console.log(variable);
  }
}

/**
 * Write output.
 *
 * @param string: string
 */
function write(string) {
  console.log(string);
}

/**
 * Write with empty line before.
 *
 * @param string: string
 */
function writeLine(string) {
  console.log();
  console.log(string);
}

/**
 * Get number of total errors.
 *
 * @returns {number}
 */
function getTotalErrors() {
  var counter = 0;

  for (var status in errorList) {
    counter += errorList[status].length;
  }

  return counter;
}

/**
 * Writes out user input when "debug" was true.
 */
function writeUserInput() {
  if (!debug) {
    return;
  }

  writeLine('Commands:');
  write('Url: ' + startUrl + ((startUrl === startUrlDefault) ? ' (default)' : ''));
  write('Max pages: ' + maxPages + ((maxPages === maxPagesDefault) ? ' (default)' : ''));
  write('Debug: ' + debug + ((debug === debugDefault) ? ' (default)' : ''));
}