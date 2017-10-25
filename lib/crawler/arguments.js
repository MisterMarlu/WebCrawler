/**
 * Import modules.
 */
const fs = require('fs');

/**
 * Name of the lock file.
 * @type {string}
 */
const lockFileName = 'oop-crawler.lock';

/**
 * Storage for user input.
 * @type {{}}
 */
exports.commands = {};

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
 *  followingPages: array,
 *  url: {},
 *  baseUrl: string,
 *  linkList: {
 *    typeAbsolute: array,
 *    typeRelative: array
 *  },
 *  errorList: {},
 *  customers: {
 *    withWebsite: array,
 *    withoutWebsite: array
 *  },
 *  startTime: int
 *  }}
 */
exports.defaultArgs = {
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
exports.startUrl = this.defaultArgs.startUrl;
exports.pageLimit = this.defaultArgs.pageLimit;
exports.debug = this.defaultArgs.debug;
exports.screenshots = this.defaultArgs.screenshots;
exports.visited = this.defaultArgs.visited;
exports.numVisited = this.defaultArgs.numVisited;
exports.followingPages = this.defaultArgs.followingPages;
exports.url = this.defaultArgs.url;
exports.baseUrl = this.defaultArgs.baseUrl;
exports.linkList = this.defaultArgs.linkList;
exports.errorList = this.defaultArgs.errorList;
exports.customers = this.defaultArgs.customers;
exports.startTime = this.defaultArgs.startTime;

/**
 * Set all arguments to default.
 */
exports.setDefault = function () {
  for (let key in this.defaultArgs) {
    if (this.defaultArgs.hasOwnProperty(key)) {
      this[key] = this.defaultArgs[key];
    }
  }
};

/**
 * Creates lock file.
 */
exports.createLockFile = function () {
  fs.writeFileSync(lockFileName, new Date());
};

/**
 * Removes lock file.
 */
exports.removeLockFile = function () {
  fs.unlinkSync(lockFileName);
};

/**
 * Checks if lock file exists.
 */
exports.hasLockFile = function () {
  return fs.existsSync(lockFileName);
};