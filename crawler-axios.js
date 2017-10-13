/**
 * Completed tutorial "How to make a simple web crawler in JavaScript and NodeJS".
 *
 * @link http://www.netinstructions.com/how-to-make-a-simple-web-crawler-in-javascript-and-node-js/
 *
 * Testing page: https://www.phpdoc.org/
 */

var lineUrl = (typeof process.argv[2] === 'undefined') ? 'https://www.phpdoc.org/' : process.argv[2];
var lineMaxPages = (typeof process.argv[3] === 'undefined') ? 10 : process.argv[3];

console.log('Url: ' + lineUrl);
console.log('Max pages to visit: ' + lineMaxPages);
console.log('Searching for word' + lineWord);

var axios = require('axios');
var cheerio = require('cheerio');
var URL = require('url-parse');

var MAX_PAGES_TO_VISIT = lineMaxPages;
var START_URL = lineUrl;

var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = [];
var url = new URL(START_URL);
var baseUrl = url.protocol + "//" + url.hostname;
var linkList = [];

pagesToVisit.push(START_URL);
crawl();

function crawl() {
  if (numPagesVisited >= MAX_PAGES_TO_VISIT && MAX_PAGES_TO_VISIT !== '0') {
    console.log('Reached max limit of number of pages to visit. (Pages: ' + numPagesVisited + ')');
    console.log('Found links total: ' + linkList.length);
    return;
  }

  var nextPage = pagesToVisit.pop();

  if (nextPage in pagesVisited) {
    // We've already visited this page, so repeat the crawl
    crawl();
  } else if (typeof nextPage === 'undefined') {
    console.log('No more page to visit. (Page ' + numPagesVisited + ')');
    console.log('Found links total: ' + linkList.length);
  } else {
    // New page we haven't visited
    visitPage(nextPage, crawl);
  }
}

function visitPage(url, callback) {
  // Add page to our set
  pagesVisited[url] = true;
  numPagesVisited++;

  // Make the request
  console.log("Visiting page " + url);
  console.log('Visited pages: ' + numPagesVisited);
  axios.get(url)
    .then(function (response) {
      if (response.status !== 200) {
        callback();
        return;
      }

      // Parse the document body.
      var $ = cheerio.load(response.data);
      collectLinks($);
      callback();
    })
    .catch(function (error) {
      callback();
    });
}

function collectLinks($) {
  var absoluteLinks = $("a[href^='http']");
  var relativeLinks = $("a[href^='/']");

  absoluteLinks.each(function () {
    var href = $(this).attr('href');
    if (linkList.indexOf(href) === -1) {
      linkList.push(href);
    }
  });

  relativeLinks.each(function () {
    collectRelativeLinks($(this).attr('href'));
  });

  console.log('Found ' + relativeLinks.length + ' relative links.');
  console.log('Found ' + absoluteLinks.length + ' absolute links.');
}

// function collectLinks($, type) {
//   var hrefType = (type === 'relative') ? "a[href^='/']" : "a[href^='http']";
//   var links = $(hrefType);
//
//   console.log("Found " + links.length + " " + type + " links on page");
//   if (type === 'relative') {
//     links.each(function () {
//       pagesToVisit.push(baseUrl + $(this).attr('href'));
//     });
//   }
// }

function collectRelativeLinks(link) {
  var linkArray = link.split('/');

  for (var i = 0; i < linkArray.length;) {
    if (linkArray[0] === '') {
      linkArray.shift();
    } else {
      i += 1;
    }
  }

  var relative = true;

  if (linkArray.length === 0 || linkArray[0].indexOf('.') > -1) {
    relative = false;
  }

  link = linkArray.join('/');

  var tmpUrl = (relative) ? baseUrl + '/' + link : url.protocol + '//' + link;
  if (linkList.indexOf(tmpUrl) === -1 && link.length > 0) {
    linkList.push(tmpUrl);
  }

  if (relative && link.length > 0) {
    pagesToVisit.push(tmpUrl);
  }
}