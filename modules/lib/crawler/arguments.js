/**
 * Import modules.
 */
const URL = require('url-parse');
const fs = require('fs');

const lockFileName = 'crawler.lock';

/**
 * Storage for user input.
 * @type {{}}
 */
module.exports.commands = {};

/**
 * Default values for necessary arguments.
 *
 * @type {{
 *  startUrl: string,
 *  pageLimit: string,
 *  debug: string,
 *  screenshots: string,
 *  visited: {},
 *  numVisited: int,
 *  followingPages: Array,
 *  url: {},
 *  baseUrl: string,
 *  linkList: {
 *    typeAbsolute: Array,
 *    typeRelative: Array
 *  },
 *  errorList: {},
 *  customers: {
 *    rtoWebsite: Array,
 *    otherWebsite: Array,
 *    noWebsite: Array
 *  },
 *  startTime: int
 *  }}
 */
module.exports.defaultArgs = {
  startUrl: 'https://www.phpdoc.org/',
  pageLimit: '0',
  debug: 'false',
  screenshots: 'false',
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
  customers: {
    withWebsite: [],
    withoutWebsite: []
  },
  startTime: 0,
};

/**
 * Necessary arguments
 */
module.exports.startUrl = this.defaultArgs.startUrl;
module.exports.pageLimit = this.defaultArgs.pageLimit;
module.exports.debug = this.defaultArgs.debug;
module.exports.screenshots = this.defaultArgs.screenshots;
module.exports.visited = this.defaultArgs.visited;
module.exports.numVisited = this.defaultArgs.numVisited;
module.exports.followingPages = this.defaultArgs.followingPages;
module.exports.url = this.defaultArgs.url;
module.exports.baseUrl = this.defaultArgs.baseUrl;
module.exports.linkList = this.defaultArgs.linkList;
module.exports.errorList = this.defaultArgs.errorList;
module.exports.customers = this.defaultArgs.customers;
module.exports.startTime = this.defaultArgs.startTime;

/**
 * Set all arguments to default.
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
 * @param commands: {}
 * @returns {exports}
 */
module.exports.init = function (commands) {
  var startUrl = commands.startUrl || this.startUrl;
  var pageLimit = commands.pageLimit || this.pageLimit;
  var debug = commands.debug || this.debug;
  var screenshots = commands.screenshots || this.screenshots;

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
 * Creates lock file.
 */
module.exports.createLockFile = function () {
  fs.writeFileSync(lockFileName, new Date());
};

/**
 * Removes lock file.
 */
module.exports.removeLockFile = function () {
  fs.unlinkSync(lockFileName);
};

/**
 * Checks if lock file exists.
 */
module.exports.lockFileExists = function () {
  return fs.existsSync(lockFileName);
};