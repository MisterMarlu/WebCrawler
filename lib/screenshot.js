if (!String.prototype.splice) {
  /**
   * The splice() method changes the content of a string by removing a range of
   * characters and/or adding new characters.
   *
   * @this {String}
   * @param {number} start Index at which to start changing the string.
   * @param {number} delCount An integer indicating the number of old chars to remove.
   * @param {string} newSubStr The String that is spliced in.
   * @return {string} A new string with the spliced substring.
   */
  String.prototype.splice = function (start, delCount, newSubStr) {
    return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
  };
}

if (typeof __stack === 'undefined') {
  /**
   * Define __stack for __line.
   */
  Object.defineProperty(global, '__stack', {
    get: function () {
      let orig = Error.prepareStackTrace;
      Error.prepareStackTrace = function (_, stack) {
        return stack;
      };
      let err = new Error;
      Error.captureStackTrace(err, arguments.callee);
      let stack = err.stack;
      Error.prepareStackTrace = orig;
      return stack;
    }
  });

  if (typeof __line === 'undefined') {
    /**
     * Define __line for debugging.
     */
    Object.defineProperty(global, '__line', {
      get: function () {
        return __stack[1].getLineNumber();
      }
    });
  }
}

/**
 * Import modules.
 */
const {Chromeless} = require('chromeless'),
  {Spinner} = require('cli-spinner'),
  {spawn} = require('child_process'),
  {exec} = require('child_process'),
  axios = require('axios');

/**
 * Import custom modules.
 */
const {Output} = require(`${__dirname}/output`),
  {DB} = require(`${__dirname}/db`),
  {parseTime} = require(`${__dirname}/parser`),
  {isDebug} = require(`${__dirname}/parser`),
  {Global} = require(`${__dirname}/global`);

/**
 * Globals.
 */
let instance = {},
  moduleName = 'ScreenShot';

/**
 * Constants.
 */
const spinnerText = '%s Waiting for screenshots. ';

/**
 * Screenshot constructor.
 *
 * @returns {ScreenShot}
 * @constructor
 */
let ScreenShot = function () {
  if (!this instanceof ScreenShot) return new ScreenShot();
  if (instance instanceof ScreenShot) return instance;

  init(this);
  instance = this;

  return this;
};

/**
 * Set configurations.
 *
 * @param config: {{}}
 */
ScreenShot.prototype.setConfig = function (config) {
  if (typeof config !== 'object') {
    return;
  }

  for (let key in config) {
    if (config.hasOwnProperty(key)) {
      this[key] = config[key];
    }
  }
};

/**
 * Get all given screenshots.
 */
ScreenShot.prototype.init = function () {
  this.DB.find({}, {}, 'screenshots', function (error, result) {
    if (error) throw error;

    for (let i = 0; i < result.length; i += 1) {
      Global.get('screenshots').push(result[i].file_path);
    }
  });
};

/**
 * Kill all chrome processes.
 *
 * @param callback?: {function}
 */
