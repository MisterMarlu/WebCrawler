require(`${__dirname}/debugging`);

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

// Import modules.
const {Chromeless} = require('chromeless'),
  {Spinner} = require('cli-spinner'),
  {spawn, exec} = require('child_process'),
  axios = require('axios'),

  // Import custom modules.
  {Output} = require(`${__dirname}/output`),
  {DB} = require(`${__dirname}/db`),
  {parseTime} = require(`${__dirname}/parser`),
  {Helper} = require(`${__dirname}/helper`),
  {Global} = require(`${__dirname}/global`),
  {Module} = require(`${__dirname}/module`);

let instance = null,
  moduleName = 'ScreenShot',
  spinnerText = '%s Waiting for screenshots. ';

/**
 * Class ScreenShot.
 */
class ScreenShot extends Module {

  /**
   * ScreenShot constructor.
   *
   * @returns {*}
   */
  constructor() {
    super();

    if (instance instanceof ScreenShot) return instance;
    if (!(this instanceof ScreenShot)) return new ScreenShot();

    Global.set('screenshots', []);
    this.chromeless = {};
    this.screenshot = {};
    this.undone = 0;
    this.total = 0;
    this.done = 0;
    this.output = new Output();
    this.DB = new DB();
    this.clicks = [];
    this.dimensions = [];

    instance = this;
    return this;
  }

  /**
   * Get all given screenshots.
   */
  init() {
    this.DB.findAll('screenshots', (err, res) => {
      for (let i = 0; i < res.length; i += 1) {
        Global.get('screenshots').push(res[i].name);
      }
    });
  }

