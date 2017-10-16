/**
 * @author lbraun
 * @date 16.10.2017
 * @licence MIT
 */

const URL = require('url-parse');

module.exports.commands = {};

module.exports.defaultArgs = {
  startUrl: 'https://www.phpdoc.org/',
  pageLimit: '0',
  debug: 'false',

  visited: {},
  numVisited: 0,
  followingPages: [],
  url: {},
  baseUrl: '',
  linkList: {
    typeAbsolute: [],
    typeRelative: []
  },
  errorList: {},
  numErrors: 0,
  customers: {
    rtoWebsite: [],
    otherWebsite: [],
    noWebsite: []
  },
  startTime: 0
};

module.exports.startUrl = this.defaultArgs.startUrl;
module.exports.pageLimit = this.defaultArgs.pageLimit;
module.exports.debug = this.defaultArgs.debug;

module.exports.visited = this.defaultArgs.visited;
module.exports.numVisited = this.defaultArgs.numVisited;
module.exports.followingPages = this.defaultArgs.followingPages;
module.exports.url = this.defaultArgs.url;
module.exports.baseUrl = this.defaultArgs.baseUrl;
module.exports.linkList = this.defaultArgs.linkList;
module.exports.errorList = this.defaultArgs.errorList;
module.exports.numErrors = this.defaultArgs.numErrors;
module.exports.customers = this.defaultArgs.customers;

/**
 * Set all arguments so default.
 */
module.exports.setDefault = function () {
  for (var key in this.defaultArgs) {
    if (this.defaultArgs.hasOwnProperty(key)) {
      this[key] = this.defaultArgs[key];
    }
  }
};

/**
 * Initialize all parameters to be ready for crawling.
 *
 * @param commands: object
 * @returns {exports}
 */
module.exports.init = function (commands) {
  var startUrl = commands.startUrl || this.startUrl;
  var pageLimit = commands.pageLimit || this.pageLimit;
  var debug = commands.debug || this.debug;

  this.commands = {
    startUrl: commands.startUrl || startUrl,
    pageLimit: commands.pageLimit || pageLimit,
    debug: commands.debug || debug
  };

  this.startUrl = startUrl;
  this.pageLimit = parseInt(pageLimit);
  this.debug = (debug === 'true');

  this.url = new URL(this.startUrl);
  this.baseUrl = this.url.protocol + '//' + this.url.hostname;

  this.followingPages.push(this.startUrl);
  this.startTime = new Date();

  return this;
};

module.exports.getCustomerInfo = function () {
  if (this.debug) {
    console.log();
    console.log('No website: ' + this.customers.noWebsite.length);
    for (var i = 0; i < this.customers.noWebsite.length; i += 1) {
      console.log((i + 1) + ':');
      console.log('Link: ' + this.customers.noWebsite[i]);
    }

    console.log();
    console.log('Other website: ' + this.customers.otherWebsite.length);
    for (var j = 0; j < this.customers.otherWebsite.length; j += 1) {
      console.log((j + 1) + ':');
      console.log('Link: ' + this.customers.otherWebsite[j].url);
      console.log('Website: ' + this.customers.otherWebsite[j].website);
      console.log('Imprint: ' + this.customers.otherWebsite[j].imprint);
    }

    console.log();
    console.log('RTO website: ' + this.customers.rtoWebsite.length);
    for (var ij = 0; ij < this.customers.rtoWebsite.length; ij += 1) {
      console.log((ij + 1) + ':');
      console.log('Link: ' + this.customers.rtoWebsite[ij].url);
      console.log('Website: ' + this.customers.rtoWebsite[ij].website);
      console.log('Imprint: ' + this.customers.rtoWebsite[ij].imprint);
    }
  }

  console.log();
  console.log('No website: ' + this.customers.noWebsite.length);
  console.log('Other website: ' + this.customers.otherWebsite.length);
  console.log('RTO website: ' + this.customers.rtoWebsite.length);
};

module.exports.getUserInput = function () {
  console.log();
  console.log('User input:');
  for (var name in this.commands) {
    if (this.commands.hasOwnProperty(name)) {
      var isDefault = (this.commands[name] === this.defaultArgs[name]) ? ' (default)' : '';
      console.log(name + ': ' + this.commands[name] + isDefault);
    }
  }
};

module.exports.getReadableTime = function () {
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
  console.log(time);
};