ScreenShot.prototype.stopChrome = function (callback) {
  this.output.writeConsole(`ScreenShot.stopChrome - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  let self = this;

  exec('pgrep chrome', function (error, stdout, stderr) {
    if (error) self.output.writeConsole(`exec error: ${error}`, isDebug(Global.get('DEBUG'), moduleName), 'warning');

    if (typeof callback === 'function') {
      callback(error, stdout, stderr);
    }
  });
};

/**
 * Do a screenshot for each website that does not has an error.
 *
 * @param websites: {[{url: string, has_error: boolean, name: string, found_url: string}]}
 * @param callback?: {function}
 * @returns {string}
 */
ScreenShot.prototype.doScreenshots = async function (websites, callback) {
  this.output.writeConsole(`ScreenShot.doScreenshots - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  this.countUndone(websites);
  process.setMaxListeners(this.total);
  let tmpSpinner = null,
    stAdd = '',
    start = new Date(),
    chromeArgs = [
      '--headless',
      '--hide-scrollbars',
      '--remote-debugging-port=9222',
      '--disable-gpu'
    ];

  if (require("os").userInfo().username === 'root') chromeArgs.push('--no-sandbox');

  // Start server side Google Chrome.
  let chrome = spawn('google-chrome-stable', chromeArgs);

  for (let i = 0; i < websites.length; i += 1) {
    if (!websites[i].has_error) {
      for (let j = 0; j < this.dimensions.length; j += 1) {
        stAdd = ` (${this.undone} screenshot${((this.undone === 1) ? '' : 's')} remaining)`;
        tmpSpinner = new Spinner(spinnerText + stAdd);
        tmpSpinner.start();

        // Do the screenshot.
        await this.checkUrl(websites[i].url, websites[i], j, callback);
        tmpSpinner.stop(true);
      }
    }
  }

  // Stop server side Google Chrome.
  chrome.kill('SIGINT');

  let time = new Date() - start,
    t = parseTime(time),
    read = `${t.d} days, ${t.h}:${t.m}:${t.s}`;

  return {
    time,
    timeString: `Time for screenshotting: ${read}`,
    done: this.done,
    undone: this.undone,
    total: this.total
  };
};

/**
 * Check if the url is valid.
 *
 * @param url: {string}
 * @param website: {{url: string, has_error: boolean, name: string, found_url: string}}
 * @param dimIndex: {number}
 * @param callback?: {function}
 * @returns {Promise.<void>}
 */
ScreenShot.prototype.checkUrl = async function (url, website, dimIndex, callback) {
  this.output.writeConsole(`ScreenShot.checkUrl - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  let self = this;

  if (url.substr(0, 4) === 'http' && url.substr(0, 5) !== 'https') {
    url = url.splice(4, 0, 's'); // http -> https
  }

  if (url.substr(0, 4) !== 'http') {
    url = 'http://' + url;
  }

  await axios.get(url)
    .then(async function (response) {
      if (response.status !== 200) throw 'HTTP response is not ok';

      await self.screenshotting(website, dimIndex, callback);
      self.decreaseUndone();
    })
    .catch(async function (error) {
      if (url.substr(0, 5) !== 'https') {
        await instance.checkUrl(url, website, dimIndex, callback);
        return;
      }

      self.output.write(`Invalid url; ${url}`, isDebug(Global.get('DEBUG'), moduleName), 'warning');
      self.decreaseUndone();
    });
};

/**
 * Do a screenshot from a specific website.
 *
 * @param website: {{url: string, has_error: boolean, name: string, found_url: string}}
 * @param dimIndex: {number}
 * @param callback?: {function}
 * @returns {Promise.<void>}
 */
ScreenShot.prototype.screenshotting = async function (website, dimIndex, callback) {
  this.output.writeConsole(`ScreenShot.screenshotting - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  const chromeless = new Chromeless(this.chromeless);
  let name = this.getScreenshotName(website.url, website.name, dimIndex),
    url = 'http://' + website.url,
    elements = [],
    waitings = [],
    screenshotOptions = {
      filePath: this.screenshot.filePath + name + '.png'
    },
    insert = true;

  this.dimensions[dimIndex].scale = 1;
  for (let key in this.dimensions[dimIndex]) {
    if (this.dimensions[dimIndex].hasOwnProperty(key)) {
      this.dimensions[dimIndex][key] = parseInt(this.dimensions[dimIndex][key]);
    }
  }

  for (let i = 0; i < this.clicks.length; i += 1) {
    let tmpElement = await chromeless
      .goto(url)
      .wait(this.clicks[i].waitings.before)
      .exists(this.clicks[i].element);

    if (tmpElement) {
      elements.push(this.clicks[i].element);
      waitings.push(this.clicks[i].waitings);
    }
  }

  await chromeless.goto(url);

  for (let i = 0; i < elements.length; i += 1) {
    await chromeless
      .wait(waitings[i].before)
      .click(elements[i])
      .wait(waitings[i].after);
  }

  let screenshot = await chromeless
    .setViewport(this.dimensions[dimIndex])
    .wait(2000)
    .screenshot(screenshotOptions);

  if (Global.get('screenshots').indexOf(screenshot) <= 0) {
    Global.get('screenshots').push(screenshot);
    insert = false;
  }

  await chromeless.end();
  this.done += 1;
  this.output.write(`Added screenshot (${this.done}) ${screenshot}`);

  let oldObject = {file_path: screenshot},
    newObject = {
      url: website.found_url,
      file_path: screenshot,
      name: `${name}.png`,
      width: this.dimensions[dimIndex].width,
      height: this.dimensions[dimIndex].height,
    };

  if (insert) {
    this.DB.insert(newObject, 'screenshots', function (error, result) {
      if (error) throw error;

      if (typeof callback === 'function') {
        callback(website.found_url);
      }
    });

    return;
  }

  this.DB.update(oldObject, newObject, 'screenshots', async function (error, result) {
    if (error) throw error;

    if (typeof callback === 'function') {
      callback(website.found_url);
    }
  });
};

/**
 * Get name for this screenshot.
 *
 * @param url: {string}
 * @param pageName: {string}
 * @param dimIndex: {number}
 * @returns {string}
 */
ScreenShot.prototype.getScreenshotName = function (url, pageName, dimIndex) {
  this.output.writeConsole(`ScreenShot.getScreenshotName - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  if (typeof pageName === 'undefined') pageName = '';

  while (url.charAt((url.length - 1)) === '/') {
    url = url.slice(0, -1);
  }

  url = url.split('/');

  let i = 0;
  while (i < url.length) {
    if (url[i].length < 1) {
      url.shift();
    } else {
      break;
    }
  }

  let name = url[0];

  if (pageName.length > 0) name = `${pageName}.${name}`;

  name = `${this.dimensions[dimIndex].width}-${this.dimensions[dimIndex].height}.${name}`;

  return name;
};

/**
 * Decrease the number of undone screenshots.
 */
ScreenShot.prototype.decreaseUndone = function () {
  this.output.writeConsole(`ScreenShot.decreaseUndone - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  this.undone -= 1;

  if (this.undone <= 0) this.undone = 0;
};

/**
 * Decrease the number of undone screenshots.
 */
ScreenShot.prototype.countUndone = function (websites) {
  this.output.writeConsole(`ScreenShot.countUndone - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
  this.undone = 0;

  for (let i = 0; i < websites.length; i += 1) {
    if (!websites[i].hasError) {
      this.undone += 1;
    }
  }

  this.undone *= this.dimensions.length;
  this.total = this.undone;
};

exports.ScreenShot = ScreenShot;

/**
 * Initialize ScreenShot.
 *
 * @param s: {ScreenShot}
 */
function init(s) {
  Global.set('screenshots', []);
  s.chromeless = {};
  s.screenshot = {};
  s.undone = 0;
  s.total = 0;
  s.done = 0;
  s.output = new Output();
  s.DB = new DB();
  s.clicks = [];
  s.dimensions = [];
}