  /**
   * Kill all Google Chrome processes.
   *
   * @param callback?: Function
   */
  stopChrome(callback = (err, stdout, stderr) => {}) {
    this.output.writeConsole(`${moduleName}.stopChrome - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');

    exec('pkill chrome', (err, stdout, stderr) => {
      if (err) self.output.writeConsole(`exec error: ${err}`, Helper.isDebug(moduleName), 'warning');

      callback(err, stdout, stderr);
    });
  }

  /**
   * Do a screenshot for each website that does not has an error.
   *
   * @param websites: [{{url: string, has_error: boolean, name: string, found_url: string}}]
   * @param callback: Function
   * @returns {Promise<{time: number, timeString: string, done: number, undone: number|*, total: number|*}>}
   */
  async doScreenshots(websites, callback) {
    this.output.writeConsole(`${moduleName}.doScreenshots - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    this.countUndone(websites);
    process.setMaxListeners(this.total);

    let tmpSpinner = null,
      strAdd = '',
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
      if (websites[i].has_error) continue;
      for (let j = 0; j < this.dimensions.length; j += 1) {
        strAdd = ` (${this.undone} screenshot${((this.undone === 1) ? '' : 's')} remaining)`;
        tmpSpinner = new Spinner(spinnerText + strAdd);
        tmpSpinner.start();

        // Do the screenshot.
        await this.checkUrl(websites[i].url, websites[i], j, callback);
        tmpSpinner.stop(true);
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
  }

  /**
   * Check if the url is accessible.
   *
   * @param url: String
   * @param website: {{url: string, has_error: boolean, name: string, found_url: string}}
   * @param dimIndex: Number
   * @param callback?: Function
   * @returns {Promise<void>}
   */
  async checkUrl(url, website, dimIndex, callback = (url) => {}) {
    this.output.writeConsole(`${moduleName}.checkUrl - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');

    if (url.substr(0, 4) === 'http' && url.substr(0, 5) !== 'https') {
      url = url.splice(4, 0, 's'); // http -> https
    }

    if (url.substr(0, 4) !== 'http') {
      url = 'http://' + url;
    }

    await axios.get(url)
      .then(async response => {
        if (response.status !== 200) throw 'HTTP response is not ok';

        await this.screenshotting(website, dimIndex, callback);
        this.decreaseUndone();
      })
      .catch(async error => {
        if (url.substr(0, 5) !== 'https') {
          await this.checkUrl(url, website, dimIndex, callback);
          return;
        }

        this.output.write(`Invalid url; ${url}`, Helper.isDebug(moduleName), 'warning');
        this.decreaseUndone();
      });
  }

  /**
   * Do a screenshot from a specific website.
   *
   * @param website: {{url: string, has_error: boolean, name: string, found_url: string}}
   * @param dimIndex: Number
   * @param callback?: Function
   * @returns {Promise<void>}
   */
  async screenshotting(website, dimIndex, callback) {
    this.output.writeConsole(`${moduleName}.screenshotting - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    const chromeless = new Chromeless(this.chromeless);

    let name = this.getScreenshotName(website.url, website.name, dimIndex),
      url = `http://${website.url}`,
      elements = [],
      waitings = [],
      screenshotOptions = {
        filePath: `${this.screenshot.filePath}${name}.png`,
      },
      insert = false;

    if (Global.get('screenshots').indexOf(`${name}.png`) === -1) {
      Global.get('screenshots').push(`${name}.png`);
      insert = true;
    }

    this.dimensions[dimIndex].scale = 1;
    for (let key in this.dimensions[dimIndex]) {
      if (this.dimensions[dimIndex].hasOwnProperty(key)) {
        this.dimensions[dimIndex][key] = parseInt(this.dimensions[dimIndex][key]);
      }
    }

    // Check which elements exists.
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

    await chromeless
      .goto(url)
      .setViewport(this.dimensions[dimIndex]);

    for (let i = 0; i < elements.length; i += 1) {
      await chromeless
        .wait(waitings[i].before)
        .click(elements[i])
        .wait(waitings[i].after);
    }

    let screenshot = await chromeless
      .wait(2000)
      .screenshot(screenshotOptions);

    await chromeless.end();
    this.done += 1;

    let filter = {file_path: screenshot},
      update = {
        url: website.found_url,
        file_path: screenshot,
        name: `${name}.png`,
        width: this.dimensions[dimIndex].width,
        height: this.dimensions[dimIndex].height,
      };

    if (insert) {
      this.DB.insert(update, 'screenshots', (err, res) => {
        this.output.write(`Added new screenshot (${this.done}) ${screenshot}`);
        callback(website.found_url);
      });

      return;
    }

    this.DB.update(filter, update, 'screenshots', (err, res) => {
      this.output.write(`Updated screenshot (${this.done}) ${screenshot}`);
      callback(website.found_url);
    });
  }

  /**
   * Get the name for this screenshot.
   *
   * @param url: String
   * @param pageName: String
   * @param dimIndex: Number
   * @returns {string}
   */
  getScreenshotName(url, pageName, dimIndex) {
    this.output.writeConsole(`${moduleName}.getScreenshotName - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');

    while (url.charAt((url.length - 1)) === '/') {
      url = url.slice(0, -1);
    }

    url = url.split('/');

    for (let i = 0; i < url.length; i += 1) {
      if (url[i].length > 0) break;
      url.shift();
    }

    let name = url[0];

    if (pageName.length > 0) name = `${pageName}.${name}`;
    name = `${this.dimensions[dimIndex].width}-${this.dimensions[dimIndex].height}.${name}`;

    return name;
  }

  /**
   * Decrease the number of undone screenshots.
   */
  decreaseUndone() {
    this.output.writeConsole(`${moduleName}.decreaseUndone - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    this.undone -= 1;

    if (this.undone <= 0) this.undone = 0;
  }

  /**
   * Count the number of undone screenshots.
   *
   * @param websites: {{url: string, has_error: boolean, name: string, found_url: string}}
   */
  countUndone(websites) {
    this.output.writeConsole(`${moduleName}.countUndone - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    this.undone = 0;

    for (let i = 0; i < websites.length; i += 1) {
      if (!websites[i].has_error) {
        this.undone += 1;
      }
    }

    this.undone *= this.dimensions.length;
    this.total = this.undone;
  }
}

exports.ScreenShot = ScreenShot;